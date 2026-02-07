import { TicketStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateTicketStatusDto {
  @IsEnum(TicketStatus)
  @IsNotEmpty({ message: 'وضعیت تیکت الزامی است' })
  status: TicketStatus;
}
