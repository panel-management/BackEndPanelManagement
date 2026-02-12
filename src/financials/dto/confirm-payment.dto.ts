import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

export class ConfirmPaymentDto {
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  paymentDate?: Date;
}
