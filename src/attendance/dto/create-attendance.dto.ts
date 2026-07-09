import { IsEnum, IsArray, ValidateNested, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/dto/pagination.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MarkAttendanceItemDto {
  @ApiProperty({ example: 5, type: Number })
  @IsInt()
  @Type(() => Number)
  studentId: number;

  @ApiProperty({
    enum: AttendanceStatus,
    enumName: 'AttendanceStatus',
    example: AttendanceStatus.PRESENT,
    description: `
    مقادیر مجاز:
    - PRESENT: حاضر
    - ABSENT: غایب
    - LATE: تاخیر
    - EXCUSED: موجه
    `,
  })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;
}

export class MarkAttendanceDto {
  @ApiProperty({
    type: [MarkAttendanceItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MarkAttendanceItemDto)
  attendances: MarkAttendanceItemDto[];
}

export class GetStudentHistoryDto {
  @ApiProperty({
    enum: ['week', 'month', 'all'],
    example: 'all',
    description: `
     مقادیر مجاز:
     week: هفته
     month: ماه
     all: همه
    `,
  })
  @IsEnum(['week', 'month', 'all'])
  period: 'week' | 'month' | 'all';
}

export class GetReportDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ['today', 'week', 'month'],
    example: 'today',
    description: `
    مقادیر مجاز
    today: امروز
    week: این هفته
    month: این ماه
    `,
  })
  @IsOptional()
  @IsEnum(['today', 'week', 'month'])
  period?: 'today' | 'week' | 'month';
}
