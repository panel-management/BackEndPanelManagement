import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateEquipmentDto {
  @IsInt()
  @IsNotEmpty({ message: 'شناسه هنرجو الزامی است' })
  @Type(() => Number)
  studentId: number;

  @IsNumber()
  @IsNotEmpty({ message: 'مبلغ الزامی است' })
  @Min(0)
  @Type(() => Number)
  amount: number;

  @IsString()
  @IsNotEmpty({ message: 'توضیحات الزامی است' })
  description: string;
}
