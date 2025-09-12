import { MasterPlanType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateMasterPlanDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  price: number;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  features: string[];

  @IsEnum(MasterPlanType)
  @IsNotEmpty()
  type: MasterPlanType;

  @IsInt()
  durationInDays: number;
}
