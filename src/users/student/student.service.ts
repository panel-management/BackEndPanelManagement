import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { Prisma } from '@prisma/client';
import { Role } from 'src/auth/enums/role.enum';

@Injectable()
export class StudentService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(masterId: number) {
    const users = await this.prismaService.users.findMany({
      where: { masterId: masterId },
      select: {
        user_id: true,
        fullName: true,
        selectBelt: true,
        status: true,
        sport: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return {
      statusCode: 200,
      message: 'هنرجو ها با موفقیت دریافت شد',
      data: {
        users,
      },
    };
  }

  async createStudent(masterId: number, dto: CreateStudentDto) {
    try {
      const masterSport = await this.prismaService.users.findUnique({
        where: { user_id: masterId },
      });
      if (!masterSport || !masterSport.sportId) {
        throw new ForbiddenException({
          statusCode: 403,
          message:
            'برای ساخت هنرجو، شما به عنوان مربی باید ابتدا رشته ورزشی خود را در پروفایل مشخص کنید',
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
          selectBelt: dto.selectBelt ? JSON.parse(dto.selectBelt) : undefined,
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
          selectBelt: true,
          type: true,
          sport: true,
          createdAt: true,
        },
      });
      return {
        statusCode: 201,
        message: 'هنرجو با موفقعیت ایجاد شد',
        data: {
          newUser,
        },
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
}
