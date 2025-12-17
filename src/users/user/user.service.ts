import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  SubscriptionPaymentStatus,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { Role } from 'src/auth/enums/role.enum';
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
        phoneNumber: true,
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

  private calculateProgress(startDate: Date, endDate: Date, now: Date) {
    const totalDurationMs = endDate.getTime() - startDate.getTime();
    const elapsedMs = now.getTime() - startDate.getTime();
    const daysTotal = Math.round(totalDurationMs / (1000 * 60 * 60 * 24));
    const daysLeft = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    const progressPercentage = Math.min(
      100,
      (elapsedMs / totalDurationMs) * 100,
    );

    return {
      daysTotal: daysTotal,
      daysLeft: daysLeft,
      daysElapsed: daysTotal - daysLeft,
      progressPercentage: parseFloat(progressPercentage.toFixed(1)),
    };
  }

  async getPlanStatus(userId: number) {
    const user = await this.prisma.users.findUnique({
      where: { user_id: userId },
      include: {
        masterPlan: true,
        assignedPlan: true,
        studentTransactions: {
          where: { status: TransactionStatus.UNPAID },
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'کاربر یافت نشد',
      });
    }

    const now = new Date();

    if (user.type === Role.Admin) {
      return {
        statusCode: 200,
        message: 'شما دسترسی ادمین دارید',
        userType: 'ADMIN',
        isActive: true,
        isAdmin: true,
      };
    }

    if (user.type === Role.Master) {
      if (!user.masterPlan) {
        return {
          statusCode: 200,
          message: 'شما در حال حاضر هیچ پلن فعالی ندارید',
          userType: 'MASTER',
          isActive: false,
          noPlan: true,
        };
      }

      const plan = user.masterPlan;

      const pendingPayment = await this.prisma.subscriptionPayment.findFirst({
        where: {
          masterId: userId,
          planId: user.masterPlanId,
          status: SubscriptionPaymentStatus.PENDING,
        },
      });

      if (pendingPayment) {
        return {
          statusCode: 202,
          message:
            'رسید پرداخت شما در حال بررسی است. لطفاً صبر کنید تا توسط ادمین تایید شود',
          userType: 'MASTER',
          isActive: false,
          isPending: true,
          data: {
            planName: plan.name,
            planPrice: plan.price?.toNumber() || 0,
          },
        };
      }

      if (!user.planEndsAt) {
        return {
          statusCode: 202,
          message: `شما پلن "${plan.name}" را انتخاب کرده‌اید. برای فعال‌سازی، لطفاً هزینه ${plan.price?.toNumber().toLocaleString('fa-IR') || '0'} تومان را پرداخت و رسید را ارسال کنید`,
          userType: 'MASTER',
          isActive: false,
          needsPayment: true,
          data: {
            planName: plan.name,
            planPrice: plan.price?.toNumber() || 0,
          },
        };
      }

      const startsAt = new Date(user.planEndsAt);
      startsAt.setDate(startsAt.getDate() - (plan.durationInDays || 0));
      const endsAt = user.planEndsAt;

      if (now > endsAt) {
        return {
          statusCode: 403,
          message: 'پلن شما منقضی شده است. لطفاً پلن جدیدی انتخاب کنید',
          userType: 'MASTER',
          isActive: false,
          isExpired: true,
          data: {
            planName: plan.name,
            expiredAt: endsAt.toISOString(),
          },
        };
      }

      const progress = this.calculateProgress(startsAt, endsAt, now);

      return {
        statusCode: 200,
        message: 'وضعیت پلن با موفقیت دریافت شد',
        userType: 'MASTER',
        isActive: true,
        data: {
          planName: plan.name,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          ...progress,
        },
      };
    }

    if (user.type === Role.Coach) {
      return {
        statusCode: 200,
        message: 'مربی بدون پلن ؟؟؟',
        userType: 'COACH',
        isActive: true,
      };
    }

    if (user.type === Role.Student) {
      if (!user.assignedPlan) {
        return {
          statusCode: 200,
          message: 'شما هنوز به پلنی اختصاص داده نشده‌اید',
          userType: 'STUDENT',
          isActive: false,
          noPlan: true,
        };
      }

      const plan = user.assignedPlan;

      const totalDebt = user.studentTransactions.reduce(
        (sum, t) => sum + t.amount.toNumber(),
        0,
      );

      const unpaidFees = user.studentTransactions.filter(
        (t) => t.type === TransactionType.FEE,
      );

      if (!user.planEndsAt) {
        return {
          statusCode: 200,
          message: 'پلن شما هنوز فعال نشده است',
          userType: 'STUDENT',
          isActive: false,
          plan: {
            name: plan.name,
            price: plan.price.toNumber(),
          },
        };
      }

      const planEndDate = new Date(user.planEndsAt);

      const planStartDate = new Date(planEndDate);
      planStartDate.setDate(planStartDate.getDate() - plan.durationInDays);

      if (now > planEndDate) {
        return {
          statusCode: 403,
          message: 'پلن شما منقضی شده است. لطفاً با مدیر باشگاه تماس بگیرید',
          userType: 'STUDENT',
          isActive: false,
          isExpired: true,
          plan: {
            name: plan.name,
            price: plan.price.toNumber(),
            expiredAt: planEndDate.toISOString(),
            expiredDaysAgo: Math.floor(
              (now.getTime() - planEndDate.getTime()) / (1000 * 60 * 60 * 24),
            ),
          },
          debt: {
            total: totalDebt,
            unpaidCount: user.studentTransactions.length,
            unpaidFees: unpaidFees.length,
          },
        };
      }

      const nextDueTransaction = user.studentTransactions[0];
      const isOverdue =
        nextDueTransaction && new Date(nextDueTransaction.dueDate) < now;

      if (totalDebt > 0) {
        return {
          statusCode: 202,
          message: isOverdue
            ? `شما ${unpaidFees.length} شهریه پرداخت نشده دارید. لطفاً در اسرع وقت پرداخت کنید`
            : `شما شهریه ${plan.name} را پرداخت نکرده‌اید. لطفاً در اسرع وقت پرداخت کنید`,
          userType: 'STUDENT',
          isOverdue: isOverdue,
          isActive: false,
          isPending: true,
        };
      }

      const timeLeftMs = planEndDate.getTime() - now.getTime();
      let daysLeft = Math.ceil(timeLeftMs / (1000 * 60 * 60 * 24));
      let timeLeftMessage = `${daysLeft} روز دیگر`;

      if (timeLeftMs > 0 && timeLeftMs < 1000 * 60 * 60 * 24) {
        const hoursLeft = Math.ceil(timeLeftMs / (1000 * 60 * 60));
        daysLeft = 0;
        timeLeftMessage = `${hoursLeft} ساعت دیگر`;
      }

      const isExpiringSoon = daysLeft > 0 && daysLeft <= 7;

      const progress = this.calculateProgress(planStartDate, planEndDate, now);

      return {
        statusCode: 200,
        message: isExpiringSoon
          ? `پلن شما ${timeLeftMessage} به پایان می‌رسد`
          : 'وضعیت پلن با موفقیت دریافت شد',
        userType: 'STUDENT',
        isExpiringSoon: isExpiringSoon,
        isActive: true,
        data: {
          planName: plan.name,
          durationInDays: plan.durationInDays,
          startsAt: planStartDate.toISOString(),
          endsAt: planEndDate.toISOString(),
          ...progress,
        },
      };
    }

    throw new BadRequestException({
      statusCode: 400,
      message: 'نقش کاربری نامعتبر است',
    });
  }
}
