import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ example: 'پلن شروع' })
  @IsString()
  @IsNotEmpty({ message: 'نام پلن الزامی است' })
  name: string;

  @ApiPropertyOptional({
    example: 'پلن شروع برای باشگاه های کوچیک',
    description: 'این فیلد به صورت اختیاری است',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 2_000_000,
    type: Number,
    description: 'این فیلد به صورت اختیاری است',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  price?: number;

  @ApiProperty({ example: ['مورد اول', 'مورد دوم', 'مورد سوم'], type: [String], isArray: true })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true, message: 'ویژگی الزامی است' })
  features: string[];

  @ApiProperty({
    enum: MasterPlanType,
    enumName: 'MasterPlanType',
    example: MasterPlanType.TRIAL,
    description: `
    مقادیر مجاز:
    - PAID: پولی
    - TRIAL: آزمایشی
    `,
  })
  @IsEnum(MasterPlanType)
  @IsNotEmpty({ message: 'نوع پلن الزامی است' })
  type: MasterPlanType;

  @ApiProperty({ example: 30, type: Number })
  @IsInt()
  @IsNotEmpty({ message: 'مدت زمان پلن الزامی است' })
  @Type(() => Number)
  durationInDays: number;
}
