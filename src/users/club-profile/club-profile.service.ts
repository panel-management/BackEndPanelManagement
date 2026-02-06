import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { Prisma } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Role } from 'src/auth/enums/role.enum';

@Injectable()
export class ClubProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getClubProfile(masterId: number) {
    const profile = await this.prisma.clubProfile.findUnique({
      where: { userId: masterId, user: { type: Role.Master } },
    });

    if (!profile) {
      throw new HttpException(
        'پروفایل باشگاه هنوز ایجاد نشده است',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'اطلاعات پروفایل باشگاه با موفقیت دریافت شد',
      data: profile,
    };
  }

  async completeClubProfile(masterId: number, dto: CompleteProfileDto) {
    const user = await this.prisma.users.findFirst({
      where: { user_id: masterId, type: Role.Master },
      include: { clubProfile: { select: { isProfileComplete: true } } },
    });

    if (!user) {
      throw new HttpException(
        'کاربر با این مشخصات پیدا نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    if (user.clubProfile?.isProfileComplete) {
      throw new HttpException(
        'پروفایل باشگاه شما قبلا تکمیل شده است',
        HttpStatus.FORBIDDEN,
      );
    }

    const clubProfile = await this.prisma.clubProfile.upsert({
      where: { userId: masterId },
      create: {
        userId: masterId,
        ...dto,
        socialNetworks: dto.socialNetworks
          ? (dto.socialNetworks as Prisma.JsonObject)
          : undefined,
        isProfileComplete: true,
      },
      update: {
        ...dto,
        socialNetworks: dto.socialNetworks
          ? (dto.socialNetworks as Prisma.JsonObject)
          : undefined,
        isProfileComplete: true,
      },
    });

    return {
      statusCode: HttpStatus.CREATED,
      message: 'اطلاعات باشگاه با موفقیت تکمیل شد',
      data: clubProfile,
    };
  }

  async updateClubProfile(masterId: number, dto: UpdateProfileDto) {
    const profile = await this.prisma.clubProfile.findUnique({
      where: { userId: masterId, user: { type: Role.Master } },
    });

    if (!profile) {
      throw new HttpException(
        'پروفایل استاد با این مشخصات پیدا نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    const clubProfile = await this.prisma.clubProfile.update({
      where: { userId: masterId },
      data: {
        ...dto,
        socialNetworks: dto.socialNetworks
          ? (dto.socialNetworks as Prisma.JsonObject)
          : undefined,
      },
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'اطلاعات باشگاه با موفقیت اپدیت شد',
      data: clubProfile,
    };
  }
}
