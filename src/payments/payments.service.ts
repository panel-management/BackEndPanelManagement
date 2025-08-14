import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(masterId: number) {
    const users = await this.prismaService.users.findMany({
      where: { masterId: masterId },
      select: {
        user_id: true,
        fullName: true,
        phoneNumber: true,
        currentBelt: true,
        achievedBelts: true,
        status: true,
        active: true,
        sport: true,
        type: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return {
      statusCode: 200,
      message: 'لیست کاربران زیر مجموعه با موفقیت دریافت شد',
      data: users,
    };
  }
}
