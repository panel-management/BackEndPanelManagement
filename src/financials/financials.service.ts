import { forwardRef, HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import {
  MasterPlanType,
  PaymentMethod,
  Prisma,
  SubscriptionPaymentStatus,
  TicketStatus,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { CreateSubscriptionPaymentDto } from './dto/create-subscription-payment.dto';
import { ReviewSubscriptionPaymentDto } from './dto/review-subscription-payment.dto';
import { CreateMasterPlanDto } from 'src/users/master/dto/create-master-plan.dto';
import { UpdateMasterPlanDto } from 'src/users/master/dto/update-master-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { RejectPaymentDto } from './dto/reject-payment.dto';
import { SmsService } from 'src/sms/sms.service';
import { UsersService } from 'src/users/users.service';
import { Role } from 'src/auth/enums/role.enum';
import { Cron } from '@nestjs/schedule';
import { PaginationQueryDto } from 'src/common/dto/pagination.dto';
import { fileUtils } from 'src/common/utils/file-upload.util';

@Injectable()
export class FinancialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly smsService: SmsService,
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,
  ) {}

  private readonly logger = new Logger(FinancialsService.name);

  // Daily cron job to automatically generate renewal fees for expiring subscriptions and notify students.
  @Cron('59 23 * * *', { timeZone: 'Asia/Tehran' })
  async generateFutureFees() {
    this.logger.log('شروع عملیات تولید فاکتور');
    const students = await this.prisma.users.findMany({
      where: {
        type: Role.Student,
        assignedPlan: { isNot: null },
        planEndsAt: { not: null },
      },
      include: {
        assignedPlan: true,
        master: { select: { user_id: true } },
      },
    });

    const now = new Date();
    const smsPromises: Promise<any>[] = [];

    for (const student of students) {
      if (!student.planEndsAt || !student.assignedPlan) continue;

      const planEndsAt = new Date(student.planEndsAt!);
      const daysToEnd = Math.floor((planEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const daysSinceLastFee = student.lastFeeGenerated
        ? Math.floor(
            (now.getTime() - new Date(student.lastFeeGenerated).getTime()) / (1000 * 60 * 60 * 24),
          )
        : 0;

      if (
        student.assignedPlan &&
        daysToEnd <= 7 &&
        daysSinceLastFee >= student.assignedPlan.durationInDays - 7
      ) {
        const nextDueDate = new Date(planEndsAt);
        nextDueDate.setDate(nextDueDate.getDate() + student.assignedPlan.durationInDays);

        const existingTx = await this.prisma.transaction.findFirst({
          where: {
            studentId: student.user_id,
            planId: student.assignedPlan.id,
            dueDate: nextDueDate,
            type: TransactionType.FEE,
          },
        });

        if (existingTx) continue;

        const status = daysToEnd === 7 ? TransactionStatus.UPCOMING : TransactionStatus.PENDING;

        const newTransaction = await this.prisma.transaction.create({
          data: {
            type: TransactionType.FEE,
            status: status,
            amount: student.assignedPlan.price,
            description: `شهریه ماه بعدی برای ${student.assignedPlan.name}`,
            dueDate: nextDueDate,
            studentId: student.user_id,
            creatorId: student.master?.user_id ?? 0,
            planId: student.assignedPlan.id,
          },
        });

        await this.prisma.users.update({
          where: { user_id: student.user_id },
          data: { lastFeeGenerated: now },
        });

        if (student.phoneNumber) {
          const formattedAmount = Number(newTransaction.amount).toLocaleString('fa-IR');
          const formattedDueDate = nextDueDate.toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
          const messageType = status === TransactionStatus.UPCOMING ? ' (آینده)' : '';
          const message = `هنرجوی عزیز ${student.fullName} سلام
شهریه ماه بعدی${messageType} به مبلغ ${formattedAmount} تومان برای پلن "${student.assignedPlan.name}" ثبت شد.
مهلت پرداخت: ${formattedDueDate}
لطفاً برای ادامه دسترسی، پرداخت کنید.`;

          smsPromises.push(this.smsService.sendMessageToUser(student.phoneNumber, message));
        }
      }
    }
    await Promise.allSettled(smsPromises);
    this.logger.log(`Generated fees and processed ${smsPromises.length} SMS notifications.`);
  }

  // Daily cron job to send SMS reminders for upcoming plan expirations or notify about expired plans.
  @Cron('59 23 * * *', { timeZone: 'Asia/Tehran' })
  async sendPlanExpirationReminders() {
    this.logger.log('شروع عملیات ارسال یادآوری انقضای پلن');
    const students = await this.prisma.users.findMany({
      where: {
        type: Role.Student,
        planEndsAt: { not: null },
      },
      include: {
        assignedPlan: true,
      },
    });

    const now = new Date();
    const smsPromises: Promise<any>[] = [];

    for (const student of students) {
      if (!student.planEndsAt || !student.assignedPlan) continue;

      const planEndsAt = new Date(student.planEndsAt);
      const daysToEnd = Math.floor((planEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const reminderDays = Math.min(
        7,
        Math.max(1, Math.floor(student.assignedPlan.durationInDays * 0.2)),
      );

      let message = '';

      if (daysToEnd === reminderDays) {
        message = `هنرجوی عزیز ${student.fullName} سلام
پلن شما "${student.assignedPlan.name}" در ${reminderDays} روز آینده به پایان می‌رسد. لطفاً برای تمدید اقدام کنید.`;
      }

      if (daysToEnd < 0) {
        message = `هنرجوی عزیز ${student.fullName} سلام
پلن شما "${student.assignedPlan.name}" منقضی شده است. لطفاً برای تمدید با مدیر تماس بگیرید.`;
      }

      if (message && student.phoneNumber) {
        smsPromises.push(this.smsService.sendMessageToUser(student.phoneNumber, message));
      }
    }
    await Promise.allSettled(smsPromises);
    this.logger.log(`Sent ${smsPromises.length} expiration reminders.`);
  }

  // Bi-daily cron job to aggregate unpaid fees and send payment reminders to indebted students.
  @Cron('0 11 */1 * *', { timeZone: 'Asia/Tehran' })
  async sendDebtReminders() {
    this.logger.log('شروع عملیات ارسال یادآوری بدهی');
    const students = await this.prisma.users.findMany({
      where: {
        type: Role.Student,
        studentTransactions: {
          some: {
            status: TransactionStatus.UNPAID,
            type: TransactionType.FEE,
          },
        },
      },
      include: {
        studentTransactions: {
          where: {
            status: TransactionStatus.UNPAID,
            type: TransactionType.FEE,
          },
        },
      },
    });

    const smsPromises: Promise<any>[] = [];

    for (const student of students) {
      const unpaidFees = student.studentTransactions;
      if (unpaidFees.length === 0) continue;

      const totalDebt = unpaidFees.reduce((sum, t) => sum + t.amount.toNumber(), 0);
      const formattedDebt = totalDebt.toLocaleString('fa-IR');

      const message = `هنرجوی عزیز ${student.fullName} سلام
شما ${unpaidFees.length} شهریه پرداخت نشده به مبلغ کل ${formattedDebt} تومان دارید. لطفاً در اسرع وقت پرداخت کنید تا دسترسی شما محدود نشود.`;

      if (student.phoneNumber) {
        smsPromises.push(this.smsService.sendMessageToUser(student.phoneNumber, message));
      }
    }
    await Promise.allSettled(smsPromises);
    this.logger.log(`Sent ${smsPromises.length} debt reminders.`);
  }

  // methods for master to manage student plan

  // create plan student for master
  async createPlanStudent(masterId: number, createPlanDto: CreatePlanDto) {
    const master = await this.prisma.users.findUnique({
      where: { user_id: masterId },
    });

    if (!master) {
      throw new HttpException('کاربری با این مشخصات یافت نشد', HttpStatus.NOT_FOUND);
    }

    if (master.type !== Role.Master) {
      throw new HttpException('فقط استاد می‌تواند پلن ایجاد کند', HttpStatus.FORBIDDEN);
    }

    const plan = await this.prisma.$transaction(async (tx) => {
      if (createPlanDto.isDefault) {
        await tx.plan.updateMany({
          where: { masterId: masterId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return await tx.plan.create({
        data: {
          masterId: masterId,
          name: createPlanDto.name,
          description: createPlanDto.description,
          price: createPlanDto.price,
          durationInDays: createPlanDto.durationInDays,
          isDefault: createPlanDto.isDefault,
        },
      });
    });

    return {
      statusCode: HttpStatus.CREATED,
      message: 'پلن با موفقیت ایجاد شد',
      data: plan,
    };
  }

  // get all plans student for master
  async findAllPlans(masterId: number) {
    const master = await this.prisma.users.findUnique({
      where: { user_id: masterId },
      select: { type: true },
    });

    if (!master) {
      throw new HttpException('کاربری با این مشخصات یافت نشد', HttpStatus.NOT_FOUND);
    }

    if (master.type !== Role.Master) {
      throw new HttpException('شما مجاز به مشاهده پلن‌ها نیستید', HttpStatus.FORBIDDEN);
    }

    const plans = await this.prisma.plan.findMany({
      where: {
        masterId: masterId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        durationInDays: true,
        price: true,
        isDefault: true,
        transactions: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'پلن ها با موفقیت دریافت شدند',
      data: plans,
    };
  }

  // get plan by id for master
  async findPlanById(planId: number) {
    return this.prisma.plan.findUnique({
      where: { id: planId },
    });
  }

  // update plan student for master
  async updatePlanStudent(planId: number, masterId: number, updatePlanDto: UpdatePlanDto) {
    const findPlanStudent = await this.findPlanById(planId);

    if (!findPlanStudent) {
      throw new HttpException('پلن یافت نشد لطف مجدد امتحان کنید', HttpStatus.NOT_FOUND);
    }

    if (findPlanStudent.masterId !== masterId) {
      throw new HttpException('شما مجاز به ویرایش این طرح نیستید', HttpStatus.NOT_FOUND);
    }

    const updatePlan = await this.prisma.plan.update({
      where: { id: planId },
      data: {
        masterId: masterId,
        name: updatePlanDto.name,
        description: updatePlanDto.description,
        price: updatePlanDto.price,
        durationInDays: updatePlanDto.durationInDays,
      },
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'طرح با موفقیت اپدیت شد',
      data: updatePlan,
    };
  }

  // delete plan student for master
  async deletePlanStudent(planId: number, masterId: number) {
    const findPlanStudent = await this.findPlanById(planId);

    if (!findPlanStudent) {
      throw new HttpException('پلن یافت نشد لطف مجدد امتحان کنید', HttpStatus.NOT_FOUND);
    }

    if (findPlanStudent.masterId !== masterId) {
      throw new HttpException('شما مجاز به حذف این طرح نیستید', HttpStatus.FORBIDDEN);
    }

    const deletePlan = await this.prisma.plan.delete({
      where: { id: planId },
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'طرح با موفقیت حذف شد',
      data: deletePlan,
    };
  }

  // get master plan by id
  async findMasterPlanById(planId: number) {
    return this.prisma.masterPlan.findUnique({
      where: { id: planId },
    });
  }

  // methods for admin to manage master plan

  // list all plan active and disable
  async findAllMasterPlansForAdmin() {
    const planMaster = await this.prisma.masterPlan.findMany();

    return {
      statusCode: HttpStatus.OK,
      message: 'لیست پلن ها با موفقیت دریافت شد',
      data: planMaster,
    };
  }

  // list all plan active
  async findActiveMasterPlans() {
    const planMaster = await this.prisma.masterPlan.findMany({
      where: { isActive: true },
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'لیست پلن های با موفقیت یافت شد',
      data: planMaster,
    };
  }

  // create plan for master
  async createMasterPlan(createDto: CreateMasterPlanDto) {
    if (createDto.type === MasterPlanType.PAID) {
      if (createDto.price === undefined || createDto.price === null || createDto.price <= 0) {
        throw new HttpException(
          'برای پلن‌های پولی، وارد کردن قیمت الزامی است',
          HttpStatus.BAD_REQUEST,
        );
      }
    } else {
      createDto.price = 0;
    }

    if (createDto.price >= 10000000000) {
      throw new HttpException('قیمت وارد شده بیش از حد مجاز است', HttpStatus.BAD_REQUEST);
    }

    const createPlan = await this.prisma.masterPlan.create({
      data: {
        name: createDto.name,
        description: createDto.description,
        features: createDto.features,
        type: createDto.type,
        durationInDays: createDto.durationInDays,
        price: createDto.price,
      },
    });

    return {
      statusCode: HttpStatus.CREATED,
      message: 'پلن  با موفقیت ایجاد شد',
      data: createPlan,
    };
  }

  // update plan master in admin
  async updateMasterPlan(planId: number, updateDto: UpdateMasterPlanDto) {
    const findPlanMaster = await this.findMasterPlanById(planId);

    if (!findPlanMaster) {
      throw new HttpException('پلن یافت نشد لطف مجدد امتحان کنید', HttpStatus.NOT_FOUND);
    }

    const newType = updateDto.type ?? findPlanMaster.type;
    const newPrice = updateDto.price ?? findPlanMaster.price;

    if (newType === MasterPlanType.PAID && (newPrice === null || Number(newPrice) <= 0)) {
      throw new HttpException(
        'برای پلن‌های پولی، قیمت باید بیشتر از صفر باشد',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (newType !== MasterPlanType.PAID && updateDto.type) {
      updateDto.price = 0;
    }

    const planMaster = await this.prisma.masterPlan.update({
      where: { id: planId },
      data: updateDto,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'پلن با موفقیت اپدیت شد',
      data: planMaster,
    };
  }

  // delete plan master in admin
  async deleteMasterPlan(planId: number) {
    const assignedUsersCount = await this.prisma.users.count({
      where: { masterPlanId: planId },
    });

    if (assignedUsersCount > 0) {
      throw new HttpException(
        `امکان حذف این پلن وجود ندارد زیرا ${assignedUsersCount} کاربر در حال حاضر از آن استفاده می‌کنند`,
        HttpStatus.CONFLICT,
      );
    }

    const pendingPaymentsCount = await this.prisma.subscriptionPayment.count({
      where: {
        planId: planId,
        status: SubscriptionPaymentStatus.PENDING,
      },
    });

    if (pendingPaymentsCount > 0) {
      throw new HttpException(
        `این پلن دارای ${pendingPaymentsCount} درخواست پرداخت در انتظار تایید است. ابتدا تکلیف پرداخت‌ها را روشن کنید.`,
        HttpStatus.CONFLICT,
      );
    }

    const findPlanMaster = await this.findMasterPlanById(planId);

    if (!findPlanMaster) {
      throw new HttpException('پلن یافت نشد لطف مجدد امتحان کنید', HttpStatus.NOT_FOUND);
    }

    const planMaster = await this.prisma.masterPlan.delete({
      where: { id: planId },
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'پلن با موفقیت حذف شد',
      data: planMaster,
    };
  }

  // method finacial for admin and master

  // create equipment transaction for student
  async createEquipmentTransaction(masterId: number, createEquipmentDto: CreateEquipmentDto) {
    const student = await this.prisma.users.findUnique({
      where: { user_id: createEquipmentDto.studentId },
    });

    if (!student) {
      throw new HttpException('هنرجوی با این شناسه یافت نشد', HttpStatus.NOT_FOUND);
    }

    if (student.masterId !== masterId) {
      throw new HttpException('شما مجاز به ثبت هزینه برای این هنرجو نیستید', HttpStatus.FORBIDDEN);
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const createTransaction = await this.prisma.transaction.create({
      data: {
        type: TransactionType.EQUIPMENT,
        status: TransactionStatus.PENDING,
        amount: createEquipmentDto.amount,
        description: createEquipmentDto.description,
        dueDate: dueDate,
        studentId: createEquipmentDto.studentId,
        creatorId: masterId,
      },
    });

    if (student.phoneNumber) {
      const formattedAmount = Number(createTransaction.amount).toLocaleString('fa-IR');
      const formattedDueDate = dueDate.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      await this.smsService.sendMessageToUser(
        student.phoneNumber,
        `هنرجوی عزیز سلام ${student.fullName}
یک هزینه جدید برای ${createTransaction.description} به مبلغ ${formattedAmount} تومان برای شما ثبت شد.
مهلت پرداخت: ${formattedDueDate}`,
      );
    }

    return {
      statusCode: HttpStatus.CREATED,
      message: 'تراکنش با موفقیت ایجاد شد',
      data: createTransaction,
    };
  }

  // confirm manual payment for student
  async confirmManualPayment(
    transactionId: number,
    confirmerId: number,
    confirmPaymentDto: ConfirmPaymentDto,
  ) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        student: {
          select: {
            user_id: true,
            fullName: true,
            phoneNumber: true,
            planEndsAt: true,
          },
        },
        plan: true,
      },
    });

    if (!transaction) {
      throw new HttpException('تراکنش یافت نشد', HttpStatus.NOT_FOUND);
    }

    if (transaction.status === TransactionStatus.PAID) {
      throw new HttpException('این تراکنش قبلاً پرداخت شده است', HttpStatus.BAD_REQUEST);
    }

    const updatedTransaction = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: TransactionStatus.PAID,
        paymentMethod: PaymentMethod.CASH,
        paymentDate: confirmPaymentDto.paymentDate || new Date(),
        confirmerId: confirmerId,
      },
    });

    let newEndDate: Date | null = null;

    if (transaction.type === TransactionType.FEE && transaction.planId) {
      const startDate = transaction.student.planEndsAt
        ? new Date(transaction.student.planEndsAt)
        : new Date();

      newEndDate = new Date(startDate);
      newEndDate.setDate(newEndDate.getDate() + (transaction.plan?.durationInDays || 0));

      await this.prisma.users.update({
        where: { user_id: transaction.student.user_id },
        data: {
          assignedPlan: { connect: { id: transaction.planId } },
          planEndsAt: newEndDate,
          lastFeeGenerated: new Date(),
        },
      });
    }

    if (transaction.student?.phoneNumber) {
      const typeText = transaction.type === TransactionType.FEE ? 'شهریه' : 'خرید تجهیزات';
      let extra = '';
      if (transaction.type === TransactionType.FEE && newEndDate) {
        extra = `\nتاریخ پایان پلن جدید: ${newEndDate.toLocaleDateString('fa-IR')}`;
      }
      await this.smsService.sendMessageToUser(
        transaction.student.phoneNumber,
        `سلام ${transaction.student.fullName} عزیز
پرداخت ${typeText} به مبلغ ${Number(transaction.amount).toLocaleString('fa-IR')} تومان تایید شد.${extra}`,
      );
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'تراکنش با موفقیت تایید شد',
      data: updatedTransaction,
    };
  }

  // reject manual payment for student
  async rejectManualPayment(transactionId: number, rejectDto: RejectPaymentDto) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        student: {
          select: { phoneNumber: true, fullName: true },
        },
      },
    });

    if (!transaction) {
      throw new HttpException('تراکنش یافت نشد', HttpStatus.NOT_FOUND);
    }

    if (transaction.status === TransactionStatus.PAID) {
      throw new HttpException(
        'این تراکنش قبلاً تایید شده و نمی‌توان رد کرد',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: TransactionStatus.UNPAID,
      },
    });

    if (transaction.student?.phoneNumber) {
      const transactionType = transaction.type === TransactionType.FEE ? 'شهریه' : 'خرید تجهیزات';
      const reasonText = rejectDto.reason ? `\nدلیل: ${rejectDto.reason}` : '';
      await this.smsService.sendMessageToUser(
        transaction.student.phoneNumber,
        `سلام ${transaction.student.fullName} عزیز
پرداخت${transactionType} شما به مبلغ ${Number(transaction.amount).toLocaleString('fa-IR')} تومان رد شد و معتبر نیست. لطفا مجددا اقدام کنید.${reasonText}`,
      );
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'تراکنش با موفقیت رد شد',
    };
  }

  // get master transactions
  async getMasterTransactions(masterId: number, pageQueryDto: PaginationQueryDto) {
    const { page = 1, limit = 10 } = pageQueryDto;
    const skip = (page - 1) * limit;

    const whereClause = {
      student: {
        masterId: masterId,
        type: Role.Student,
      },
    };

    const [total, transactions] = await this.prisma.$transaction([
      this.prisma.transaction.count({ where: whereClause }),
      this.prisma.transaction.findMany({
        where: whereClause,
        select: {
          id: true,
          amount: true,
          description: true,
          dueDate: true,
          paymentDate: true,
          type: true,
          status: true,
          paymentMethod: true,
          student: { select: { fullName: true } },
          plan: { select: { name: true } },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: skip,
        take: limit,
      }),
    ]);

    const [totalAmount, paidFees, unpaidFees, equipmentIncome] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: whereClause,
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          ...whereClause,
          type: TransactionType.FEE,
          status: TransactionStatus.PAID,
        },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          ...whereClause,
          type: TransactionType.FEE,
          status: {
            in: [TransactionStatus.UNPAID, TransactionStatus.PENDING],
          },
        },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          ...whereClause,
          type: TransactionType.EQUIPMENT,
          status: TransactionStatus.PAID,
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      statusCode: HttpStatus.OK,
      message: 'تراکنش‌ ها با موفقیت دریافت شدند',
      data: {
        transactions,
        generalSum: {
          totalAmount: totalAmount._sum.amount?.toNumber() || 0,
          paidFees: paidFees._sum.amount?.toNumber() || 0,
          unpaidFees: unpaidFees._sum.amount?.toNumber() || 0,
          equipmentIncome: equipmentIncome._sum.amount?.toNumber() || 0,
        },
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // get student transactions
  async getStudentTransactions(studentId: number, pageQueryDto: PaginationQueryDto) {
    const { page = 1, limit = 10 } = pageQueryDto;
    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = {
      studentId: studentId,
    };

    const [total, transactions] = await this.prisma.$transaction([
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.findMany({
        where,
        select: {
          id: true,
          amount: true,
          description: true,
          dueDate: true,
          paymentDate: true,
          type: true,
          status: true,
          paymentMethod: true,
          plan: { select: { name: true } },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: skip,
        take: limit,
      }),
    ]);

    const formattedData = transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
      plan: t.plan,
    }));

    return {
      statusCode: HttpStatus.OK,
      message: 'تراکنش‌ ها با موفقیت دریافت شدند',
      data: formattedData,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // data dashboard for master
  async getMasterDashboard(masterId: number) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const baseWhere = {
      student: { masterId: masterId },
    };

    const [
      paidStats,
      unpaidStats,
      pendingStats,
      upcomingStats,
      feeRevenue,
      equipmentRevenue,
      totalStudents,
      totalCoaches,
      currentMonthRevenue,
      openTickets,
    ] = await Promise.all([
      // 1. Total revenue (PAID transactions)
      this.prisma.transaction.aggregate({
        where: { ...baseWhere, status: TransactionStatus.PAID },
        _sum: { amount: true },
      }),
      // 2. Unpaid debts summary (Total & Count)
      this.prisma.transaction.aggregate({
        where: { ...baseWhere, status: TransactionStatus.UNPAID },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // 3. Pending transactions summary
      this.prisma.transaction.aggregate({
        where: { ...baseWhere, status: TransactionStatus.PENDING },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // 4. Upcoming transactions summary
      this.prisma.transaction.aggregate({
        where: { ...baseWhere, status: TransactionStatus.UPCOMING },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // 5. Revenue from Tuition Fees (Specifically PAID)
      this.prisma.transaction.aggregate({
        where: {
          ...baseWhere,
          status: TransactionStatus.PAID,
          type: TransactionType.FEE,
        },
        _sum: { amount: true },
      }),
      // 6. Revenue from Equipment Sales (Specifically PAID)
      this.prisma.transaction.aggregate({
        where: {
          ...baseWhere,
          status: TransactionStatus.PAID,
          type: TransactionType.EQUIPMENT,
        },
        _sum: { amount: true },
      }),
      // total user student himself master
      this.prisma.users.count({
        where: {
          masterId: masterId,
          type: Role.Student,
        },
      }),
      // total user coach himself master
      this.prisma.users.count({
        where: {
          masterId: masterId,
          type: Role.Coach,
        },
      }),
      // total trasaction just one moun
      this.prisma.transaction.aggregate({
        where: {
          ...baseWhere,
          status: TransactionStatus.PAID,
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),
      // total open ticket master
      this.prisma.ticket.count({
        where: {
          userId: masterId,
          status: TicketStatus.OPEN,
        },
      }),
    ]);

    const dashboardData = {
      statusData: {
        paid: Number(paidStats._sum.amount || 0),
        unpaid: Number(unpaidStats._sum.amount || 0),
        pending: Number(pendingStats._sum.amount || 0),
        upcoming: Number(upcomingStats._sum.amount || 0),
        counts: {
          unpaid: Number(unpaidStats._count.id || 0),
          pending: Number(pendingStats._count.id || 0),
          upcoming: Number(upcomingStats._count.id || 0),
        },
      },
      chartData: [
        { name: 'شهریه', value: Number(feeRevenue._sum.amount || 0) },
        { name: 'تجهیزات', value: Number(equipmentRevenue._sum.amount || 0) },
      ],
      cards: {
        totalStudents: totalStudents || 0,
        totalCoaches: totalCoaches || 0,
        currentMonthRevenue: Number(currentMonthRevenue._sum.amount || 0),
        openTickets: openTickets || 0,
      },
    };

    return {
      statusCode: HttpStatus.OK,
      message: 'اطلاعات داشبورد با موفقیت دریافت شد',
      data: dashboardData,
    };
  }

  // data dashboard for admin
  async getAdminDashboard() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [pendingRevenueThisMonth, confirmedRevenueThisMonth, rejectRevenueThisMonth] =
      await Promise.all([
        // General payment figures pending confirmation
        // ۱. مجموع درآمد ئر حال انتظار از اشتراک‌ها در ماه جاری
        this.prisma.subscriptionPayment.aggregate({
          where: {
            status: SubscriptionPaymentStatus.PENDING,
            createdAt: { gte: startOfMonth },
          },
          _sum: { amount: true },
          _count: { id: true },
        }),
        // Total confirmed income from subscriptions in the current month
        // ۲. مجموع درآمد تایید شده از اشتراک‌ها در ماه جاری
        this.prisma.subscriptionPayment.aggregate({
          where: {
            status: SubscriptionPaymentStatus.CONFIRMED,
            updatedAt: { gte: startOfMonth },
          },
          _sum: { amount: true },
          _count: { id: true },
        }),
        // Total reject income from subscriptions in the current month
        // ۲. مجموع درآمد رد شده از اشتراک‌ها در ماه جاری
        this.prisma.subscriptionPayment.aggregate({
          where: {
            status: SubscriptionPaymentStatus.REJECTED,
            updatedAt: { gte: startOfMonth },
          },
          _sum: { amount: true },
          _count: { id: true },
        }),
      ]);

    const dashboardData = {
      statusData: {
        pendingRevenue: Number(pendingRevenueThisMonth._sum.amount || 0),
        confirmedRevenue: Number(confirmedRevenueThisMonth._sum.amount || 0),
        rejectRevenue: Number(rejectRevenueThisMonth._sum.amount || 0),
        counts: {
          pendingCount: Number(pendingRevenueThisMonth._count.id),
          confirmedCount: Number(confirmedRevenueThisMonth._count.id),
          rejectCount: Number(rejectRevenueThisMonth._count.id),
        },
      },
    };

    return {
      statusCode: HttpStatus.OK,
      message: 'اطلاعات داشبورد با موفقیت دریافت شد',
      data: dashboardData,
    };
  }

  // create subscription payment for master
  async createSubscriptionPayment(
    masterId: number,
    createDto: CreateSubscriptionPaymentDto,
    file: Express.Multer.File,
  ) {
    const master = await this.prisma.users.findUnique({
      where: { user_id: masterId },
      include: { masterPlan: true },
    });

    if (!file) {
      throw new HttpException('تصویر فیش واریزی الزامی است', HttpStatus.BAD_REQUEST);
    }

    if (!master) {
      throw new HttpException('کاربر ثبت کننده یافت نشد', HttpStatus.NOT_FOUND);
    }

    if (!master.masterPlan) {
      throw new HttpException('پلن انتخابی یافت نشد یا غیرفعال است', HttpStatus.BAD_REQUEST);
    }

    if (master.masterPlan.price === null) {
      throw new HttpException('قیمت پلن مشخص نشده است', HttpStatus.BAD_REQUEST);
    }

    if (!master.masterPlanId) {
      throw new HttpException('ابتدا باید یک پلن انتخاب کنید', HttpStatus.BAD_REQUEST);
    }

    const planStatus = await this.userService.getPlanStatus(masterId);

    if (planStatus?.isActive) {
      throw new HttpException(
        'پلن شما در حال حاضر فعال است. نیازی به پرداخت جدید نیست',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (planStatus?.isPending) {
      throw new HttpException('شما یک پرداخت در انتظار تایید دارید', HttpStatus.BAD_REQUEST);
    }

    if (planStatus?.isExpired) {
      throw new HttpException(
        'پلن شما منقضی شده است. لطفاً ابتدا پلن جدیدی انتخاب کنید',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!planStatus?.needsPayment) {
      throw new HttpException(
        'وضعیت پلن نامعتبر است. لطفاً وضعیت را بررسی کنید',
        HttpStatus.BAD_REQUEST,
      );
    }

    const imageUrl = fileUtils.createImageUrl(file.filename, 'receipt');

    const createPayment = await this.prisma.subscriptionPayment.create({
      data: {
        amount: master.masterPlan.price,
        paymentDate: createDto.paymentDate,
        trackingNumber: createDto.trackingNumber,
        payerFullName: createDto.payerFullName,
        bankName: createDto.bankName,
        receiptImageUrl: imageUrl,
        masterId: masterId,
        planId: master.masterPlanId,
      },
    });

    if (master.phoneNumber) {
      const formattedAmount = Number(createPayment.amount).toLocaleString('fa-IR');

      await this.smsService.sendMessageToUser(
        master.phoneNumber,
        `مدیر محترم سلام ${master.fullName}
درخواست پرداخت اشتراک شما به مبلغ ${formattedAmount} تومان با موفقیت ثبت شد. پس از تایید پرداخت، پلن شما فعال خواهد شد.
با تشکر.`,
      );
    }

    return {
      statusCode: HttpStatus.CREATED,
      message: 'پرداخت با موفقیت ثبت شد و در انتظار تایید است',
      data: createPayment,
    };
  }

  // review subscription payment for admin
  async reviewSubscriptionPayment(
    paymentId: number,
    adminId: number,
    reviewDto: ReviewSubscriptionPaymentDto,
  ) {
    const payment = await this.prisma.subscriptionPayment.findUnique({
      where: { id: paymentId },
      include: {
        master: {
          select: {
            phoneNumber: true,
            fullName: true,
            masterPlanId: true,
            planEndsAt: true,
          },
        },
        plan: true,
      },
    });

    if (!payment) {
      throw new HttpException('پرداخت مورد نظر یافت نشد', HttpStatus.NOT_FOUND);
    }

    if (payment.status !== SubscriptionPaymentStatus.PENDING) {
      throw new HttpException('این پرداخت قبلاً بازبینی شده است', HttpStatus.BAD_REQUEST);
    }

    return await this.prisma.$transaction(async (tx) => {
      const updatePayment = await tx.subscriptionPayment.update({
        where: { id: paymentId },
        data: {
          status: reviewDto.status,
          adminNotes: reviewDto.adminNotes,
          confirmerId: adminId,
        },
      });

      let message = '';
      const formattedAmount = Number(payment.amount).toLocaleString('fa-IR');

      if (reviewDto.status === SubscriptionPaymentStatus.CONFIRMED) {
        if (!payment.plan) {
          throw new HttpException('پلن مرتبط با این پرداخت یافت نشد', HttpStatus.BAD_REQUEST);
        }

        const planEndsAt = new Date();
        planEndsAt.setDate(planEndsAt.getDate() + (payment.plan.durationInDays || 0));

        await tx.users.update({
          where: { user_id: payment.masterId },
          data: {
            planEndsAt: planEndsAt,
            masterPlanId: payment.planId,
          },
        });

        message = `مدیر محترم سلام ${payment.master.fullName}
پرداخت اشتراک شما به مبلغ ${formattedAmount} تومان با موفقیت تایید شد.
پلن "${payment.plan.name}" شما فعال شد.
تاریخ انقضا: ${planEndsAt.toLocaleDateString('fa-IR')}`;
      } else if (reviewDto.status === SubscriptionPaymentStatus.REJECTED) {
        await tx.users.update({
          where: { user_id: payment.masterId },
          data: {
            masterPlanId: null,
            planEndsAt: null,
          },
        });

        message = `مدیر محترم سلام ${payment.master.fullName}
متاسفانه پرداخت اشتراک شما به مبلغ ${formattedAmount} تومان رد شد.
دلیل: ${reviewDto.adminNotes || 'دلیل ذکر نشده'}
لطفاً مجدداً اقدام به پرداخت کنید.`;
      }

      if (payment.master?.phoneNumber && message) {
        await this.smsService.sendMessageToUser(payment.master.phoneNumber, message);
      }

      return {
        statusCode: HttpStatus.OK,
        message:
          reviewDto.status === SubscriptionPaymentStatus.CONFIRMED
            ? 'پرداخت تایید و پلن فعال شد'
            : 'پرداخت رد شد',
        data: updatePayment,
      };
    });
  }

  // get all pending subscriptions for admin
  async getAllPendingSubscriptions() {
    const payments = await this.prisma.subscriptionPayment.findMany({
      where: { status: SubscriptionPaymentStatus.PENDING },
      include: {
        master: {
          select: {
            user_id: true,
            fullName: true,
            phoneNumber: true,
            masterPlan: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'پرداخت های در انتظار با موفقیت دریافت شدند',
      data: payments,
    };
  }

  // get master subscription history
  async getMasterSubscriptionHistory(masterId: number) {
    if (!masterId) {
      throw new HttpException('کاربری با این مشخصات یافت نشد', HttpStatus.NOT_FOUND);
    }

    const payments = await this.prisma.subscriptionPayment.findMany({
      where: { masterId: masterId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'تاریخچه پرداخت ها با موفقیت دریافت شدند',
      data: payments,
    };
  }
}
