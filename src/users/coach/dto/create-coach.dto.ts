import { Type } from 'class-transformer';
import { IsDate, IsInt, IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateCoachDto {
  @IsString()
  @IsNotEmpty({ message: 'نام کامل نمی‌تواند خالی باشد' })
  fullName: string;

  @IsString()
  @IsNotEmpty({ message: 'کد ملی نمی‌تواند خالی باشد' })
  nationalCode: string;

  @IsString()
  @IsNotEmpty({ message: 'شماره تلفن نمی‌تواند خالی باشد' })
  @Matches(/^09\d{9}$/, { message: 'فرمت شماره تلفن نامعتبر است' })
  phoneNumber: string;

  @IsInt()
  @IsNotEmpty({ message: 'سن نمیتواند خالی باشد' })
  age: number;

  @IsNotEmpty({ message: 'تاریخ تولد نمی تواند خلی باشد' })
  @IsDate()
  @Type(() => Date)
  birthDate: Date;

  @IsString()
  @IsNotEmpty({ message: 'سابقه تدریس نمی‌تواند خالی باشد' })
  history: string;

  @IsString()
  @IsNotEmpty({ message: 'مدرک یا گواهینامه نمی‌تواند خالی باشد' })
  certificates: string;
}
