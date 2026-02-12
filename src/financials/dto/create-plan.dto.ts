import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty({ message: 'نام پلن الزامی است' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'توضیحات پلن الزامی است' })
  description: string;

  @IsNumber()
  @IsNotEmpty({ message: 'مبلغ پلن الزامی است' })
  @Type(() => Number)
  @Min(0)
  price: number;

  @IsInt()
  @IsNotEmpty({ message: 'زمان پلن الزامی است' })
  @Type(() => Number)
  @Min(1)
  durationInDays: number;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
