import { IsNotEmpty, IsString, Length } from 'class-validator';
import { RequestOtpDto } from './request-otp.dto';

export class VerifyOtpDto extends RequestOtpDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'کد تایید باید 6 رقم باشد.' })
  code: string;
}
