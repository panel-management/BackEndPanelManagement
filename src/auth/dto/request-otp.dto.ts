import { IsNotEmpty, IsPhoneNumber, Matches } from 'class-validator';

export class RequestOtpDto {
  @IsPhoneNumber("IR", { message: "شماره تلفن معتبر وارد کنید" })
  @IsNotEmpty({ message: 'شماره تلفن نمی تواند خالی باشد' })
  @Matches(/^09\d{9}$/, { message: 'فرمت شماره تلفن نامعتبر است' })
  phoneNumber: string;
}
