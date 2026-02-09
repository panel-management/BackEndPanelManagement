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
import { GetReportDto, GetStudentHistoryDto, MarkAttendanceDto } from './dto/create-attendance.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PaginationQueryDto } from 'src/common/dto/pagination.dto';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Master)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) { }

  @Post('/mark')
  @HttpCode(HttpStatus.CREATED)
  markAttendance(@Req() req, @Body() markAttendanceDto: MarkAttendanceDto) {
    return this.attendanceService.markAttendance(
      req.user.userId,
      markAttendanceDto,
    );
  }

  @Get('/list')
  @HttpCode(HttpStatus.OK)
  getAttendanceList(@Req() req, @Query() pageQueryDto: PaginationQueryDto) {
    return this.attendanceService.getAttendanceListForDate(
      req.user.userId,
      pageQueryDto,
    );
  }

  @Get('/report')
  @HttpCode(HttpStatus.OK)
  getReport(@Req() req, @Query() queryDto: GetReportDto) {
    return this.attendanceService.getAttendanceReportFull(
      req.user.userId,
      queryDto,
    );
  }

  @Get('/history/:id')
  @HttpCode(HttpStatus.OK)
  getUserHistory(
    @Param('id', ParseIntPipe) userId: number,
    @Query() queryDto: GetStudentHistoryDto,
  ) {
    return this.attendanceService.getStudentHistory(userId, queryDto);
  }
}
