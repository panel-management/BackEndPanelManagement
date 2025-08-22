import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from 'src/auth/enums/role.enum';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateMasterDto } from './dto/update-master.dto';
import { Active } from '@prisma/client';
import { join } from 'path';
import fs from 'fs';

type UpdatedMasterData = {
  fullName: string | null;
  nationalCode: string | null;
  phoneNumber: string | null;
  phoneNumberEmergency: string | null;
  address: string | null;
  history: string | null;
  certificates: string | null;
};

type ChangedStatusCoach = {
  active: string;
};

@Injectable()
export class MasterService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAllMaster() {
    const getCoach = await this.prismaService.users.findMany({
      where: { type: Role.Master },
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
      message: 'لیست استاد های باشگاه با موفقیت دریافت شد',
      data: getCoach,
    };
  }

  async getMasterById(masterId: number) {
    const getMaster = await this.prismaService.users.findUnique({
      where: { user_id: masterId },
      include: {
        sport: true,
        students: true,
      },
    });

    if (
      !getMaster ||
      getMaster.user_id !== masterId ||
      getMaster.type !== Role.Master
    ) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'استادی با این مشخصات یافت نشد',
      });
    }

    return {
      statusCode: 200,
      message: 'استاد با موفقیت یافت شد',
      data: getMaster,
    };
  }

  async updateMaster(
    masterId: number,
    dto: UpdateMasterDto,
    file?: Express.Multer.File,
  ): Promise<{
    statusCode: number;
    message: string;
    data: UpdatedMasterData;
  }> {
    await this.getMasterById(masterId);

    let imageUrl: string | undefined = undefined;
    if (file) {
      imageUrl = `${process.env.APP_URL}uploads/masters/${file.filename}`;
    }

    const updateMaster = await this.prismaService.users.update({
      where: { user_id: masterId, type: Role.Master },
      data: {
        fullName: dto.fullName,
        nationalCode: dto.nationalCode,
        phoneNumber: dto.phoneNumber,
        phoneNumberEmergency: dto.phoneNumber,
        address: dto.address,
        history: dto.history,
        certificates: dto.certificates,
        image: imageUrl,
      },
      select: {
        user_id: true,
        fullName: true,
        nationalCode: true,
        phoneNumber: true,
        phoneNumberEmergency: true,
        address: true,
        history: true,
        certificates: true,
        image: true,
      },
    });

    return {
      statusCode: 200,
      message: 'پروفایل با موفقیت بروزرسانی شد',
      data: updateMaster,
    };
  }

  async updateStatusMaster(
    masterId: number,
    active: Active,
  ): Promise<{
    statusCode: number;
    message: string;
    data: ChangedStatusCoach;
  }> {
    await this.getMasterById(masterId);
    const changeStatus = await this.prismaService.users.update({
      where: { user_id: masterId, type: Role.Master },
      data: {
        active: active,
      },
      select: {
        active: true,
      },
    });

    return {
      statusCode: 200,
      message: 'وضعیت استاد با موفقیت تغییر کرد',
      data: changeStatus,
    };
  }

  async deleteMaster(
    masterId: number,
  ): Promise<{ statusCode: number; message: string }> {
    const masterResponse = await this.getMasterById(masterId);
    const master = masterResponse.data;

    if (master.image) {
      try {
        const imagePath = new URL(master.image).pathname;
        const fullPath = join(process.cwd(), imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (error) {
        console.error(
          `error in the delete image ${master.image}`,
          error.message,
        );
      }
    }

    await this.prismaService.users.delete({
      where: { user_id: masterId, type: Role.Master },
    });

    return { statusCode: 200, message: 'استاد باشگاه با موفقیت حذف شد' };
  }
}
