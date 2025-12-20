import {
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
  IsString,
  IsOptional,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '@prisma/client';

export class MarkAttendanceItemDto {
  @IsNumber()
  studentId: number;

  @IsEnum(AttendanceStatus)
  @IsOptional()
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

export class GetReportDto {
  @IsOptional()
  @IsString()
  @IsEnum(['today', 'week', 'month'])
  period?: 'today' | 'week' | 'month';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}
