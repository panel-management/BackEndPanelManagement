import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsNotEmpty, IsPhoneNumber, IsString, Matches } from 'class-validator';

export class CreateCoachDto {
  @ApiProperty({ example: 'مربی باشگاه' })
  @IsString()
  @IsNotEmpty({ message: 'نام کامل الزامی است' })
  fullName: string;

  @ApiProperty({ example: '0975183645' })
  @IsString()
  @IsNotEmpty({ message: 'کد ملی الزامی است' })
  nationalCode: string;

  @ApiProperty({ example: '09192384689' })
  @IsPhoneNumber('IR', { message: 'شماره تلفن معتبر وارد کنید' })
  @IsNotEmpty({ message: 'شماره تلفن الزامی است' })
  @Matches(/^09\d{9}$/, { message: 'فرمت شماره تلفن نامعتبر است' })
  phoneNumber: string;

  @ApiProperty({ example: 22, type: Number })
  @IsInt()
  @IsNotEmpty({ message: 'سن الزامی است' })
  @Type(() => Number)
  age: number;

  @ApiProperty({ type: Date })
  @IsDate()
  @IsNotEmpty({ message: 'تاریخ تولد الزامی است' })
  @Type(() => Date)
  birthDate: Date;

  @ApiProperty({ example: '5 سال' })
  @IsString()
  @IsNotEmpty({ message: 'سابقه تدریس الزامی است' })
  history: string;

  @ApiProperty({ example: 'دان 2 فدراسیون کاراته و مربی گری' })
  @IsString()
  @IsNotEmpty({ message: 'مدرک یا گواهینامه الزامی است' })
  certificates: string;
}
