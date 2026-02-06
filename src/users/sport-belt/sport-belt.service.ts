import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SportBeltService {
  constructor(private readonly prisma: PrismaService) {}

  async getSport() {
    const getSport = await this.prisma.sport.findMany({
      select: {
        id: true,
        name: true,
        hasBeltSystem: true,
      },
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'لیست ورزش ها با موفقیت دریافت شد',
      data: getSport,
    };
  }

  async getBelt() {
    const getBelt = await this.prisma.belt.findMany({
      select: {
        id: true,
        color: true,
      },
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'لیست کمربند ها با موفقیت دریافت شد',
      data: getBelt,
    };
  }

  async getBeltById(id: number) {
    const getBelt = await this.prisma.belt.findUnique({
      where: { id: id },
      select: {
        id: true,
        color: true,
      },
    });

    if (!getBelt || getBelt.id !== id) {
      throw new HttpException(
        'کمربندی با این مشخاصت یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'کمربند با موفقیت یافت شد',
      data: getBelt,
    };
  }
}
