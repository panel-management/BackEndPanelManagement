import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from 'src/auth/enums/role.enum';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateMasterDto } from './dto/update-master.dto';
import {
  Active,
  MasterPlanType,
  Prisma,
  SubscriptionPaymentStatus,
} from '@prisma/client';
import { join } from 'path';
import fs from 'fs';
import { FinancialsService } from 'src/financials/financials.service';
import { SmsServiceService } from 'src/sms-service/sms-service.service';

type UpdatedMasterData = {
  fullName: string | null;
  nationalCode: string | null;
  phoneNumber: string | null;
  age: number | null;
  birthDate: Date | null;
  history: string | null;
  certificates: string | null;
};

type ChangedStatusCoach = {
  active: string;
};

type MasterWithAllDetails = Prisma.usersGetPayload<{
  select: {
    user_id: true;
    fullName: true;
    nationalCode: true;
    phoneNumber: true;
    history: true;
    image: true;
    active: true;
    type: true;
    sport: true;
    students: true;
    subscriptionPayments: {
      orderBy: {
        createdAt: 'desc';
      };
    };
    createdAt: true;
    updatedAt: true;
  };
}> & { paymentStatus: SubscriptionPaymentStatus | 'NO_PAYMENT' };

@Injectable()
export class MasterService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly financialsService: FinancialsService,
    private readonly smsService: SmsServiceService,
  ) {}

  async getAllMaster() {
    // const getMaster = await this.prismaService.users.findMany({
    //   where: { type: Role.Master },
    //   select: {
    //     user_id: true,
    //     fullName: true,
    //     nationalCode: true,
    //     phoneNumber: true,
    //     history: true,
    //     image: true,
    //     active: true,
    //     type: true,
    //     sport: true,
    //     students: true,
    //     subscriptionPayments: true,
    //     createdAt: true,
    //     updatedAt: true,
    //   },
    //   orderBy: {
    //     createdAt: 'asc',
    //   },
    // });

    // return {
    //   statusCode: 200,
    //   message: 'لیست استاد های باشگاه با موفقیت دریافت شد',
    //   data: mastersWithStatus,
    // };

    const masters = await this.prismaService.users.findMany({
      where: { type: Role.Master },
      select: {
        user_id: true,
        fullName: true,
        nationalCode: true,
        phoneNumber: true,
        history: true,
        image: true,
        active: true,
        type: true,
        sport: true,
        students: true,
        subscriptionPayments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const mastersWithStatus: MasterWithAllDetails[] = masters.map((master) => {
      const latestPayment = master.subscriptionPayments[0];
      let status: SubscriptionPaymentStatus | 'NO_PAYMENT' = 'NO_PAYMENT';

      if (latestPayment) {
        status = latestPayment.status;
      }

      return {
        ...master,
        paymentStatus: status,
      };
    });

    return {
      statusCode: 200,
      message: 'لیست استاد های باشگاه با موفقیت دریافت شد',
      data: mastersWithStatus,
    };
  }

  // see profile just master
  async getMasterById(masterId: number) {
    const getMaster = await this.prismaService.users.findUnique({
      where: { user_id: masterId, type: Role.Master },
      include: {
        sport: true,
        students: true,
        masterPlan: true,
      },
    });

    if (getMaster?.type !== Role.Master) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'کاربر مورد نظر از نوع استاد نیست',
      });
    }

    if (!getMaster) {
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

  // see profile all master just admin
  async getMasterByIdSeeAdmin(masterId: number) {
    const getMaster = await this.prismaService.users.findUnique({
      where: { user_id: masterId, type: Role.Master },
      include: {
        sport: true,
        students: true,
        masterPlan: true,
      },
    });

    if (!getMaster) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'استادی با این مشخصات یافت نشد',
      });
    }

    if (getMaster.type !== Role.Master) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'کاربر مورد نظر یک استاد نیست',
      });
    }

    return {
      statusCode: 200,
      message: 'استاد با موفقیت یافت شد',
      data: getMaster,
    };
  }

  // select plan just one master in admin
  async assignPlanToMaster(masterId: number, planId: number) {
    const [master, plan] = await Promise.all([
      this.prismaService.users.findUnique({ where: { user_id: masterId } }),
      this.financialsService.findMasterPlanById(planId),
    ]);

    const now = new Date();

    if (!master) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'استاد با این مشخصات یافت نشد',
      });
    }

    if (!plan) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'پلن اشتراک یافت نشد',
      });
    }

    if (master.type !== Role.Master) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'امکان اختصاص پلن به این کاربر وجود ندارد',
      });
    }

    if (master.planEndsAt && master.planEndsAt > now) {
      throw new BadRequestException({
        statusCode: 400,
        message: `شما در حال حاضر یک پلن فعال دارید تا تاریخ ${master.planEndsAt.toLocaleDateString('fa-IR')} لطفا پس از اتمام آن پلن جدید انتخاب کنید`,
      });
    }

    const pendingPayment =
      await this.prismaService.subscriptionPayment.findFirst({
        where: {
          masterId: masterId,
          status: SubscriptionPaymentStatus.PENDING,
        },
      });

    if (pendingPayment) {
      throw new BadRequestException({
        statusCode: 400,
        message:
          'شما یک پرداخت در انتظار تایید دارید لطفا صبر کنید تا پرداخت قبلی بررسی شود',
      });
    }

    if (plan.type === MasterPlanType.TRIAL) {
      if (master.hasUsedTrial) {
        throw new BadRequestException({
          statusCode: 400,
          message: 'کاربر گرامی شما قبلا پلن رایگان را استفاده کرده اید',
        });
      }

      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + (plan.durationInDays || 0));

      const updatedMaster = await this.prismaService.users.update({
        where: { user_id: masterId },
        data: {
          masterPlanId: planId,
          planEndsAt: trialEndsAt,
          hasUsedTrial: true,
        },
      });

      const message = `سلام مدیر محترم ${master.fullName}
پلن آزمایشی "${plan.name}" برای شما فعال شد.
تاریخ انقضا: ${updatedMaster.planEndsAt?.toLocaleDateString('fa-IR')}`;

      if (master.phoneNumber) {
        try {
          await this.smsService.sendMessageToUser(master.phoneNumber, message);
        } catch (error) {
          console.error(`ارسال پیامک فعال‌سازی پلن رایگان ناموفق بود:`, error);
        }
      }

      return {
        statusCode: 200,
        message: `پلن رایگان "${plan.name}" با موفقیت فعال شد`,
        data: updatedMaster,
      };
    }

    const updatedMaster = await this.prismaService.users.update({
      where: { user_id: masterId },
      data: {
        masterPlanId: planId,
        planEndsAt: null,
      },
    });

    const message = `سلام مدیر محترم ${master.fullName}
پلن "${plan.name}" برای شما انتخاب شد.
لطفاً جهت فعال‌سازی، هزینه ${Number(plan.price).toLocaleString('fa-IR')} تومان را پرداخت و رسید آن را ارسال نمایید.`;

    if (master.phoneNumber) {
      try {
        await this.smsService.sendMessageToUser(master.phoneNumber, message);
      } catch (error) {
        console.error(`ارسال پیامک انتخاب پلن پولی ناموفق بود:`, error);
      }
    }

    return {
      statusCode: 200,
      message: `پلن "${plan.name}" انتخاب شد. لطفاً برای فعال‌سازی، هزینه را پرداخت کنید`,
      data: updatedMaster,
    };
  }

  // select plan just your self master
  async getMasterPlanStatus(masterId: number) {
    const master = await this.prismaService.users.findUnique({
      where: { user_id: masterId },
      include: { masterPlan: true },
    });

    if (master?.type === Role.Admin) {
      return {
        statusCode: 200,
        message: 'شما دسترسی ادمین دارید',
        isActive: true,
        isAdmin: true,
        data: {
          planName: 'دسترسی نامحدود ادمین',
          planType: 'UNLIMITED',
          isActive: true,
          isAdmin: true,
        },
      };
    }

    if (!master || !master.masterPlan) {
      return {
        statusCode: 200,
        message: 'شما در حال حاضر هیچ پلن فعالی ندارید',
        isActive: false,
      };
    }

    const plan = master.masterPlan;
    const now = new Date();
    let startsAt: Date | null = null;
    let endsAt: Date | null = null;

    if (plan.type === MasterPlanType.TRIAL) {
      endsAt = master.planEndsAt;
      if (endsAt) {
        startsAt = new Date(endsAt);
        startsAt.setDate(startsAt.getDate() - (plan.durationInDays || 0));
      }
    } else {
      const lastPayment =
        await this.prismaService.subscriptionPayment.findFirst({
          where: {
            masterId: masterId,
            status: SubscriptionPaymentStatus.CONFIRMED,
          },
          orderBy: { updatedAt: 'desc' },
        });

      if (lastPayment) {
        startsAt = lastPayment.updatedAt;
        endsAt = new Date(startsAt);
        endsAt.setDate(endsAt.getDate() + (plan.durationInDays || 0));
      } else {
        return {
          statusCode: 202,
          message:
            'دسترسی شما به امکانات محدود شده است. برای ادامه استفاده از پلن، لطفاً پرداخت را انجام دهید',
          isActive: false,
        };
      }
    }

    if (!startsAt || !endsAt || now > endsAt) {
      return {
        statusCode: 403,
        message: 'پلن شما منقضی شده است',
        isActive: false,
      };
    }

    const totalDurationMs = endsAt.getTime() - startsAt.getTime();
    const elapsedMs = now.getTime() - startsAt.getTime();
    const daysTotal = Math.round(totalDurationMs / (1000 * 60 * 60 * 24));
    const daysLeft = Math.ceil(
      (endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    const progressPercentage = Math.min(
      100,
      (elapsedMs / totalDurationMs) * 100,
    );

    const data = {
      planName: plan.name,
      planType: plan.type,
      isActive: true,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      daysTotal: daysTotal,
      daysLeft: daysLeft,
      progressPercentage: parseFloat(progressPercentage.toFixed(1)),
    };

    return {
      statusCode: 200,
      message: 'وضعیت پلن با موفقیت دریافت شد',
      data: data,
    };
  }

  // select plan just your self master
  async selectPlanForSelf(masterId: number, planId: number) {
    const planMaster = await this.assignPlanToMaster(masterId, planId);

    return {
      statusCode: 200,
      message: 'پلن انتخاب شده با موفقیت ثبت شد',
      data: planMaster,
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
        age: dto.age,
        birthDate: dto.birthDate,
        history: dto.history,
        certificates: dto.certificates,
        ...(dto.sportId && { sportId: dto.sportId }),
        image: imageUrl,
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
      statusCode: 200,
      message: 'پروفایل با موفقیت بروزرسانی شد',
      data: updateMaster,
    };
  }

  // change Status Just Admin
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

  // Delete Account Just Admin
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

    await this.prismaService.$transaction(async (prisma) => {
      try {
        await prisma.clubProfile.deleteMany({
          where: { userId: masterId },
        });
      } catch (error: any) {
        console.log(error);
      }
    });

    await this.prismaService.users.delete({
      where: { user_id: masterId, type: Role.Master },
    });

    return { statusCode: 200, message: 'استاد باشگاه با موفقیت حذف شد' };
  }
}
