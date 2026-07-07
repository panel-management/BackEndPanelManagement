import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { VerifyOtpDto } from './verify-otp.dto';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteRegistrationDto extends VerifyOtpDto {
  @ApiProperty({ example: "کاربر تست" })
  @IsString()
  @IsNotEmpty({ message: 'نام و نام خانوادگی نمی تواند خالی باشد' })
  fullName: string;

  @ApiProperty({ example: "0967589713" })
  @IsString()
  @IsNotEmpty({ message: 'کدملی نمی تواند خالی باشد' })
  nationalCode: string;

  @ApiProperty({ example: 25, type: Number })
  @IsInt({ message: 'شناسه ورزش باید یک عدد باشد' })
  @IsNotEmpty({ message: 'ورزش نمی تواند خالی باشد' })
  @Type(() => Number)
  sportId: number;
}
