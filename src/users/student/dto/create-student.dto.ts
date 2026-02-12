import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, IsOptional, IsInt, IsBoolean, IsDate } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty({ message: 'نام کامل الزامی است' })
  fullName: string;

  @IsString()
  @IsNotEmpty({ message: 'کد ملی الزامی است' })
  nationalCode: string;

  @IsInt()
  @IsNotEmpty({ message: 'سن الزامی است' })
  @Type(() => Number)
  age: number;

  @IsDate()
  @IsNotEmpty({ message: 'تاریخ تولد الزامی است' })
  @Type(() => Date)
  birthDate: Date;

  @IsString()
  @IsNotEmpty({ message: 'شماره تلفن الزامی است' })
  @Matches(/^09\d{9}$/, { message: 'فرمت شماره تلفن نامعتبر است' })
  phoneNumber: string;

  @IsString()
  @IsNotEmpty({ message: 'شماره تلفن اضطراری الزامی است' })
  @Matches(/^09\d{9}$/, { message: 'فرمت شماره تلفن نامعتبر است' })
  phoneNumberEmergency: string;

  @IsString()
  @IsNotEmpty({ message: 'آدرس محل سکونت الزامی است' })
  address: string;

  @IsBoolean()
  @IsOptional()
  underSupervisionDoctor?: boolean;

  @IsBoolean()
  @IsOptional()
  diseaseRecords?: boolean;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  beltIds?: number;

  @IsInt()
  @IsNotEmpty({ message: 'شناسه پلن الزامی است' })
  @Type(() => Number)
  planId: number;
}
