import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { RequestOtpDto } from './request-otp.dto';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto extends RequestOtpDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty({ message: 'کد تایید نمی تواند خالی باشد' })
  @Length(6, 6, { message: 'کد تایید باید 6 رقم باشد' })
  @Matches(/^\d{6}$/, {
    message: 'کد تایید باید فقط شامل عدد باشد',
  })
  code: string;
}
