import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCoachDto } from './dto/create-coach.dto';
import { Role } from 'src/auth/enums/role.enum';
import { Active, Prisma } from '@prisma/client';
import { UpdateCoachDto } from './dto/update-coach.dto';
import { join } from 'path';
import fs from 'fs';

type UpdatedCoachData = {
  fullName: string | null;
  nationalCode: string | null;
  phoneNumber: string | null;
  history: string | null;
  certificates: string | null;
};

type ChangedStatusCoach = {
  active: string;
};

@Injectable()
export class CoachService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAllCoach(masterId: number) {
    const getCoach = await this.prismaService.users.findMany({
      where: { masterId: masterId, type: Role.Coach },
      select: {
        user_id: true,
        fullName: true,
        nationalCode: true,
        phoneNumber: true,
        history: true,
        certificates: true,
        image: true,
        active: true,
        type: true,
        sport: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      statusCode: 200,
      message: 'لیست مربی ها با موفقیت دریافت شد',
      data: getCoach,
    };
  }

  async getCoachById(coachId: number, masterId: number) {
    const getCoach = await this.prismaService.users.findUnique({
      where: { user_id: coachId },
      include: {
        sport: true,
      },
    });

    if (
      !getCoach ||
      getCoach.masterId !== masterId ||
      getCoach.type !== Role.Coach
    ) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'مربی با این مشخصات یافت نشد',
      });
    }

    return {
      statusCode: 200,
      message: 'مربی با موفقیت یافت شد',
      data: getCoach,
    };
  }

  async createCoach(
    masterId: number,
    dto: CreateCoachDto,
    file?: Express.Multer.File,
  ) {
    try {
      const master = await this.prismaService.users.findUnique({
        where: { user_id: masterId },
        include: { sport: true },
      });

      if (!master || !master.sport) {
        throw new ForbiddenException({
          statusCode: 403,
          message:
            'برای ساخت مربی، شما به عنوان استاد باید ابتدا رشته ورزشی خود را در پروفایل مشخص کنید',
        });
      }

      let imageUrl: string | undefined = undefined;
      if (file) {
        imageUrl = `${process.env.APP_URL}uploads/coachs/${file.filename}`;
      }

      const newCoach = await this.prismaService.users.create({
        data: {
          fullName: dto.fullName,
          nationalCode: dto.nationalCode,
          phoneNumber: dto.phoneNumber,
          history: dto.history,
          certificates: dto.certificates,
          image: imageUrl,
          type: Role.Coach,
          sport: { connect: { id: master.sport.id } },
          master: { connect: { user_id: masterId } },
        },
        select: {
          user_id: true,
          fullName: true,
          nationalCode: true,
          phoneNumber: true,
          image: true,
          type: true,
          sport: true,
        },
      });

      return {
        statusCode: 201,
        message: 'مربی با موفقیت ایجاد شد',
        data: newCoach,
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

  async updateCoach(
    coachId: number,
    masterId: number,
    dto: UpdateCoachDto,
    file?: Express.Multer.File,
  ): Promise<{
    statusCode: number;
    message: string;
    data: UpdatedCoachData;
  }> {
    await this.getCoachById(coachId, masterId);

    let imageUrl: string | undefined = undefined;
    if (file) {
      imageUrl = `${process.env.APP_URL}uploads/coachs/${file.filename}`;
    }

    const updateCoach = await this.prismaService.users.update({
      where: { user_id: coachId, type: Role.Coach },
      data: {
        fullName: dto.fullName,
        nationalCode: dto.nationalCode,
        phoneNumber: dto.phoneNumber,
        history: dto.history,
        certificates: dto.certificates,
        image: imageUrl,
      },
      select: {
        user_id: true,
        fullName: true,
        nationalCode: true,
        phoneNumber: true,
        history: true,
        certificates: true,
        image: true,
      },
    });

    return {
      statusCode: 200,
      message: 'پروفایل با موفقیت بروزرسانی شد',
      data: updateCoach,
    };
  }

  async updateStatusCoach(
    coachId: number,
    masterId: number,
    active: Active,
  ): Promise<{
    statusCode: number;
    message: string;
    data: ChangedStatusCoach;
  }> {
    await this.getCoachById(coachId, masterId);
    const changeStatus = await this.prismaService.users.update({
      where: { user_id: coachId, type: Role.Coach },
      data: {
        active: active,
      },
      select: {
        active: true,
      },
    });

    return {
      statusCode: 200,
      message: 'وضعیت مربی با موفقیت تغییر کرد',
      data: changeStatus,
    };
  }

  async deleteCoach(
    coachId: number,
    masterId: number,
  ): Promise<{ statusCode: number; message: string }> {
    const coachResponse = await this.getCoachById(coachId, masterId);
    const coach = coachResponse.data;

    if (coach.image) {
      try {
        const imagePath = new URL(coach.image).pathname;
        const fullPath = join(process.cwd(), imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (error) {
        console.error(
          `error in the delete image ${coach.image}`,
          error.message,
        );
      }
    }

    await this.prismaService.users.delete({
      where: { user_id: coachId, type: Role.Coach },
    });

    return { statusCode: 200, message: 'مربی با موفقیت حذف شد' };
  }
}
