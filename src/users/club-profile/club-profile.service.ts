import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { Prisma } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ClubProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async completeInstructorProfile(masterId: number, dto: CompleteProfileDto) {
    const instructorProfile = await this.prisma.instructorProfile.findUnique({
      where: { userId: masterId },
    });

    if (!instructorProfile) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'پروفایل استاد با این مشخصات پیدا نشد',
      });
    }

    const clubProfile = await this.prisma.instructorProfile.update({
      where: {
        userId: masterId,
      },
      data: {
        clubName: dto.clubName,
        activityType: dto.activityType,
        clubAddress: dto.clubAddress,
        aboutClub: dto.aboutClub,
        clubPhoneNumber: dto.clubPhoneNumber,
        foundationDate: dto.foundationDate,
        goal: dto.goal,
        socialNetworks: dto.socialNetworks
          ? (dto.socialNetworks as Prisma.JsonObject)
          : Prisma.JsonNull,
        isProfileComplete: true,
      },
    });

    return {
      statusCode: 200,
      message: 'اطلاعات باشگاه با موفقیت تکمیل شد',
      data: clubProfile,
    };
  }

  async updateInstructorProfile(masterId: number, dto: UpdateProfileDto) {
    const instructorProfile = await this.prisma.instructorProfile.findUnique({
      where: { userId: masterId },
    });

    if (!instructorProfile) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'پروفایل استاد با این مشخصات پیدا نشد',
      });
    }

    const clubProfile = await this.prisma.instructorProfile.update({
      where: {
        userId: masterId,
      },
      data: {
        ...dto,
        socialNetworks: dto.socialNetworks
          ? (dto.socialNetworks as Prisma.JsonObject)
          : undefined,
      },
    });

    return {
      statusCode: 200,
      message: 'اطلاعات باشگاه با موفقیت اپدیت شد',
      data: clubProfile,
    };
  }
}
