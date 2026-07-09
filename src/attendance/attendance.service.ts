import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetReportDto, GetStudentHistoryDto, MarkAttendanceDto } from './dto/create-attendance.dto';
import { Cron } from '@nestjs/schedule';
import { AttendanceStatus } from '@prisma/client';
import { Role } from 'src/auth/enums/role.enum';
import { PaginationQueryDto } from 'src/common/dto/pagination.dto';
import { Logger } from '@nestjs/common';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  private getStartOfTodayUTC(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }

  private readonly logger = new Logger(AttendanceService.name);

  // cron job persnt or absent users befor new day
  @Cron('59 23 * * *', { timeZone: 'Asia/Tehran' })
  async handleDailyAbsenceMarking() {
    this.logger.log(`شروع عملیات بررسی حضور و غیاب ناقص...`);
    const today = this.getStartOfTodayUTC();

    const activeMastersToday = await this.prisma.attendance.findMany({
      where: { date: today },
      distinct: ['markedById'],
      select: { markedById: true },
    });

    if (activeMastersToday.length === 0) {
      this.logger.log('هیچ استادی امروز حضور و غیاب انجام نداده است. عملیات متوقف شد.');
      return;
    }

    const activeMasterIds = activeMastersToday.map((m) => m.markedById);

    const subordinatesOfActiveMasters = await this.prisma.users.findMany({
      where: {
        masterId: { in: activeMasterIds },
        type: { in: [Role.Coach, Role.Student] },
        isActive: true,
      },
      select: { user_id: true, masterId: true },
    });

    const existingAttendances = await this.prisma.attendance.findMany({
      where: { date: today },
      select: { studentId: true },
    });

    const markedUserIds = new Set(existingAttendances.map((a) => a.studentId));

    const missedUsers = subordinatesOfActiveMasters.filter(
      (user) => !markedUserIds.has(user.user_id),
    );

    if (missedUsers.length === 0) {
      this.logger.log('تمام شاگردانِ اساتید فعال، تعیین تکلیف شده بودند.');
      return;
    }

    const finalData = missedUsers.map((user) => ({
      date: today,
      status: AttendanceStatus.ABSENT,
      studentId: user.user_id,
      markedById: user.masterId!,
    }));

    await this.prisma.attendance.createMany({
      data: finalData,
      skipDuplicates: true,
    });

    this.logger.log(
      `تعداد ${finalData.length} نفر که توسط اساتید فراموش شده بودند، غایب زده شدند.`,
    );
  }

  // presnt and absent for stduent and coach
  async markAttendance(masterId: number, dto: MarkAttendanceDto) {
    const { attendances } = dto;
    const date = this.getStartOfTodayUTC();

    if (!masterId || isNaN(masterId)) {
      throw new HttpException('شناسه این استاد نامعتبر است', HttpStatus.BAD_REQUEST);
    }

    await this.prisma.$transaction(
      attendances.map((att) =>
        this.prisma.attendance.upsert({
          where: {
            date_studentId: {
              date: date,
              studentId: att.studentId,
            },
          },
          update: { status: att.status },
          create: {
            date: date,
            status: att.status,
            student: { connect: { user_id: att.studentId } },
            markedBy: { connect: { user_id: masterId } },
          },
        }),
      ),
    );

    return { statusCode: HttpStatus.OK, message: 'حضور غیاب با موفقیت ثبت شد' };
  }

  // get list stduent and coach for presnt and absent
  async getAttendanceListForDate(masterId: number, pageQueryDto: PaginationQueryDto) {
    const { page = 1, limit = 10 } = pageQueryDto;
    const skip = (page - 1) * limit;
    const targetDate = this.getStartOfTodayUTC();

    const [totalUsers, users] = await this.prisma.$transaction([
      this.prisma.users.count({
        where: { masterId, type: { in: [Role.Coach, Role.Student] } },
      }),
      this.prisma.users.findMany({
        where: { masterId, type: { in: [Role.Coach, Role.Student] } },
        select: {
          user_id: true,
          fullName: true,
          currentBelt: true,
          type: true,
        },
        skip,
        take: limit,
      }),
    ]);

    if (users.length === 0) {
      throw new HttpException('هیچ کاربری برای این استاد یافت نشد', HttpStatus.NOT_FOUND);
    }

    const userIds = users.map((u) => u.user_id);

    const existingAttendances = await this.prisma.attendance.findMany({
      where: {
        date: targetDate,
        studentId: { in: userIds },
      },
    });

    const attendanceList = users.map((user) => {
      const attendanceRecord = existingAttendances.find((att) => att.studentId === user.user_id);
      return {
        userId: user.user_id,
        fullName: user.fullName,
        role: user.type === Role.Coach ? 'مربی' : 'هنرجو',
        status: attendanceRecord?.status,
        belt: user.currentBelt?.color,
      };
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'لیست کاربران با موفقیت دریافت شد',
      data: attendanceList,
      pagination: {
        total: totalUsers,
        page: page,
        limit: limit,
        totalPage: Math.ceil(totalUsers / limit),
      },
    };
  }

  // get report for all class club
  async getAttendanceReportFull(masterId: number, dto: GetReportDto) {
    const { period, page = 1, limit = 10 } = dto;
    const now = new Date();
    let startDate: Date | undefined;
    let name: string = 'همه';

    if (period) {
      switch (period) {
        case 'today':
          name = 'امروز';
          startDate = this.getStartOfTodayUTC();
          break;
        case 'week':
          name = 'این هفته';
          const dayOfWeek = now.getDay();
          const daysToSubtract = (dayOfWeek + 1) % 7;
          now.setDate(now.getDate() - daysToSubtract);
          startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
          break;
        case 'month':
          name = 'این ماه';
          startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
          break;
      }
    }

    const where = {
      markedById: masterId,
      ...(startDate && { date: { gte: startDate, lte: new Date() } }),
    };

    const [total, report, groupStats, sessionData] = await this.prisma.$transaction([
      this.prisma.attendance.count({ where }),
      this.prisma.attendance.findMany({
        where,
        select: {
          id: true,
          status: true,
          date: true,
          createdAt: true,
          student: { select: { fullName: true, type: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      this.prisma.attendance.groupBy({
        where,
        by: ['status'],
        _count: { status: true },
        orderBy: { status: 'desc' },
      }),
      this.prisma.attendance.findMany({
        where,
        distinct: ['date'],
        select: { date: true },
        orderBy: { status: 'desc' },
      }),
    ]);

    const summary: Record<AttendanceStatus, number> = {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      EXCUSED: 0,
    };

    groupStats.forEach((stat) => {
      if (stat.status && stat.status in summary) {
        summary[stat.status] = (stat._count as any).status;
      }
    });

    const sessionDates = sessionData.map((s) => s.date.toISOString());

    const sessions = {
      totalSessions: sessionDates.length,
      sessions: sessionDates,
    };

    return {
      statusCode: HttpStatus.OK,
      message: `گزارش ${name} با موفقیت دریافت شد`,
      data: {
        report,
        summary,
        sessions,
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // get history presnt or absent for stduent
  async getStudentHistory(studentId: number, dto: GetStudentHistoryDto) {
    const { period } = dto;
    const now = new Date();
    let startDate: Date | undefined;

    switch (period) {
      case 'week':
        const dayOfWeek = now.getDay();
        const daysToSubtract = (dayOfWeek + 1) % 7;
        now.setDate(now.getDate() - daysToSubtract);
        startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        break;
      case 'month':
        startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
        break;
      case 'all':
      default:
        startDate = undefined;
        break;
    }

    const whereClause: any = {
      studentId: studentId,
    };

    if (startDate) {
      whereClause.date = { gte: startDate };
    }

    const history = await this.prisma.attendance.findMany({
      where: whereClause,
      select: {
        date: true,
        status: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return {
      statusCode: HttpStatus.OK,
      message:
        history.length > 0
          ? 'تاریخچه حضور و غیاب دریافت شد'
          : 'هیچ سابقه‌ای در این بازه زمانی یافت نشد',
      data: history,
    };
  }
}
