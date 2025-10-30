import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import {
  PaymentMethod,
  SubscriptionPaymentStatus,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { CreateSubscriptionPaymentDto } from './dto/create-subscription-payment.dto';
import { ReviewSubscriptionPaymentDto } from './dto/review-subscription-payment.dto';
import { SmsServiceService } from 'src/sms-service/sms-service.service';
import { CreateMasterPlanDto } from 'src/users/master/dto/create-master-plan.dto';
import { UpdateMasterPlanDto } from 'src/users/master/dto/update-master-plan.dto';

@Injectable()
export class FinancialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly smsService: SmsServiceService,
  ) {}

  async createPlan(createPlanDto: CreatePlanDto) {
    const plan = await this.prisma.plan.create({
      data: createPlanDto,
    });

    return { statusCode: 201, message: 'پلن با موفقیت ایجاد شد', data: plan };
  }

  async findAllPlans() {
    const plans = await this.prisma.plan.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        durationInDays: true,
        price: true,
        isDefault: true,
        transactions: true,
        assignedUsers: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      statusCode: 200,
      message: 'پلن ها با موفقیت دریافت شدند',
      data: plans,
    };
  }

  async findPlanById(planId: number) {
    return this.prisma.plan.findUnique({
      where: { id: planId },
    });
  }

  async deletePlanStudent(planId: number) {
    const findPlanStudent = await this.findPlanById(planId);

    if (!findPlanStudent) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'پلن یافت نشد لطف مجدد امتحان کنید',
      });
    }

    const deletePlan = await this.prisma.plan.delete({
      where: { id: planId },
    });

    return {
      statusCode: 200,
      message: 'طرح با موفقیت حذف شد',
      data: deletePlan,
    };
  }

  async findMasterPlanById(planId: number) {
    return this.prisma.masterPlan.findUnique({
      where: { id: planId },
    });
  }

  async createEquipmentTransaction(
    masterId: number,
    createEquipmentDto: CreateEquipmentDto,
  ) {
    const student = await this.prisma.users.findUnique({
      where: { user_id: createEquipmentDto.studentId },
    });

    if (!student) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'هنرجوی با این شناسه یافت نشد',
      });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const createTransaction = await this.prisma.transaction.create({
      data: {
        type: TransactionType.EQUIPMENT,
        status: TransactionStatus.UNPAID,
        amount: createEquipmentDto.amount,
        description: createEquipmentDto.description,
        dueDate: dueDate,
        studentId: createEquipmentDto.studentId,
        creatorId: masterId,
      },
    });

    if (student.phoneNumber) {
      const formattedAmount = createTransaction.amount
        .toNumber()
        .toLocaleString('fa-IR');
      const formattedDueDate = dueDate.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const message = `هنرجوی عزیز سلام ${student.fullName}
یک هزینه جدید برای ${createTransaction.description} به مبلغ ${formattedAmount} تومان برای شما ثبت شد.
مهلت پرداخت: ${formattedDueDate}`;

      try {
        await this.smsService.sendMessageToUser(student.phoneNumber, message);
      } catch (error) {
        // اگر ارسال پیامک خطا داد، فقط آن را لاگ می‌کنیم
        console.error(
          `ارسال پیامک ثبت هزینه به ${student.phoneNumber} ناموفق بود:`,
          error,
        );
      }
    }

    return {
      statusCode: 201,
      message: 'تراکنش با موفقیت ایجاد شد',
      data: createTransaction,
    };
  }

  async confirmManualPayment(
    transactionId: number,
    confirmerId: number,
    confirmPaymentDto: ConfirmPaymentDto,
  ) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { student: { select: { phoneNumber: true, fullName: true } } },
    });

    if (!transaction) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'تراکنش یافت نشد',
      });
    }

    if (transaction.status === 'PAID') {
      throw new BadRequestException({
        statusCode: 400,
        message: 'این تراکنش قبلا پرداخت شده است',
      });
    }

    const updateTransaction = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: TransactionStatus.PAID,
        paymentMethod: PaymentMethod.CASH,
        paymentDate: confirmPaymentDto.paymentDate || new Date(),
        confirmerId: confirmerId,
      },
    });

    if (transaction.student && transaction.student.phoneNumber) {
      const message = `سلام ${transaction.student.fullName} عزیز
پرداخت شما برای ${transaction.description} به مبلغ ${transaction.amount.toNumber().toLocaleString('fa-IR')} تومان با موفقیت تایید شد.`;

      try {
        await this.smsService.sendMessageToUser(
          transaction.student.phoneNumber,
          message,
        );
      } catch (error: any) {
        console.error(
          `خطا ارسال پیامک به شماره ${transaction.student.phoneNumber} ارسال نشد`,
          error,
        );
      }
    }

    return {
      statusCode: 200,
      message: 'تراکنش با موفقیت تایید شد',
      data: updateTransaction,
    };
  }

  async getStudentTransactions(studentId: number) {
    const getStudent = await this.prisma.transaction.findMany({
      where: { studentId: studentId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      statusCode: 200,
      message: 'تراکنش ها با موفقیت دریافت شدند',
      data: getStudent,
    };
  }

  // data dashboard for master
  async getMasterDashboard() {
    const [
      paidRevenue,
      feeRevenue,
      equipmentRevenue,
      unpaidStats,
      upcomingStats,
      paidTransactions,
      unpaidTransactions,
      upcomingTransactions,
    ] = await Promise.all([
      // Total income (paid)
      // ۱. مجموع کل درآمد (پرداخت شده‌ها)
      this.prisma.transaction.aggregate({
        where: { status: TransactionStatus.PAID },
        _sum: { amount: true },
      }),
      // Total income from tuition fees
      // ۲. مجموع درآمد از شهریه‌ها
      this.prisma.transaction.aggregate({
        where: { status: TransactionStatus.PAID, type: TransactionType.FEE },
        _sum: { amount: true },
      }),
      // Total revenue from equipment
      // ۳. مجموع درآمد از تجهیزات
      this.prisma.transaction.aggregate({
        where: {
          status: TransactionStatus.PAID,
          type: TransactionType.EQUIPMENT,
        },
        _sum: { amount: true },
      }),
      // Total and number of unpaid debts
      // ۴. مجموع و تعداد بدهی‌های پرداخت نشده
      this.prisma.transaction.aggregate({
        where: { status: TransactionStatus.UNPAID },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // Total and number of upcoming transactions (for future months) - UPDATED
      // ۵. مجموع و تعداد تراکنش‌های در انتظار (برای ماه‌های آینده) - UPDATED
      this.prisma.transaction.aggregate({
        where: { status: TransactionStatus.UPCOMING },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // List of last 10 paid transactions
      // ۶. لیست ۱۰ تراکنش آخر پرداخت شده
      this.prisma.transaction.findMany({
        where: { status: TransactionStatus.PAID },
        take: 10,
        orderBy: { paymentDate: 'desc' },
        include: { student: { select: { fullName: true } } },
      }),
      // Full list of unpaid transactions
      // ۷. لیست کامل تراکنش‌های پرداخت نشده
      this.prisma.transaction.findMany({
        where: { status: TransactionStatus.UNPAID },
        orderBy: { dueDate: 'asc' },
        include: { student: { select: { fullName: true } } },
      }),
      // Full list of upcoming transactions
      // ۸. لیست کامل تراکنش‌های در انتظار
      this.prisma.transaction.findMany({
        where: { status: TransactionStatus.UPCOMING },
        orderBy: { dueDate: 'asc' },
        include: { student: { select: { fullName: true } } },
      }),
    ]);

    const dashboardData = {
      stats: {
        totalRevenue: paidRevenue._sum.amount ?? 0,
        feeRevenue: feeRevenue._sum.amount ?? 0,
        equipmentRevenue: equipmentRevenue._sum.amount ?? 0,
        unpaidTotal: unpaidStats._sum.amount ?? 0,
        unpaidCount: unpaidStats._count.id ?? 0,
        upcomingTotal: upcomingStats._sum.amount ?? 0,
        upcomingCount: upcomingStats._count.id ?? 0,
      },
      charts: {
        revenueByType: [
          { type: 'شهریه', total: feeRevenue._sum.amount ?? 0 },
          { type: 'تجهیزات', total: equipmentRevenue._sum.amount ?? 0 },
        ],
      },
      lists: {
        paidTransactions,
        unpaidTransactions,
        upcomingTransactions,
      },
    };

    return {
      statusCode: 200,
      message: 'اطلاعات داشبورد با موفقیت دریافت شد',
      data: dashboardData,
    };
  }

  // data dashboard for admin
  async getAdminDashboard() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      pendingSubscriptionsStats,
      confirmedRevenueThisMonth,
      pendingSubscriptionsList,
      recentlyReviewedList,
    ] = await Promise.all([
      // General payment figures pending confirmation
      // ۱. آمار کلی پرداخت‌های در انتظار تایید
      this.prisma.subscriptionPayment.aggregate({
        where: { status: SubscriptionPaymentStatus.PENDING },
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
      }),
      // Full list of payments pending review
      // ۳. لیست کامل پرداخت‌های در انتظار برای بازبینی
      this.prisma.subscriptionPayment.findMany({
        where: { status: SubscriptionPaymentStatus.PENDING },
        orderBy: { createdAt: 'asc' }, // قدیمی‌ترین‌ها اول نمایش داده شوند
        include: { master: { select: { fullName: true, user_id: true } } },
      }),
      // List of last 10 payments that have been reviewed (confirmed or rejected)
      // ۴. لیست ۱۰ پرداخت آخری که بازبینی شده‌اند (تایید یا رد شده)
      this.prisma.subscriptionPayment.findMany({
        where: {
          status: {
            in: [
              SubscriptionPaymentStatus.CONFIRMED,
              SubscriptionPaymentStatus.REJECTED,
            ],
          },
        },
        take: 10,
        orderBy: { updatedAt: 'desc' },
        include: {
          master: { select: { fullName: true } },
          confirmer: { select: { fullName: true } },
        },
      }),
    ]);

    const dashboardData = {
      stats: {
        pendingSubscriptionsTotal: pendingSubscriptionsStats._sum.amount ?? 0,
        pendingSubscriptionsCount: pendingSubscriptionsStats._count.id ?? 0,
        confirmedRevenueThisMonth: confirmedRevenueThisMonth._sum.amount ?? 0,
      },
      lists: {
        pendingSubscriptionPayments: pendingSubscriptionsList,
        recentlyReviewedPayments: recentlyReviewedList,
      },
    };

    return {
      statusCode: 200,
      message: 'اطلاعات داشبورد با موفقیت دریافت شد',
      data: dashboardData,
    };
  }

  async createSubscriptionPayment(
    masterId: number,
    createDto: CreateSubscriptionPaymentDto,
    file: Express.Multer.File,
  ) {
    const master = await this.prisma.users.findUnique({
      where: { user_id: masterId },
      include: { masterPlan: true },
    });

    if (!master) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'کاربر ثبت کننده یافت نشد',
      });
    }

    if (!master.masterPlanId) {
      throw new NotFoundException({
        statusCode: 400,
        message: 'ابتدا باید یک پلن انتخاب کنید',
      });
    }

    const pendingPayment = await this.prisma.subscriptionPayment.findFirst({
      where: {
        masterId: masterId,
        status: SubscriptionPaymentStatus.PENDING,
      },
    });

    if (pendingPayment) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'شما یک پرداخت در انتظار تایید دارید',
      });
    }

    const imageUrl = `${process.env.APP_URL}uploads/receipt/${file.filename}`;

    const createPayment = await this.prisma.subscriptionPayment.create({
      data: {
        amount: createDto.amount,
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
      const formattedAmount = createPayment.amount
        .toNumber()
        .toLocaleString('fa-IR');
      const message = `مدیر محترم سلام ${master.fullName}
درخواست پرداخت اشتراک شما به مبلغ ${formattedAmount} تومان با موفقیت ثبت شد. پس از تایید پرداخت، پلن شما فعال خواهد شد.
با تشکر.`;

      try {
        await this.smsService.sendMessageToUser(master.phoneNumber, message);
      } catch (error) {
        console.error(
          `ارسال پیامک ثبت اشتراک به ${master.phoneNumber} ناموفق بود:`,
          error,
        );
      }
    }

    return {
      statusCode: 201,
      message: 'پرداخت با موفقیت ثبت شد و در انتظار تایید است',
      data: createPayment,
    };
  }

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
      throw new NotFoundException({
        statusCode: 404,
        message: 'پرداخت مورد نظر یافت نشد',
      });
    }

    if (payment.status !== SubscriptionPaymentStatus.PENDING) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'این پرداخت قبلاً بازبینی شده است',
      });
    }

    const updatePayment = await this.prisma.subscriptionPayment.update({
      where: { id: paymentId },
      data: {
        status: reviewDto.status,
        adminNotes: reviewDto.adminNotes,
        confirmerId: adminId,
      },
    });

    let message = '';
    const formattedAmount = payment.amount.toNumber().toLocaleString('fa-IR');

    if (reviewDto.status === SubscriptionPaymentStatus.CONFIRMED) {
      if (!payment.plan) {
        throw new BadRequestException({
          statusCode: 400,
          message: 'پلن مرتبط با این پرداخت یافت نشد',
        });
      }

      const planEndsAt = new Date();
      planEndsAt.setDate(
        planEndsAt.getDate() + (payment.plan.durationInDays || 0),
      );

      await this.prisma.users.update({
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
      await this.prisma.users.update({
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
      try {
        await this.smsService.sendMessageToUser(
          payment.master.phoneNumber,
          message,
        );
      } catch (error) {
        console.error(`ارسال پیامک بازبینی ناموفق بود:`, error);
      }
    }

    return {
      statusCode: 200,
      message:
        reviewDto.status === SubscriptionPaymentStatus.CONFIRMED
          ? 'پرداخت تایید و پلن فعال شد'
          : 'پرداخت رد شد',
      data: updatePayment,
    };
  }

  async getAllPendingSubscriptions() {
    const payments = await this.prisma.subscriptionPayment.findMany({
      where: { status: 'PENDING' },
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
      statusCode: 200,
      message: 'پرداخت های در انتظار با موفقیت دریافت شدند',
      data: payments,
    };
  }

  async getMasterSubscriptionHistory(masterId: number) {
    const payments = await this.prisma.subscriptionPayment.findMany({
      where: { masterId: masterId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      statusCode: 200,
      message: 'تاریخچه پرداخت ها با موفقیت دریافت شدند',
      data: payments,
    };
  }

  // methods for admin to manage master plan

  // create plan for master
  async createMasterPlan(createDto: CreateMasterPlanDto) {
    if (
      createDto.type === 'PAID' &&
      (createDto.price === undefined || createDto.price === null)
    ) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'برای پلن‌های پولی، وارد کردن قیمت الزامی است',
      });
    }

    const data: any = {
      name: createDto.name,
      description: createDto.description,
      features: createDto.features,
      type: createDto.type,
      durationInDays: createDto.durationInDays,
    };

    if (createDto.price !== undefined) {
      if (createDto.price >= 10000000000) {
        throw new BadRequestException({
          statusCode: 400,
          message: 'قیمت وارد شده بیش از حد مجاز است (حداکثر ۹۹۹۹۹۹۹۹۹۹.۹۹)',
        });
      }
      data.price = createDto.price;
    } else {
      data.price = 0;
    }

    const createPlan = await this.prisma.masterPlan.create({ data });

    return {
      statusCode: 201,
      message: 'پلن  با موفقیت ایجاد شد',
      data: createPlan,
    };
  }

  // list all plan active and disable
  async findAllMasterPlansForAdmin() {
    const planMaster = await this.prisma.masterPlan.findMany();

    return {
      statusCode: 200,
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
      statusCode: 200,
      message: 'لیست پلن های با موفقیت یافت شد',
      data: planMaster,
    };
  }

  // update plan master in admin
  async updateMasterPlan(planId: number, updateDto: UpdateMasterPlanDto) {
    const findPlanMaster = await this.findMasterPlanById(planId);

    if (!findPlanMaster) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'پلن یافت نشد لطف مجدد امتحان کنید',
      });
    }

    const planMaster = await this.prisma.masterPlan.update({
      where: { id: planId },
      data: updateDto,
    });

    return {
      statusCode: 200,
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
      throw new ConflictException({
        statusCode: 409,
        message: `امکان حذف این پلن وجود ندارد زیرا ${assignedUsersCount} کاربر در حال حاضر از آن استفاده می‌کنند`,
      });
    }

    const findPlanMaster = await this.findMasterPlanById(planId);

    if (!findPlanMaster) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'پلن یافت نشد لطف مجدد امتحان کنید',
      });
    }

    const planMaster = await this.prisma.masterPlan.delete({
      where: { id: planId },
    });

    return {
      statusCode: 200,
      message: 'پلن با موفقیت حذف شد',
      data: planMaster,
    };
  }
}
