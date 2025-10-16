import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { users } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async findByPhoneNumber(phoneNumber: string): Promise<users | null> {
    return this.prismaService.users.findUnique({
      where: { phoneNumber },
    });
  }

  async findById(userId: number): Promise<users | null> {
    return this.prismaService.users.findUnique({
      where: { user_id: userId },
    });
  }

  async createUser(phoneNumber: string): Promise<users> {
    return this.prismaService.users.create({
      data: {
        phoneNumber,
      },
    });
  }

  async updateProfile(
    userId: number,
    profileData: {
      fullName: string;
      nationalCode: string;
      sportId: number;
      type: number;
    },
  ): Promise<users> {
    const existingUser = await this.prismaService.users.findFirst({
      where: {
        nationalCode: profileData.nationalCode,
        NOT: { user_id: userId },
      },
    });

    if (existingUser) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'کدملی تکراری است لطفا کدملی صحیح وارد کنید',
      });
    }

    return this.prismaService.users.update({
      where: { user_id: userId },
      data: {
        fullName: profileData.fullName,
        nationalCode: profileData.nationalCode,
        ...(profileData.sportId && {
          sport: { connect: { id: profileData.sportId } },
        }),
        type: profileData.type,
      },
    });
  }
}
