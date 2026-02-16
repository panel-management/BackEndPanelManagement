import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { Belt, Prisma, TransactionStatus, TransactionType } from '@prisma/client';
import { Role } from 'src/auth/enums/role.enum';
import { UpdateStudentDto } from './dto/update-student.dto';
import { FinancialsService } from 'src/financials/financials.service';
import { SmsService } from 'src/sms/sms.service';
import { PaginationQueryDto } from 'src/common/dto/pagination.dto';
import { UpdateStatusDto } from 'src/common/dto/updateStatus.dto';

type UpdatedStudentData = {
  fullName: string | null;
  nationalCode: string | null;
  birthDate: Date | null;
  age: number | null;
  phoneNumber: string | null;
  phoneNumberEmergency: string | null;
  address: string | null;
  underSupervisionDoctor: boolean | null;
  diseaseRecords: boolean | null;
  achievedBelts: Belt[];
  currentBelt: Belt | null;
};

@Injectable()
export class StudentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financialsService: FinancialsService,
    private readonly smsService: SmsService,
  ) { }

  // get all students for master with pagination
  async findAll(masterId: number, pageQueryDto: PaginationQueryDto) {
    const { page, limit } = pageQueryDto;
    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit ? limit : undefined;

    const where = {
      masterId: masterId,
      type: Role.Student,
    };

    const [users, total] = await this.prisma.$transaction([
      this.prisma.users.findMany({
        where,
        select: {
          user_id: true,
          fullName: true,
          phoneNumber: true,
          isActive: true,
          currentBelt: true,
          achievedBelts: true,
          sport: true,
          studentTransactions: {
            where: { type: TransactionType.FEE },
            orderBy: { paymentDate: 'desc' },
            take: 1,
            select: { status: true },
          },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
      this.prisma.users.count({ where }),
    ]);

    const user = users.map((user) => ({
      ...user,
      studentTransactions: user.studentTransactions[0]?.status || null,
    }));

    return {
      statusCode: HttpStatus.OK,
      message: 'هنرجو ها با موفقیت دریافت شد',
      data: {
        user,
        pagination: {
          page: page || 1,
          limit: limit || total,
          total,
          totalPages: limit ? Math.ceil(total / limit) : 1,
        },
      },
    };
  }

  // get student by id for master
  async getById(studentId: number, masterId: number) {
    const student = await this.prisma.users.findUnique({
      where: { user_id: studentId, type: Role.Student },
      select: {
        fullName: true,
        phoneNumber: true,
        phoneNumberEmergency: true,
        nationalCode: true,
        address: true,
        age: true,
        birthDate: true,
        diseaseRecords: true,
        underSupervisionDoctor: true,
        isActive: true,
        assignedPlan: true,
        achievedBelts: true,
        currentBelt: true,
        sport: true,
        studentTransactions: {
          where: { type: TransactionType.FEE },
          orderBy: { paymentDate: 'desc' },
        },
        type: true,
        masterId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (student?.type !== Role.Student) {
      throw new HttpException('هنرجویی با این مشخاصت یافت نشد', HttpStatus.NOT_FOUND);
    }

    if (!student || student.masterId !== masterId) {
      throw new HttpException('هنرجویی با این مشخاصت یافت نشد', HttpStatus.NOT_FOUND);
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'هنرجو با موفقیت دریافت شد',
      data: student,
    };
  }

  // get student by id for student himself
  async getStudentById(studentId: number) {
    const student = await this.prisma.users.findUnique({
      where: { user_id: studentId, type: Role.Student },
      select: {
        fullName: true,
        phoneNumber: true,
        phoneNumberEmergency: true,
        nationalCode: true,
        address: true,
        age: true,
        birthDate: true,
        diseaseRecords: true,
        underSupervisionDoctor: true,
        isActive: true,
        achievedBelts: true,
        currentBelt: true,
        sport: true,
        type: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (student?.type !== Role.Student) {
      throw new HttpException('هنرجویی با این مشخاصت یافت نشد', HttpStatus.NOT_FOUND);
    }

    if (!student) {
      throw new HttpException('هنرجویی با این مشخاصت یافت نشد', HttpStatus.NOT_FOUND);
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'هنرجو با موفقیت دریافت شد',
      data: student,
    };
  }

  // create student
  async createStudent(masterId: number, dto: CreateStudentDto) {
    const masterSport = await this.prisma.users.findUnique({
      where: { user_id: masterId, type: Role.Master },
      include: { sport: true },
    });

    if (!masterSport || !masterSport.sportId) {
      throw new HttpException(
        'شما به عنوان مربی باید ابتدا رشته ورزشی خود را مشخص کنید',
        HttpStatus.FORBIDDEN,
      );
    }

    if (masterSport.sport?.hasBeltSystem && !dto.beltIds) {
      throw new HttpException(
        `برای رشته ورزشی ${masterSport.sport.name} انتخاب کمربند الزامی است`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (dto.beltIds) {
      const belt = await this.prisma.belt.findUnique({
        where: { id: dto.beltIds },
      });
      if (!belt) {
        throw new HttpException('کمربند با این ایدی یافت نشد', HttpStatus.NOT_FOUND);
      }
    }

    if (!dto.planId) {
      throw new HttpException('انتخاب پلن برای هنرجو الزامی است', HttpStatus.BAD_REQUEST);
    }

    const planExists = await this.financialsService.findPlanById(dto.planId);
    if (!planExists || planExists.masterId !== masterId) {
      throw new HttpException(
        'پلن شهریه انتخاب شده معتبر نیست یا متعلق به شما نمی‌ باشد',
        HttpStatus.NOT_FOUND,
      );
    }

    const sportId = masterSport.sportId;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.users.create({
          data: {
            fullName: dto.fullName,
            nationalCode: dto.nationalCode,
            age: dto.age,
            birthDate: dto.birthDate,
            phoneNumber: dto.phoneNumber,
            phoneNumberEmergency: dto.phoneNumberEmergency,
            address: dto.address,
            underSupervisionDoctor: dto.underSupervisionDoctor,
            diseaseRecords: dto.diseaseRecords,
            achievedBelts: dto.beltIds ? { connect: [{ id: dto.beltIds }] } : undefined,
            currentBelt: dto.beltIds ? { connect: { id: dto.beltIds } } : undefined,
            sport: { connect: { id: sportId } },
            master: { connect: { user_id: masterId } },
            lastFeeGenerated: new Date(),
            type: Role.Student,
          },
          select: {
            user_id: true,
            fullName: true,
            nationalCode: true,
            age: true,
            birthDate: true,
            phoneNumber: true,
            phoneNumberEmergency: true,
            address: true,
            underSupervisionDoctor: true,
            diseaseRecords: true,
            achievedBelts: true,
            currentBelt: true,
            type: true,
            sport: true,
            createdAt: true,
          },
        });

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + planExists.durationInDays);

        const transaction = await tx.transaction.create({
          data: {
            type: TransactionType.FEE,
            status: TransactionStatus.PENDING,
            amount: planExists.price,
            description: `شهریه اولیه برای پلن ${planExists.name}`,
            dueDate: dueDate,
            studentId: newUser.user_id,
            creatorId: masterId,
            planId: dto.planId,
          },
        });

        if (newUser.phoneNumber) {
          const formattedAmount = Number(transaction.amount).toLocaleString('fa-IR');
          const formattedDueDate = dueDate.toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

          await this.smsService.sendMessageToUser(
            newUser.phoneNumber,
            `سلام ${newUser.fullName} عزیز
به باشگاه خوش آمدید!
پلن انتخابی:${planExists.name}
شهریه اولیه:${formattedAmount} تومان
مهلت پرداخت:${formattedDueDate}
پس از پرداخت و تایید، پلن فعال می‌شود.`,
          );
        }

        return {
          statusCode: HttpStatus.CREATED,
          message: 'هنرجو ایجاد شد و تراکنش شهریه اولیه ثبت گردید',
          data: { ...newUser, transaction },
        };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = error.meta?.target as string[];
        if (target?.includes('phoneNumber')) {
          throw new HttpException('شماره تلفن تکراری است', HttpStatus.CONFLICT);
        }
        if (target?.includes('nationalCode')) {
          throw new HttpException('کد ملی تکراری است', HttpStatus.CONFLICT);
        }
      }
      throw error;
    }
  }

  // update student by master
  async updateById(
    studentId: number,
    masterId: number,
    dto: UpdateStudentDto,
  ): Promise<{
    statusCode: number;
    message: string;
    data: UpdatedStudentData;
  }> {
    await this.getById(studentId, masterId);

    const dataToUpdate: any = {
      fullName: dto.fullName,
      nationalCode: dto.nationalCode,
      birthDate: dto.birthDate,
      age: dto.age,
      phoneNumber: dto.phoneNumber,
      phoneNumberEmergency: dto.phoneNumberEmergency,
      address: dto.address,
      underSupervisionDoctor: dto.underSupervisionDoctor,
      diseaseRecords: dto.diseaseRecords,
      achievedBelts: dto.beltIds ? { connect: [{ id: dto.beltIds }] } : undefined,
      currentBelt: dto.beltIds ? { connect: { id: dto.beltIds } } : undefined,
    };

    let newPlan: any = null;
    let nextDueDate: Date | null = null;

    if (dto.planId) {
      newPlan = await this.financialsService.findPlanById(dto.planId);
      if (!newPlan || newPlan.masterId !== masterId) {
        throw new HttpException('پلن جدید معتبر نیست یا متعلق به شما نیست', HttpStatus.NOT_FOUND);
      }

      const now = new Date();
      nextDueDate = new Date(now);
      nextDueDate.setDate(nextDueDate.getDate() + newPlan.durationInDays);

      dataToUpdate.assignedPlan = { connect: { id: dto.planId } };
      dataToUpdate.planEndsAt = nextDueDate;
      dataToUpdate.lastFeeGenerated = now;
    }

    try {
      const updatedStudent = await this.prisma.$transaction(async (tx) => {
        if (dto.planId) {
          // await tx.transaction.updateMany({
          //   where: {
          //     studentId,
          //     type: TransactionType.FEE,
          //     status: TransactionStatus.PENDING,
          //   },
          //   data: {
          //     status: TransactionStatus.UNPAID,
          //   },
          // });

          await tx.transaction.create({
            data: {
              type: TransactionType.FEE,
              status: TransactionStatus.PENDING,
              amount: newPlan.price,
              description: `شهریه اولیه برای پلن جدید ${newPlan.name}`,
              dueDate: nextDueDate!,
              studentId,
              creatorId: masterId,
              planId: dto.planId,
            },
          });
        }

        return await tx.users.update({
          where: { user_id: studentId, type: Role.Student },
          data: dataToUpdate,
          select: {
            user_id: true,
            fullName: true,
            nationalCode: true,
            birthDate: true,
            age: true,
            phoneNumber: true,
            phoneNumberEmergency: true,
            address: true,
            underSupervisionDoctor: true,
            diseaseRecords: true,
            achievedBelts: true,
            currentBelt: true,
          },
        });
      });

      if (dto.planId && updatedStudent.phoneNumber) {
        await this.smsService.sendMessageToUser(
          updatedStudent.phoneNumber,
          `هنرجوی عزیز ${updatedStudent.fullName} سلام
  پلن شما به "${newPlan.name}" تغییر یافت. مهلت پرداخت جدید: ${nextDueDate?.toLocaleDateString('fa-IR')}.`,
        );
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'پروفایل با موفقیت بروزرسانی شد',
        data: updatedStudent,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = error.meta?.target as string[];
        if (target?.includes('phoneNumber')) {
          throw new HttpException('شماره تلفن تکراری است', HttpStatus.CONFLICT);
        }
        if (target?.includes('nationalCode')) {
          throw new HttpException('کد ملی تکراری است', HttpStatus.CONFLICT);
        }
      }
      throw error;
    }
  }

  // update student by himself
  async updateStudentById(
    studentId: number,
    dto: UpdateStudentDto,
  ): Promise<{
    statusCode: number;
    message: string;
    data: UpdatedStudentData;
  }> {
    await this.getStudentById(studentId);

    const updateStudent = await this.prisma.users.update({
      where: { user_id: studentId, type: Role.Student },
      data: {
        fullName: dto.fullName,
        nationalCode: dto.nationalCode,
        birthDate: dto.birthDate,
        age: dto.age,
        phoneNumber: dto.phoneNumber,
        phoneNumberEmergency: dto.phoneNumberEmergency,
        address: dto.address,
        underSupervisionDoctor: dto.underSupervisionDoctor,
        diseaseRecords: dto.diseaseRecords,
        achievedBelts: dto.beltIds ? { connect: [{ id: dto.beltIds }] } : undefined,
        currentBelt: dto.beltIds ? { connect: { id: dto.beltIds } } : undefined,
      },
      select: {
        user_id: true,
        fullName: true,
        nationalCode: true,
        birthDate: true,
        age: true,
        phoneNumber: true,
        phoneNumberEmergency: true,
        address: true,
        underSupervisionDoctor: true,
        diseaseRecords: true,
        achievedBelts: true,
        currentBelt: true,
      },
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'پروفایل با موفقیت بروزرسانی شد',
      data: updateStudent,
    };
  }

  // change status account
  async changeStatusAccount(
    studentId: number,
    masterId: number,
    status: UpdateStatusDto,
  ): Promise<{
    statusCode: number;
    message: string;
    data: UpdateStatusDto;
  }> {
    await this.getById(studentId, masterId);

    const changeStatus = await this.prisma.users.update({
      where: { user_id: studentId, type: Role.Student },
      data: { isActive: status.isActive },
      select: {
        isActive: true,
      },
    });

    const statusMessage = changeStatus.isActive ? 'فعال' : 'غیر فعال';

    return {
      statusCode: HttpStatus.OK,
      message: `وضعیت هنرجو با موفقیت به ${statusMessage} تغییر یافت`,
      data: changeStatus,
    };
  }

  //  delete stduent
  async deleteStudentById(
    studentId: number,
    masterId: number,
  ): Promise<{ statusCode: number; message: string }> {
    await this.getById(studentId, masterId);

    await this.prisma.users.delete({
      where: { user_id: studentId, type: Role.Student },
    });

    return { statusCode: HttpStatus.OK, message: 'هنرجو با موفقیت حذف شد' };
  }
}
