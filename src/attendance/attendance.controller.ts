import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AttendanceService } from './attendance.service';
import {
  GetReportDto,
  GetStudentHistoryDto,
  MarkAttendanceDto,
  PaginationDto,
} from './dto/create-attendance.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Master)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('list')
  @HttpCode(HttpStatus.OK)
  getAttendanceList(@Req() req, @Query() paginationDto: PaginationDto) {
    return this.attendanceService.getAttendanceListForDate(
      req.user.userId,
      paginationDto,
    );
  }

  @Get('history/:id')
  @HttpCode(HttpStatus.OK)
  getUserHistory(
    @Param('id', ParseIntPipe) userId: number,
    @Query() queryDto: GetStudentHistoryDto,
  ) {
    return this.attendanceService.getStudentHistory(userId, queryDto);
  }

  @Post('mark')
  @HttpCode(HttpStatus.CREATED)
  markAttendance(@Req() req, @Body() markAttendanceDto: MarkAttendanceDto) {
    return this.attendanceService.markAttendance(
      req.user.userId,
      markAttendanceDto,
    );
  }

  @Get('report')
  @HttpCode(HttpStatus.OK)
  getReport(@Req() req, @Query() queryDto: GetReportDto) {
    return this.attendanceService.getAttendanceReport(
      req.user.userId,
      queryDto,
    );
  }

  @Get('summary')
  @HttpCode(HttpStatus.OK)
  getSummary(@Req() req, @Query() queryDto: GetReportDto) {
    return this.attendanceService.getAttendanceSummary(
      req.user.userId,
      queryDto,
    );
  }

  @Get('session')
  @HttpCode(HttpStatus.OK)
  getSessions(@Req() req) {
    return this.attendanceService.getAllSessions(req.user.userId);
  }
}
