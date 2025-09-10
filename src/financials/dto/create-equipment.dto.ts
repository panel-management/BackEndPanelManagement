import { IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateEquipmentDto {
  @IsInt()
  studentId: number;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsNotEmpty()
  description: string;
}
