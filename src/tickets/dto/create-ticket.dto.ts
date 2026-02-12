import { TicketCategory, TicketPriority } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty({ message: 'عنوان الزامی است' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'متن پیام الزامی است' })
  text: string;

  @IsEnum(TicketCategory, { message: 'دسته‌بندی معتبر نیست' })
  @IsNotEmpty({ message: 'دسته‌بندی الزامی است' })
  category: TicketCategory;

  @IsEnum(TicketPriority, { message: 'اولویت معتبر نیست' })
  @IsNotEmpty({ message: 'اولویت الزامی است' })
  priority: TicketPriority;
}
