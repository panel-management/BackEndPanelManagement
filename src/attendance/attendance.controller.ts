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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';

@Controller('attendance')
@ApiBearerAuth('authorization')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Master)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('/mark')
  @ApiOperation({
    summary: 'حضور غیاب هنرجو ها و مربی ها',
    description: `
    مقادیر مجاز:
    - PRESENT: حاضر
    - ABSENT: غایب
    - LATE: تاخیر
    - EXCUSED: موجه
    `,
  })
  @ApiCreatedResponse({ description: 'حضور یا غیاب به موفقیت ثبت شد' })
  @ApiBadRequestResponse({ description: 'شناسه این استاد نامعتبر است' })
  @ApiBody({ type: MarkAttendanceDto })
  @HttpCode(HttpStatus.CREATED)
  markAttendance(@Req() req, @Body() markAttendanceDto: MarkAttendanceDto) {
    return this.attendanceService.markAttendance(req.user.userId, markAttendanceDto);
  }

  @Get('/list')
  @ApiOperation({
    summary: 'نمایش لیست هنرجو ها و مربی ها برای حضور غیاب',
    description: `
    نمونه درخواست:
    GET /api/v1/attendance/list?page=1&limit=10
    `,
  })
  @ApiOkResponse({ description: 'لیست کاربران با موفقیت دریافت شد' })
  @ApiNotFoundResponse({ description: 'هیچ کاربری برای این استاد یافت نشد' })
  @HttpCode(HttpStatus.OK)
  getAttendanceList(@Req() req, @Query() pageQueryDto: PaginationQueryDto) {
    return this.attendanceService.getAttendanceListForDate(req.user.userId, pageQueryDto);
  }

  @Get('/report')
  @ApiOperation({
    summary: 'نمایش لیست گزارش حضور غیاب ها',
    description: `
    نمونه درخواست:
    GET /api/v1/attendance/report?page=1&limit=10&period=today
    `,
  })
  @ApiOkResponse({ description: 'لیست گزارش ها با موفقیت دریافت شد' })
  @HttpCode(HttpStatus.OK)
  getReport(@Req() req, @Query() queryDto: GetReportDto) {
    return this.attendanceService.getAttendanceReportFull(req.user.userId, queryDto);
  }

  @Get('/history/:id')
  @ApiOperation({
    summary: 'نمایش تاریخچه حضور و غیاب هنرجو یا مربی',
    description: `
    نمونه درخواست:
    GET /api/v1/attendance/history/5?period=all
    `,
  })
  @ApiOkResponse({ description: 'تاریخچه حضور و غیاب دریافت شد' })
  @ApiNotFoundResponse({ description: 'هیچ سابقه‌ای در این بازه زمانی یافت نشد' })
  @ApiParam({ name: 'id', type: Number, example: 5 })
  @HttpCode(HttpStatus.OK)
  getUserHistory(
    @Param('id', ParseIntPipe) userId: number,
    @Query() queryDto: GetStudentHistoryDto,
  ) {
    return this.attendanceService.getStudentHistory(userId, queryDto);
  }
}
