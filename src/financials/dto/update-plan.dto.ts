import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class UpdatePlanDto {
  @IsString()
  @IsNotEmpty({ message: 'نام پلن الزامی است' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'توضیحات پلن الزامی است' })
  description: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price: number;

  @IsInt()
  @Type(() => Number)
  @Min(1)
  durationInDays: number;
}
