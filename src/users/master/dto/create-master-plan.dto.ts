import { MasterPlanType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMasterPlanDto {
  @IsString()
  @IsNotEmpty({ message: 'نام پلن الزامی است' })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  price?: number;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true, message: 'ویژگی الزامی است' })
  features: string[];

  @IsEnum(MasterPlanType)
  @IsNotEmpty({ message: 'نوع پلن الزامی است' })
  type: MasterPlanType;

  @IsInt()
  @IsNotEmpty({ message: 'مدت زمان پلن الزامی است' })
  @Type(() => Number)
  durationInDays: number;
}
