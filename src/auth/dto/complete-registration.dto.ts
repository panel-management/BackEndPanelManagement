import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { VerifyOtpDto } from './verify-otp.dto';
import { Type } from 'class-transformer';

export class CompleteRegistrationDto extends VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  nationalCode: string;

  @IsInt({ message: 'شناسه ورزش باید یک عدد باشد' })
  @Type(() => Number)
  @IsNotEmpty()
  sportId: number;
}
