import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  Matches,
  IsOptional,
  IsInt,
  IsBoolean,
  IsDate,
} from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty({ message: 'نام کامل نم ی‌تواند خالی باشد' })
  fullName: string;

  @IsString()
  @IsNotEmpty({ message: 'کد ملی نمی‌ تواند خالی باشد' })
  nationalCode: string;

  @IsInt()
  @IsNotEmpty({ message: 'سن نمی تواند خالی باشد' })
  @Type(() => Number)
  age: number;

  @IsNotEmpty({ message: 'تاریخ تولد نمی تواند خلی باشد' })
  @IsDate()
  @Type(() => Date)
  birthDate: Date;

  @IsString()
  @IsNotEmpty({ message: 'شماره تلفن نمی‌ تواند خالی باشد' })
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
  @IsOptional()
  @Type(() => Number)
  beltIds?: number;

  @IsInt({ each: true, message: 'شناسه پلن باید یک عدد باشد' })
  @IsNotEmpty({ message: 'نمی تواند پلن خالی باشد' })
  @Type(() => Number)
  planId: number;
}
