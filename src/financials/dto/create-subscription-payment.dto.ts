import { Type } from 'class-transformer';
import {
  IsDateString,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateSubscriptionPaymentDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @IsISO8601()
  @IsDateString()
  paymentDate: string;

  @IsString()
  @IsNotEmpty()
  trackingNumber: string;

  @IsString()
  @IsNotEmpty()
  payerFullName: string;

  @IsString()
  @IsNotEmpty()
  bankName: string;
}
