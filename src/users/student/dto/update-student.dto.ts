import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateStudentDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  nationalCode?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  birthDate?: Date;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  age?: number;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  phoneNumberEmergency?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsBoolean()
  @IsOptional()
  underSupervisionDoctor?: boolean;

  @IsBoolean()
  @IsOptional()
  diseaseRecords?: boolean;

  @IsInt({ each: true, message: 'شناسه کمربند باید یک عدد باشد' })
  @IsOptional()
  @Type(() => Number)
  beltIds?: number;

  @IsInt({ each: true, message: 'شناسه پلن باید یک عدد باشد' })
  @IsOptional()
  @Type(() => Number)
  planId?: number;
}
