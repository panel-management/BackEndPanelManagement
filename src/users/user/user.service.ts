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
        type: true,
        fullName: true,
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
