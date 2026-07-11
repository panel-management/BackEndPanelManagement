import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class CreateSubscriptionPaymentDto {
  @ApiProperty({ type: Date })
  @IsDate()
  @IsNotEmpty({ message: 'زمان پرداخت الزامی است' })
  @Type(() => Date)
  paymentDate: string;

  @ApiProperty({ example: '6037861950228864' })
  @IsString()
  @IsNotEmpty({ message: 'شماره کارت الزامی است' })
  trackingNumber: string;

  @ApiProperty({ example: 'کاربر تست باشگاه' })
  @IsString()
  @IsNotEmpty({ message: 'نام پرداخت کننده الزامی است' })
  payerFullName: string;

  @ApiProperty({ example: 'ملت' })
  @IsString()
  @IsNotEmpty({ message: 'نام بانک الزامی است' })
  bankName: string;
}
