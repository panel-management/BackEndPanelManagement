import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class CreateSubscriptionPaymentDto {
  @IsDate()
  @IsNotEmpty({ message: 'زمان پرداخت الزامی است' })
  @Type(() => Date)
  paymentDate: string;

  @IsString()
  @IsNotEmpty({ message: 'شماره کارت الزامی است' })
  trackingNumber: string;

  @IsString()
  @IsNotEmpty({ message: 'نام پرداخت کننده الزامی است' })
  payerFullName: string;

  @IsString()
  @IsNotEmpty({ message: 'نام بانک الزامی است' })
  bankName: string;
}
