import { MasterPlanType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateMasterPlanDto {
  @IsString()
  @IsNotEmpty({ message: 'نام پلن نمی تواند خالی باشد' })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  price?: number;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true, message: 'ویژگی نمی تواند خالی باشد' })
  features: string[];

  @IsEnum(MasterPlanType)
  @IsNotEmpty({ message: 'نوع پلن نمی تواند خالی باشد' })
  type: MasterPlanType;

  @IsInt()
  @IsNotEmpty({ message: 'مدت زمان پلن نمی تواند خالی باشد' })
  @Type(() => Number)
  durationInDays: number;
}
