import { IsJSON, IsNotEmpty, IsString } from 'class-validator';
import { VerifyOtpDto } from './verify-otp.dto';

export class CompleteRegistrationDto extends VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  nationalCode: string;

  @IsJSON()
  @IsNotEmpty()
  selectSport: string;
}
