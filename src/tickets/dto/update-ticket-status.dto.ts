import { ApiProperty } from '@nestjs/swagger';
import { TicketStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateTicketStatusDto {
  @ApiProperty({
    enum: TicketStatus,
    enumName: 'TicketStatus',
    example: TicketStatus.CLOSED,
    description: `
    مقادیر مجاز:
    - OPEN: باز
    - CLOSED: بسته
    - PENDING: در انتظار پاسخ
    - RESOLVED: پاسخ داده شده
    `,
  })
  @IsEnum(TicketStatus)
  @IsNotEmpty({ message: 'وضعیت تیکت الزامی است' })
  status: TicketStatus;
}
