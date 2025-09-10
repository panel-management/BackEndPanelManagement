import { IsDateString, IsOptional } from 'class-validator';

export class ConfirmPaymentDto {
  @IsDateString()
  @IsOptional()
  paymentDate?: Date;
}
