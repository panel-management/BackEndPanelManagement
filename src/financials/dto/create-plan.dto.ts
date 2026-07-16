import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreatePlanDto {
  @ApiProperty({ example: 'طرح خصوصی' })
  @IsString()
  @IsNotEmpty({ message: 'نام پلن الزامی است' })
  name: string;

  @ApiProperty({ example: 'برای تدریس خصوصی اعضا' })
  @IsString()
  @IsNotEmpty({ message: 'توضیحات پلن الزامی است' })
  description: string;

  @ApiProperty({ example: 1_000_000, type: Number })
  @IsNumber()
  @IsNotEmpty({ message: 'مبلغ پلن الزامی است' })
  @Type(() => Number)
  @Min(0)
  price: number;

  @ApiProperty({ example: 30, type: Number })
  @IsInt()
  @IsNotEmpty({ message: 'زمان پلن الزامی است' })
  @Type(() => Number)
  @Min(1)
  durationInDays: number;
}
