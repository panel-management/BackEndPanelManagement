import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCoachDto } from './dto/create-coach.dto';
import { UpdateCoachDto } from './dto/update-coach.dto';
import { UpdateStatusDto } from 'src/common/dto/updateStatus.dto';
import { Role } from 'src/auth/enums/role.enum';
import { Prisma } from '@prisma/client';
import { fileUtils } from 'src/common/utils/file-upload.util';

type UpdatedCoachData = {
  fullName: string | null;
  nationalCode: string | null;
  phoneNumber: string | null;
  history: string | null;
  certificates: string | null;
};

@Injectable()
export class CoachService {
  constructor(private readonly prisma: PrismaService) {}

  // get coach by master
  async getCoach(masterId: number) {
    const getCoach = await this.prisma.users.findMany({
      where: { masterId: masterId, type: Role.Coach },
      select: {
        user_id: true,
        fullName: true,
        nationalCode: true,
        phoneNumber: true,
        birthDate: true,
        age: true,
        history: true,
        certificates: true,
        image: true,
        isActive: true,
        type: true,
        sport: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'لیست مربی ها با موفقیت دریافت شد',
      data: getCoach,
    };
  }

  // get profile coach by himself
  async getCoachProfile(coachId: number) {
    const getCoach = await this.prisma.users.findUnique({
      where: { user_id: coachId, type: Role.Coach },
      select: {
        user_id: true,
        fullName: true,
        nationalCode: true,
        phoneNumber: true,
        birthDate: true,
        age: true,
        history: true,
        certificates: true,
        image: true,
        isActive: true,
        type: true,
        sport: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (getCoach?.type !== Role.Coach) {
      throw new HttpException('مربی با این مشخصات یافت نشد', HttpStatus.NOT_FOUND);
    }

    if (!getCoach) {
      throw new HttpException('مربی با این مشخصات یافت نشد', HttpStatus.NOT_FOUND);
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'مربی با موفقیت یافت شد',
      data: getCoach,
    };
  }

  // get coach by id for master
  async getCoachById(coachId: number, masterId: number) {
    const getCoach = await this.prisma.users.findUnique({
      where: { user_id: coachId },
      select: {
        user_id: true,
        fullName: true,
        nationalCode: true,
        phoneNumber: true,
        birthDate: true,
        age: true,
        history: true,
        certificates: true,
        image: true,
        isActive: true,
        type: true,
        masterId: true,
        sport: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (getCoach?.type !== Role.Coach) {
      throw new HttpException('مربی با این مشخصات یافت نشد', HttpStatus.NOT_FOUND);
    }

    if (!getCoach || getCoach.masterId !== masterId) {
      throw new HttpException('مربی با این مشخصات یافت نشد', HttpStatus.NOT_FOUND);
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'مربی با موفقیت یافت شد',
      data: getCoach,
    };
  }

  // create coach for master
  async createCoach(masterId: number, dto: CreateCoachDto, file?: Express.Multer.File) {
    try {
      const master = await this.prisma.users.findUnique({
        where: { user_id: masterId },
        include: { sport: true },
      });

      if (!master || !master.sport) {
        throw new HttpException(
          'برای ساخت مربی، شما به عنوان استاد باید ابتدا رشته ورزشی خود را در پروفایل مشخص کنید',
          HttpStatus.FORBIDDEN,
        );
      }

      let imageUrl: string | undefined = undefined;
      if (file) {
        imageUrl = fileUtils.createImageUrl(file.filename, 'coachs');
      }

      const newCoach = await this.prisma.users.create({
        data: {
          fullName: dto.fullName,
          nationalCode: dto.nationalCode,
          phoneNumber: dto.phoneNumber,
          birthDate: dto.birthDate,
          age: dto.age,
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
          birthDate: true,
          age: true,
          image: true,
          type: true,
          sport: true,
        },
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'مربی با موفقیت ایجاد شد',
        data: newCoach,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = error.meta?.target as string[];
        if (target?.includes('phoneNumber')) {
          throw new HttpException('کاربری با این شماره تلفن از قبل وجود دارد', HttpStatus.CONFLICT);
        }
        if (target?.includes('nationalCode')) {
          throw new HttpException('کاربری با این کد ملی از قبل وجود دارد', HttpStatus.CONFLICT);
        }
      }
      throw error;
    }
  }

  // update coach profile himself
  async updateCoachProfile(
    coachId: number,
    dto: UpdateCoachDto,
    file?: Express.Multer.File,
  ): Promise<{
    statusCode: number;
    message: string;
    data: UpdatedCoachData;
  }> {
    const coach = await this.getCoachProfile(coachId);

    let imageUrl: string | undefined = undefined;
    if (file) {
      fileUtils.deleteFile(coach.data.image);
      imageUrl = fileUtils.createImageUrl(file.filename, 'coachs');
    }

    const updateCoach = await this.prisma.users.update({
      where: { user_id: coachId, type: Role.Coach },
      data: {
        fullName: dto.fullName,
        nationalCode: dto.nationalCode,
        phoneNumber: dto.phoneNumber,
        birthDate: dto.birthDate,
        age: dto.age,
        history: dto.history,
        certificates: dto.certificates,
        ...(imageUrl && { image: imageUrl }),
      },
      select: {
        user_id: true,
        fullName: true,
        nationalCode: true,
        phoneNumber: true,
        birthDate: true,
        age: true,
        history: true,
        certificates: true,
        image: true,
      },
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'پروفایل با موفقیت بروزرسانی شد',
      data: updateCoach,
    };
  }

  // update coach for master
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
    const coach = await this.getCoachById(coachId, masterId);

    let imageUrl: string | undefined = undefined;
    if (file) {
      fileUtils.deleteFile(coach.data.image);
      imageUrl = fileUtils.createImageUrl(file.filename, 'coachs');
    }

    const updateCoach = await this.prisma.users.update({
      where: { user_id: coachId, type: Role.Coach },
      data: {
        fullName: dto.fullName,
        nationalCode: dto.nationalCode,
        phoneNumber: dto.phoneNumber,
        birthDate: dto.birthDate,
        age: dto.age,
        history: dto.history,
        certificates: dto.certificates,
        ...(imageUrl && { image: imageUrl }),
      },
      select: {
        user_id: true,
        fullName: true,
        nationalCode: true,
        phoneNumber: true,
        birthDate: true,
        age: true,
        history: true,
        certificates: true,
        image: true,
      },
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'پروفایل با موفقیت بروزرسانی شد',
      data: updateCoach,
    };
  }

  // change status account
  async changeStatusAccount(
    coachId: number,
    masterId: number,
    status: UpdateStatusDto,
  ): Promise<{
    statusCode: number;
    message: string;
    data: UpdateStatusDto;
  }> {
    await this.getCoachById(coachId, masterId);

    const changeStatus = await this.prisma.users.update({
      where: { user_id: coachId, type: Role.Coach },
      data: { isActive: status.isActive },
      select: {
        isActive: true,
      },
    });

    const statusMessage = changeStatus.isActive ? 'فعال' : 'غیرفعال';

    return {
      statusCode: HttpStatus.OK,
      message: `وضعیت مربی با موفقیت به ${statusMessage} تغییر یافت`,
      data: changeStatus,
    };
  }

  // delete account coach
  async deleteAccount(
    coachId: number,
    masterId: number,
  ): Promise<{ statusCode: number; message: string }> {
    const coach = await this.getCoachById(coachId, masterId);

    await this.prisma.users.delete({
      where: { user_id: coachId, type: Role.Coach },
    });

    if (coach.data.image) {
      fileUtils.deleteFile(coach.data.image);
    }

    return { statusCode: HttpStatus.OK, message: 'مربی با موفقیت حذف شد' };
  }
}
