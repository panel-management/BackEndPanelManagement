import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  GetReportDto,
  GetStudentHistoryDto,
  MarkAttendanceDto,
} from './dto/create-attendance.dto';
import { Cron } from '@nestjs/schedule';
import { AttendanceStatus } from '@prisma/client';
import { Role } from 'src/auth/enums/role.enum';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  private getStartOfTodayUTC(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }

  async getAttendanceListForDate(masterId: number) {
    const targetDate = this.getStartOfTodayUTC();

    const users = await this.prisma.users.findMany({
      where: {
        masterId: masterId,
        type: { in: [Role.Coach, Role.Student] },
      },
      select: { user_id: true, fullName: true, type: true },
    });

    if (users.length === 0) {
      throw new NotFoundException('هیچ کاربری برای این استاد یافت نشد');
    }

    const userIds = users.map((u) => u.user_id);

    const existingAttendances = await this.prisma.attendance.findMany({
      where: {
        date: targetDate,
        studentId: { in: userIds },
      },
    });

    const attendanceList = users.map((user) => {
      const attendanceRecord = existingAttendances.find(
        (att) => att.studentId === user.user_id,
      );
      const roles = user.type === Role.Coach ? 'مربی' : 'هنرجو';
      return {
        userId: user.user_id,
        fullName: user.fullName,
        role: roles,
        status: attendanceRecord ? attendanceRecord.status : null,
      };
    });

    return {
      statusCode: 200,
      message: 'لیست کاربران با موفقیت دریافت شد',
      data: attendanceList,
    };
  }

  async markAttendance(masterId: number, dto: MarkAttendanceDto) {
    const { attendances } = dto;
    const date = this.getStartOfTodayUTC();

    if (!masterId || isNaN(masterId)) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'شناسه مربی نامعتبر یا نامعتبر شده است',
      });
    }

    const transactionPromises = attendances.map((att) =>
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
    );

    await this.prisma.$transaction(transactionPromises);
    return { statusCode: 201, message: 'حضور غیاب با موفقیت ثبت شد' };
  }

  async getStudentHistory(studentId: number, dto: GetStudentHistoryDto) {
    const { period } = dto;
    let startDate: Date | undefined;
    const now = new Date();

    switch (period) {
      case 'all':
        startDate = undefined;
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        const daysToSubtract = (dayOfWeek + 1) % 7;
        now.setDate(now.getDate() - daysToSubtract);
        startDate = new Date(
          Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
        );
        break;
      case 'month':
        startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
        break;
      default:
        throw new BadRequestException({
          statusCode: 400,
          message: 'هیچ بازه زمانی برای این هنرجو یافت نشد',
        });
    }

    const history = await this.prisma.attendance.findMany({
      where: {
        studentId: studentId,
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    if (history.length === 0) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'هیچ تاریخچه حضور و غیابی برای این کاربر یافت نشد',
      });
    }

    return {
      statusCode: 200,
      message: 'اطلاعات حضور غیاب این کاربر با موفقیت دریافت شد',
      data: history,
    };
  }

  async getAttendanceReport(masterId: number, dto: GetReportDto) {
    const { period } = dto;
    const now = new Date();
    let startDate: Date;
    let name: string;

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
        startDate = new Date(
          Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
        );
        break;
      case 'month':
        name = 'این ماه';
        startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
        break;
      default:
        throw new BadRequestException({
          statusCode: 400,
          message: 'بازه زمانی نامعتبر است',
        });
    }

    const getReport = await this.prisma.attendance.findMany({
      where: {
        markedById: masterId,
        date: { gte: startDate, lte: new Date() },
      },
      include: { student: { select: { fullName: true, phoneNumber: true } } },
      orderBy: { date: 'asc' },
    });

    return {
      statusCode: 200,
      message: `گزارش ${name} با موفقیت دریافت شد`,
      data: getReport,
    };
  }

  async getAttendanceSummary(masterId: number, dto: GetReportDto) {
    const { period } = dto;
    const now = new Date();
    let startDate: Date;
    let name: string;

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
        startDate = new Date(
          Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
        );
        break;
      case 'month':
        name = 'این ماه';
        startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
        break;
      default:
        throw new BadRequestException({
          statusCode: 400,
          message: 'بازه زمانی نامعتبر است',
        });
    }

    const records = await this.prisma.attendance.findMany({
      where: {
        markedById: masterId,
        date: {
          gte: startDate,
          lte: new Date(),
        },
      },
      select: {
        status: true,
      },
    });

    const summary = {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      EXCUSED: 0,
    };

    for (const record of records) {
      if (record.status && summary.hasOwnProperty(record.status)) {
        summary[record.status]++;
      }
    }

    return {
      statusCode: 200,
      message: `گزارش ${name} با موفقیت دریافت شد`,
      data: summary,
    };
  }

  async getAllSessions(masterId: number) {
    const sessions = await this.prisma.attendance.findMany({
      where: { markedById: masterId },
      distinct: ['date'],
      select: {
        date: true,
      },
      orderBy: { date: 'asc' },
    });

    if (sessions.length === 0) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'هیچ جلسه حضور غیاب یافت نشد',
      });
    }

    const sessionDates = sessions.map((session) => session.date);

    return {
      statusCode: 200,
      message: 'جلسات با موفقیت در یافت شد',
      data: {
        totalSessions: sessionDates.length,
        sessions: sessionDates,
      },
    };
  }

  @Cron('59 23 * * *')
  async handleDailyAbsenceMarking() {
    console.log(`Running daily absence marking job at ${new Date()}`);
    const today = this.getStartOfTodayUTC();

    const allSubordinates = await this.prisma.users.findMany({
      where: {
        masterId: {
          not: null,
        },
        type: {
          in: [Role.Coach, Role.Student],
        },
      },
      select: { user_id: true, masterId: true },
    });

    const markedAttendances = await this.prisma.attendance.findMany({
      where: { date: today },
      select: { studentId: true },
    });
    const markedUserIds = new Set(markedAttendances.map((a) => a.studentId));

    const unmarkedUsers = allSubordinates.filter(
      (user) => !markedUserIds.has(user.user_id),
    );

    if (unmarkedUsers.length === 0) {
      console.log(
        'All coaches and students have been marked for today. No action needed.',
      );
      return;
    }

    const validUnmarkedUsers = unmarkedUsers.filter(
      (user) => user.masterId !== null,
    );

    const absenceCreationData = validUnmarkedUsers.map((user) => {
      return {
        date: today,
        status: AttendanceStatus.ABSENT,
        studentId: user.user_id,
        markedById: user.masterId!,
      };
    });

    if (absenceCreationData.length > 0) {
      await this.prisma.attendance.createMany({
        data: absenceCreationData,
        skipDuplicates: true,
      });
      console.log(
        `Marked ${absenceCreationData.length} users as ABSENT for ${today.toDateString()}`,
      );
    }
  }
}
