import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

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

  @IsString()
  @IsNotEmpty({ message: 'سابقه تدریس نمی‌تواند خالی باشد' })
  history: string;

  @IsString()
  @IsNotEmpty({ message: 'مدرک یا گواهینامه نمی‌تواند خالی باشد' })
  certificates: string;

  @IsString()
  @IsOptional()
  image?: string;
}
