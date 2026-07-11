import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  Matches,
  IsOptional,
  IsInt,
  IsBoolean,
  IsDate,
  IsPhoneNumber,
} from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({ example: 'اردلان' })
  @IsString()
  @IsNotEmpty({ message: 'نام کامل الزامی است' })
  fullName: string;

  @ApiProperty({ example: '0462184658' })
  @IsString()
  @IsNotEmpty({ message: 'کد ملی الزامی است' })
  nationalCode: string;

  @ApiProperty({ example: 20, type: Number })
  @IsInt()
  @IsNotEmpty({ message: 'سن الزامی است' })
  @Type(() => Number)
  age: number;

  @ApiProperty({ type: Date })
  @IsDate()
  @IsNotEmpty({ message: 'تاریخ تولد الزامی است' })
  @Type(() => Date)
  birthDate: Date;

  @ApiProperty({ example: '09233756089' })
  @IsPhoneNumber('IR', { message: 'شماره تلفن معتبر وارد کنید' })
  @IsNotEmpty({ message: 'شماره تلفن الزامی است' })
  @Matches(/^09\d{9}$/, { message: 'فرمت شماره تلفن نامعتبر است' })
  phoneNumber: string;

  @ApiProperty({ example: '09232756781' })
  @IsPhoneNumber('IR', { message: 'شماره تلفن معتبر وارد کنید' })
  @IsNotEmpty({ message: 'شماره تلفن اضطراری الزامی است' })
  @Matches(/^09\d{9}$/, { message: 'فرمت شماره تلفن نامعتبر است' })
  phoneNumberEmergency: string;

  @ApiProperty({ example: 'مشهد میدان برق نبش طالقانی 10' })
  @IsString()
  @IsNotEmpty({ message: 'آدرس محل سکونت الزامی است' })
  address: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsBoolean()
  @IsOptional()
  underSupervisionDoctor?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsBoolean()
  @IsOptional()
  diseaseRecords?: boolean;

  @ApiPropertyOptional({ type: Number })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  beltIds?: number;

  @ApiProperty({ example: 10, type: Number })
  @IsInt()
  @IsNotEmpty({ message: 'شناسه پلن الزامی است' })
  @Type(() => Number)
  planId: number;
}
