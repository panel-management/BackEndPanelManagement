import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateStudentDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  nationalCode?: string;

  @IsString()
  @IsOptional()
  birthDate?: string;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
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

  @IsArray()
  @IsInt({ each: true, message: 'هر شناسه کمربند باید یک عدد باشد' })
  @IsOptional()
  beltIds?: number[];
}
