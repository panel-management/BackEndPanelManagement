import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllProfileUser(userId: number) {
    const user = await this.prisma.users.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        fullName: true,
        phoneNumber: true,
        phoneNumberEmergency: true,
        nationalCode: true,
        birthDate: true,
        address: true,
        age: true,
        active: true,
        type: true,
        image: true,
        history: true,
        planEndsAt: true,
        hasUsedTrial: true,
        clubProfile: true,
        diseaseRecords: true,
        underSupervisionDoctor: true,
        certificates: true,
        achievedBelts: true,
        currentBelt: true,
        currentBeltId: true,
        sport: true,
        sportId: true,
        plan: true,
        planId: true,
        masterPlan: true,
        masterPlanId: true,
        tickets: true,
        subscriptionPayments: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'کاربر یافت نشد',
      });
    }
    return {
      statusCode: 200,
      message: 'پروفایل با موفقیت دریافت شد',
      data: user,
    };
  }
}
