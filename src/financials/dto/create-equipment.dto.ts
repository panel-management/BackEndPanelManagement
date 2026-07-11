import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateEquipmentDto {
  @ApiProperty({ example: 5, type: Number })
  @IsInt()
  @IsNotEmpty({ message: 'شناسه هنرجو الزامی است' })
  @Type(() => Number)
  studentId: number;

  @ApiProperty({ example: 5_000, type: Number })
  @IsNumber()
  @IsNotEmpty({ message: 'مبلغ الزامی است' })
  @Min(0)
  @Type(() => Number)
  amount: number;

  @ApiProperty({ example: 'خرید لباس ورزشی' })
  @IsString()
  @IsNotEmpty({ message: 'توضیحات الزامی است' })
  description: string;
}
