import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { VerifyOtpDto } from './verify-otp.dto';
import { Type } from 'class-transformer';

export class CompleteRegistrationDto extends VerifyOtpDto {
  @IsString()
  @IsNotEmpty({ message: 'نام و نام خانوادگی نمی تواند خالی باشد' })
  fullName: string;

  @IsString()
  @IsNotEmpty({ message: 'کدملی نمی تواند خالی باشد' })
  nationalCode: string;

  @IsInt({ message: 'شناسه ورزش باید یک عدد باشد' })
  @IsNotEmpty({ message: 'ورزش نمی تواند خالی باشد' })
  @Type(() => Number)
  sportId: number;
}
