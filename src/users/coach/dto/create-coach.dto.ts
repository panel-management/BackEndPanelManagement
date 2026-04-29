import { Type } from 'class-transformer';
import { IsDate, IsInt, IsNotEmpty, IsPhoneNumber, IsString, Matches } from 'class-validator';

export class CreateCoachDto {
  @IsString()
  @IsNotEmpty({ message: 'نام کامل الزامی است' })
  fullName: string;

  @IsString()
  @IsNotEmpty({ message: 'کد ملی الزامی است' })
  nationalCode: string;

  @IsPhoneNumber("IR", { message: "شماره تلفن معتبر وارد کنید" })
  @IsNotEmpty({ message: 'شماره تلفن الزامی است' })
  @Matches(/^09\d{9}$/, { message: 'فرمت شماره تلفن نامعتبر است' })
  phoneNumber: string;

  @IsInt()
  @IsNotEmpty({ message: 'سن الزامی است' })
  @Type(() => Number)
  age: number;

  @IsDate()
  @IsNotEmpty({ message: 'تاریخ تولد الزامی است' })
  @Type(() => Date)
  birthDate: Date;

  @IsString()
  @IsNotEmpty({ message: 'سابقه تدریس الزامی است' })
  history: string;

  @IsString()
  @IsNotEmpty({ message: 'مدرک یا گواهینامه الزامی است' })
  certificates: string;
}
