import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Role } from 'src/auth/enums/role.enum';
import { PrismaService } from 'src/prisma/prisma.service';
import { MasterPlanType, SubscriptionPaymentStatus } from '@prisma/client';
import { FinancialsService } from 'src/financials/financials.service';
import { UpdateMasterDto } from './dto/update-master.dto';
import { SmsService } from 'src/sms/sms.service';
import { UpdateStatusDto } from 'src/common/dto/updateStatus.dto';
import { fileUtils } from 'src/common/utils/file-upload.util';

type UpdatedMasterData = {
  fullName: string | null;
  nationalCode: string | null;
  phoneNumber: string | null;
  age: number | null;
  birthDate: Date | null;
  history: string | null;
  certificates: string | null;
};

@Injectable()
export class MasterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financialsService: FinancialsService,
    private readonly smsService: SmsService,
  ) {}

  // get master
  async getMaster() {
    const masters = await this.prisma.users.findMany({
      where: { type: Role.Master },
      select: {
        user_id: true,
        fullName: true,
        nationalCode: true,
        phoneNumber: true,
        history: true,
        isActive: true,
        type: true,
        sport: true,
        subscriptionPayments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { status: true },
        },
        _count: { select: { students: true } },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const mastersWithStatus: any[] = masters.map((master) => {
      const latestPayment = master.subscriptionPayments[0];
      let status: SubscriptionPaymentStatus | 'NO_PAYMENT' = 'NO_PAYMENT';

      if (latestPayment) {
        status = latestPayment.status;
      }

      return {
        user_id: master.user_id,
        fullName: master.fullName,
        nationalCode: master.nationalCode,
        phoneNumber: master.phoneNumber,
        history: master.history,
        active: master.isActive,
        type: master.type,
        sport: master.sport,
        studentCount: master._count.students,
        paymentStatus: status,
        createdAt: master.createdAt,
        updatedAt: master.updatedAt,
      };
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'لیست استاد های باشگاه با موفقیت دریافت شد',
      data: mastersWithStatus,
    };
  }

  // get profile for himself master
  async getMasterById(masterId: number) {
    const getMaster = await this.prisma.users.findUnique({
      where: { user_id: masterId, type: Role.Master },
      select: {
        user_id: true,
        type: true,
        fullName: true,
        phoneNumber: true,
        nationalCode: true,
        image: true,
        isActive: true,
        age: true,
        birthDate: true,
        history: true,
        certificates: true,
        sport: true,
        masterPlan: true,
        students: {
          select: {
            user_id: true,
            fullName: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        subscriptionPayments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (getMaster?.type !== Role.Master) {
      throw new HttpException(
        'کاربر مورد نظر از نوع استاد نیست',
        HttpStatus.FORBIDDEN,
      );
    }

    if (!getMaster) {
      throw new HttpException(
        'استادی با این مشخصات یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'استاد با موفقیت یافت شد',
      data: getMaster,
    };
  }

  // get profile master for admin
  async getMasterByIdSeeAdmin(masterId: number) {
    const getMaster = await this.prisma.users.findUnique({
      where: { user_id: masterId, type: Role.Master },
      select: {
        user_id: true,
        type: true,
        fullName: true,
        phoneNumber: true,
        nationalCode: true,
        image: true,
        isActive: true,
        age: true,
        birthDate: true,
        history: true,
        certificates: true,
        sport: true,
        masterPlan: true,
        students: {
          select: {
            user_id: true,
            fullName: true,
            currentBelt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        subscriptionPayments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (getMaster?.type !== Role.Master) {
      throw new HttpException(
        'کاربر مورد نظر یک استاد نیست',
        HttpStatus.FORBIDDEN,
      );
    }

    if (!getMaster) {
      throw new HttpException(
        'استادی با این مشخصات یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'استاد با موفقیت یافت شد',
      data: getMaster,
    };
  }

  // select plan for master just admin
  async assignPlanToMaster(masterId: number, planId: number) {
    const [master, plan] = await Promise.all([
      this.prisma.users.findUnique({ where: { user_id: masterId } }),
      this.financialsService.findMasterPlanById(planId),
    ]);

    const now = new Date();

    if (!master) {
      throw new HttpException(
        'استاد با این مشخصات یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }

    if (!plan) {
      throw new HttpException('پلن اشتراک یافت نشد', HttpStatus.NOT_FOUND);
    }

    if (master.type !== Role.Master) {
      throw new HttpException(
        'امکان اختصاص پلن به این کاربر وجود ندارد',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (master.planEndsAt && master.planEndsAt > now) {
      throw new HttpException(
        `شما در حال حاضر یک پلن فعال دارید تا تاریخ ${master.planEndsAt.toLocaleDateString('fa-IR')} لطفا پس از اتمام آن پلن جدید انتخاب کنید`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const pendingPayment = await this.prisma.subscriptionPayment.findFirst({
      where: {
        masterId: masterId,
        status: SubscriptionPaymentStatus.PENDING,
      },
    });

    if (pendingPayment) {
      throw new HttpException(
        'شما یک پرداخت در انتظار تایید دارید لطفا صبر کنید تا پرداخت قبلی بررسی شود',
        HttpStatus.BAD_REQUEST,
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      if (plan.type === MasterPlanType.TRIAL) {
        if (master.hasUsedTrial) {
          throw new HttpException(
            'کاربر گرامی شما قبلا پلن رایگان را استفاده کرده اید',
            HttpStatus.BAD_REQUEST,
          );
        }

        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + (plan.durationInDays || 0));

        const updatedMaster = await tx.users.update({
          where: { user_id: masterId },
          data: {
            masterPlanId: planId,
            planEndsAt: trialEndsAt,
            hasUsedTrial: true,
          },
        });

        if (master.phoneNumber) {
          this.smsService.sendMessageToUser(
            master.phoneNumber,
            `سلام مدیر محترم ${master.fullName}
  پلن آزمایشی "${plan.name}" برای شما فعال شد.
  تاریخ انقضا: ${updatedMaster.planEndsAt?.toLocaleDateString('fa-IR')}`,
          );
        }

        return {
          statusCode: HttpStatus.OK,
          message: `${plan.name} با موفقیت فعال شد`,
          data: updatedMaster,
        };
      }

      const updatedMaster = await tx.users.update({
        where: { user_id: masterId },
        data: {
          masterPlanId: planId,
          planEndsAt: null,
        },
      });

      if (master.phoneNumber) {
        this.smsService.sendMessageToUser(
          master.phoneNumber,
          `سلام مدیر محترم ${master.fullName}
  پلن "${plan.name}" برای شما انتخاب شد.
  لطفاً جهت فعال‌سازی، هزینه ${Number(plan.price).toLocaleString('fa-IR')} تومان را پرداخت و رسید آن را ارسال نمایید.`,
        );
      }

      return {
        statusCode: HttpStatus.OK,
        message: `${plan.name} انتخاب شد. لطفاً برای فعال‌سازی، هزینه را پرداخت کنید`,
        data: updatedMaster,
      };
    });
  }

  // select plan himself master
  async selectPlanHimSelf(masterId: number, planId: number) {
    const assignResult = await this.assignPlanToMaster(masterId, planId);
    return {
      statusCode: HttpStatus.OK,
      message: 'پلن انتخاب شده با موفقیت ثبت شد',
      data: assignResult.data,
    };
  }

  // update Master Just Admin And Master
  async updateMaster(
    masterId: number,
    dto: UpdateMasterDto,
    file?: Express.Multer.File,
  ): Promise<{
    statusCode: number;
    message: string;
    data: UpdatedMasterData;
  }> {
    const master = await this.getMasterById(masterId);

    let imageUrl: string | undefined = undefined;
    if (file) {
      fileUtils.deleteFile(master.data.image);
      imageUrl = fileUtils.createImageUrl(file.filename, 'masters');
    }

    const updateMaster = await this.prisma.users.update({
      where: { user_id: masterId, type: Role.Master },
      data: {
        fullName: dto.fullName,
        nationalCode: dto.nationalCode,
        phoneNumber: dto.phoneNumber,
        age: dto.age,
        birthDate: dto.birthDate,
        history: dto.history,
        certificates: dto.certificates,
        ...(dto.sportId && { sportId: dto.sportId }),
        ...(imageUrl && { image: imageUrl }),
      },
      select: {
        user_id: true,
        fullName: true,
        nationalCode: true,
        phoneNumber: true,
        age: true,
        birthDate: true,
        history: true,
        certificates: true,
        sport: true,
        sportId: true,
        image: true,
      },
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'پروفایل با موفقیت بروزرسانی شد',
      data: updateMaster,
    };
  }

  // change status master for admin
  async changeStatusAccount(
    masterId: number,
    status: UpdateStatusDto,
  ): Promise<{
    statusCode: number;
    message: string;
    data: UpdateStatusDto;
  }> {
    await this.getMasterById(masterId);

    const changeStatus = await this.prisma.users.update({
      where: { user_id: masterId, type: Role.Master },
      data: { isActive: status.isActive },
      select: {
        isActive: true,
      },
    });

    const statusMessage = changeStatus.isActive ? 'فعال' : 'غیر فعال';

    return {
      statusCode: HttpStatus.OK,
      message: `وضعیت مربی با موفقیت به ${statusMessage} تغییر یافت`,
      data: changeStatus,
    };
  }

  // delete account master
  async deleteMaster(
    masterId: number,
  ): Promise<{ statusCode: number; message: string }> {
    const master = await this.getMasterById(masterId);

    await this.prisma.$transaction(async (tx) => {
      await tx.plan.deleteMany({ where: { masterId: masterId } });

      await tx.ticket.deleteMany({ where: { userId: masterId } });

      await tx.clubProfile.deleteMany({ where: { userId: masterId } });

      await tx.subscriptionPayment.deleteMany({
        where: { masterId: masterId },
      });

      await tx.users.deleteMany({
        where: {
          masterId: masterId,
          type: { in: [Role.Student, Role.Coach] },
        },
      });

      await tx.users.delete({
        where: { user_id: masterId, type: Role.Master },
      });
    });

    if (master.data.image) {
      fileUtils.deleteFile(master.data.image);
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'استاد و تمامی اطلاعات وابسته با موفقیت حذف شدند',
    };
  }
}
