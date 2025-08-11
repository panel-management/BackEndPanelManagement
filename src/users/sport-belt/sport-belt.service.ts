import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SportBeltService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAllSport() {
    const getSport = await this.prismaService.sport.findMany({
      include: {
        users: true,
      },
    });

    return {
      statusCode: 200,
      message: 'لیست ورزش ها با موفقیت دریافت شد',
      data: getSport,
    };
  }

  async getSportById(id: number) {
    const getSport = await this.prismaService.sport.findUnique({
      where: { id: id },
      include: { users: true },
    });

    if (!getSport || getSport.id !== id) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'ورزشی با این مشخاصت یافت نشد',
      });
    }

    return {
      statusCode: 200,
      message: 'ورزش با موفقیت در یافت شد',
      data: getSport,
    };
  }

  async getAllBelt() {
    const getBelt = await this.prismaService.belt.findMany({
      include: {
        achievedByUsers: true,
        currentlyHeldByUsers: true,
      },
    });

    return {
      statusCode: 200,
      message: 'لیست کمربند ها با موفقیت دریافت شد',
      data: getBelt,
    };
  }

  async getBeltById(id: number) {
    const getBelt = await this.prismaService.belt.findUnique({
      where: { id: id },
      include: {
        achievedByUsers: true,
        currentlyHeldByUsers: true,
      },
    });

    if (!getBelt || getBelt.id !== id) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'کمربندی با این مشخاصت یافت نشد',
      });
    }

    return {
      statusCode: 200,
      message: 'کمربند با موفقیت یافت شد',
      data: getBelt,
    };
  }
}
