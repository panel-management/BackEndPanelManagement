import {
  IsEnum,
  IsArray,
  ValidateNested,
  IsString,
  IsOptional,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/dto/pagination.dto';

export class MarkAttendanceItemDto {
  @IsInt()
  @Type(() => Number)
  studentId: number;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;
}

export class MarkAttendanceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MarkAttendanceItemDto)
  attendances: MarkAttendanceItemDto[];
}

export class GetStudentHistoryDto {
  @IsString()
  @IsEnum(['week', 'month', 'all'])
  period: 'week' | 'month' | 'all';
}

export class GetReportDto extends PaginationQueryDto {
  @IsString()
  @IsOptional()
  @IsEnum(['today', 'week', 'month'])
  period?: 'today' | 'week' | 'month';
}