import { SubscriptionPaymentStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ReviewSubscriptionPaymentDto {
  @IsEnum(SubscriptionPaymentStatus)
  status: SubscriptionPaymentStatus;

  @IsString()
  @IsOptional()
  adminNotes?: string;
}
