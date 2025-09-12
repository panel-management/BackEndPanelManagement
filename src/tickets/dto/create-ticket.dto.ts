import { TicketCategory, TicketPriority } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateTicketDto {
  @IsString({ message: 'عنوان باید از نوع رشته باشد' })
  @IsNotEmpty({ message: 'عنوان نمی تواند خالی باشد' })
  title: string;

  @IsString({ message: 'متن پیام باید از نوع رشته باشد' })
  @IsNotEmpty({ message: 'متن پیام نمی‌ تواند خالی باشد' })
  text: string;

  @IsEnum(TicketCategory, { message: 'دسته‌بندی معتبر نیست' })
  @IsNotEmpty({ message: 'دسته‌بندی نمی‌تواند خالی باشد' })
  category: TicketCategory;

  @IsEnum(TicketPriority, { message: 'اولویت معتبر نیست' })
  @IsNotEmpty({ message: 'اولویت نمی‌تواند خالی باشد' })
  priority: TicketPriority;
}
