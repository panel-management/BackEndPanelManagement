import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionPaymentStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ReviewSubscriptionPaymentDto {
  @ApiProperty({
    enum: SubscriptionPaymentStatus,
    enumName: 'SubscriptionPaymentStatus',
    example: SubscriptionPaymentStatus.CONFIRMED,
    description: `
    مقادیر مجاز:
    - CONFIRMED: پرداخت شده
    - PENDING: در انتظار پرداخت
    - REJECTED: پرداخت نشده
    `,
  })
  @IsEnum(SubscriptionPaymentStatus)
  status: SubscriptionPaymentStatus;

  @ApiPropertyOptional({ example: 'عدم مغایرت مبلغ پراخت شده', description: 'اختیاری است در صورت رد شدن پرداخت ارسال شود' })
  @IsString()
  @IsOptional()
  adminNotes?: string;
}
