import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  Matches,
  IsOptional,
  IsInt,
  IsBoolean,
  IsArray,
  IsDate,
} from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty({ message: 'نام کامل نمی‌تواند خالی باشد' })
  fullName: string;

  @IsString()
  @IsNotEmpty({ message: 'کد ملی نمی‌تواند خالی باشد' })
  nationalCode: string;

  @IsInt()
  @IsNotEmpty({ message: 'سن نمیتواند خالی باشد' })
  @Type(() => Number)
  age: number;

  @IsNotEmpty({ message: 'تاریخ تولد نمی تواند خلی باشد' })
  @IsDate()
  @Type(() => Date)
  birthDate: Date;

  @IsString()
  @IsNotEmpty({ message: 'شماره تلفن نمی‌تواند خالی باشد' })
  @Matches(/^09\d{9}$/, { message: 'فرمت شماره تلفن نامعتبر است' })
  phoneNumber: string;

  @IsString()
  @IsNotEmpty({ message: 'شماره تلفن اضطراری نمی‌تواند خالی باشد' })
  @Matches(/^09\d{9}$/, { message: 'فرمت شماره تلفن نامعتبر است' })
  phoneNumberEmergency: string;

  @IsString()
  @IsNotEmpty({ message: 'آدرس محل سکونت نمی تواند خالی باشد' })
  address: string;

  @IsBoolean()
  @IsOptional()
  underSupervisionDoctor?: boolean;

  @IsBoolean()
  @IsOptional()
  diseaseRecords?: boolean;

  @IsInt({ each: true, message: 'شناسه کمربند باید یک عدد باشد' })
  @Type(() => Number)
  @IsOptional()
  beltIds?: number;

  @IsInt({ each: true, message: 'شناسه پلن باید یک عدد باشد' })
  @Type(() => Number)
  planId: number;
}
