import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { Belt, Prisma, SubscriptionPaymentStatus } from '@prisma/client';
import { Role } from 'src/auth/enums/role.enum';
import { UpdateStudentDto } from './dto/update-student.dto';
import { FinancialsService } from 'src/financials/financials.service';

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
    private readonly prismaService: PrismaService,
    private readonly financialsService: FinancialsService,
  ) {}

  async findAll(masterId: number) {
    const users = await this.prismaService.users.findMany({
      where: { masterId: masterId, type: Role.Student },
      select: {
        user_id: true,
        fullName: true,
        phoneNumber: true,
        active: true,
        currentBelt: true,
        achievedBelts: true,
        sport: true,
        subscriptionPayments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const studentsWithStatus = users.map((student) => {
      const latestPayment = student.subscriptionPayments[0];
      let status: SubscriptionPaymentStatus | 'NO_PAYMENT' = 'NO_PAYMENT';

      if (latestPayment) {
        status = latestPayment.status;
      }

      return {
        ...student,
        paymentStatus: status,
      };
    });

    return {
      statusCode: 200,
      message: 'هنرجو ها با موفقیت دریافت شد',
      data: studentsWithStatus,
    };
  }

  // get student by id for master
  async getById(studentId: number, masterId: number) {
    const student = await this.prismaService.users.findUnique({
      where: { user_id: studentId },
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
        active: true,
        achievedBelts: true,
        currentBelt: true,
        sport: true,
        subscriptionPayments: true,
        type: true,
        masterId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (
      !student ||
      student.masterId !== masterId ||
      student.type !== Role.Student
    ) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'هنرجویی با این مشخاصت یافت نشد',
      });
    }

    return {
      statusCode: 200,
      message: 'هنرجو با موفقیت دریافت شد',
      data: student,
    };
  }

  // get student by id for student himself
  async getStudentById(studentId: number) {
    const student = await this.prismaService.users.findUnique({
      where: { user_id: studentId },
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
        active: true,
        achievedBelts: true,
        currentBelt: true,
        sport: true,
        subscriptionPayments: true,
        type: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (student?.type !== Role.Student) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'هنرجویی با این مشخاصت یافت نشد',
      });
    }

    if (!student) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'هنرجویی با این مشخاصت یافت نشد',
      });
    }

    return {
      statusCode: 200,
      message: 'هنرجو با موفقیت دریافت شد',
      data: student,
    };
  }

  async createStudent(masterId: number, dto: CreateStudentDto) {
    try {
      const masterSport = await this.prismaService.users.findUnique({
        where: { user_id: masterId },
        include: { sport: true },
      });
      if (!masterSport || !masterSport.sportId) {
        throw new ForbiddenException({
          statusCode: 403,
          message: 'شما به عنوان مربی باید ابتدا رشته ورزشی خود را مشخص کنید',
        });
      }
      if (masterSport.sport?.hasBeltSystem && !dto.beltIds) {
        throw new BadRequestException({
          statusCode: 400,
          message: `برای رشته ورزشی ${masterSport.sport.name} انتخاب کمربند الزامی است`,
        });
      }
      if (!dto.planId) {
        throw new BadRequestException({
          statusCode: 400,
          message: 'انتخاب پلن برای هنرجو الزامی است',
        });
      }
      const planExists = await this.financialsService.findPlanById(dto.planId);
      if (!planExists || planExists.masterId !== masterId) {
        throw new NotFoundException({
          statusCode: 404,
          message: 'پلن شهریه انتخاب شده معتبر نیست یا متعلق به شما نمی‌ باشد',
        });
      }
      const newUser = await this.prismaService.users.create({
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
          assignedPlan: dto.planId
            ? { connect: { id: dto.planId } }
            : undefined,
          achievedBelts: {
            connect: dto.beltIds?.map((id) => ({ id })),
          },
          currentBelt: dto.beltIds?.[0]
            ? { connect: { id: dto.beltIds[0] } }
            : undefined,
          sport: {
            connect: { id: masterSport.sportId },
          },
          master: { connect: { user_id: masterId } },
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
          assignedPlan: true,
          sport: true,
          createdAt: true,
        },
      });
      return {
        statusCode: 201,
        message: 'هنرجو با موفقیت ایجاد شد',
        data: newUser,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = error.meta?.target as string[];
        if (target?.includes('phoneNumber')) {
          throw new ConflictException({
            statusCode: 409,
            message: 'کاربری با این شماره تلفن از قبل وجود دارد',
          });
        }
        if (target?.includes('nationalCode')) {
          throw new ConflictException({
            statusCode: 409,
            message: 'کاربری با این کد ملی از قبل وجود دارد',
          });
        }
      }
      throw error;
    }
  }

  // Update Student by Master
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
    const updateStudent = await this.prismaService.users.update({
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
        achievedBelts: {
          connect: dto.beltIds?.map((id) => ({ id })),
        },
        currentBelt: dto.beltIds?.[0]
          ? { connect: { id: dto.beltIds[0] } }
          : undefined,
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
      statusCode: 200,
      message: 'پروفایل با موفقیت بروزرسانی شد',
      data: updateStudent,
    };
  }

  // Update Student by himself
  async updateStudentById(
    studentId: number,
    dto: UpdateStudentDto,
  ): Promise<{
    statusCode: number;
    message: string;
    data: UpdatedStudentData;
  }> {
    await this.getStudentById(studentId);
    const updateStudent = await this.prismaService.users.update({
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
        achievedBelts: {
          connect: dto.beltIds?.map((id) => ({ id })),
        },
        currentBelt: dto.beltIds?.[0]
          ? { connect: { id: dto.beltIds[0] } }
          : undefined,
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
      statusCode: 200,
      message: 'پروفایل با موفقیت بروزرسانی شد',
      data: updateStudent,
    };
  }

  async deleteStudentById(
    studentId: number,
    masterId: number,
  ): Promise<{ statusCode: number; message: string }> {
    await this.getById(studentId, masterId);

    await this.prismaService.users.delete({
      where: { user_id: studentId, type: Role.Student },
    });

    return { statusCode: 200, message: 'هنرجو با موفقیت حذف شد' };
  }
}
