import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class RequestOtpDto {
  @IsString({ message: 'شماره تلفن باید یک رشته باشد.' })
  @IsNotEmpty({ message: 'شماره تلفن نمیتواند خالی باشد.' })
  @Matches(/^09\d{9}$/, { message: 'فرمت شماره تلفن نامعتبر است' })
  phoneNumber: string;
}
