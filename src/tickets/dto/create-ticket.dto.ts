import { ApiProperty } from '@nestjs/swagger';
import { TicketCategory, TicketPriority } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateTicketDto {
  @ApiProperty({ example: 'مشکل در بخش حضور غیاب' })
  @IsString()
  @IsNotEmpty({ message: 'عنوان الزامی است' })
  title: string;

  @ApiProperty({ example: 'با سلام من امروز هر کاری میکنم نمیتوانم حضور غیاب کنم' })
  @IsString()
  @IsNotEmpty({ message: 'متن پیام الزامی است' })
  text: string;

  @ApiProperty({
    enum: TicketCategory,
    enumName: 'TicketCategory',
    example: TicketCategory.TECHNICAL_ISSUE,
    description: `
    مقادیر مجاز:
    - TECHNICAL_ISSUE: مشکلات فنی
    - FINANCIAL_AFFAIRS: مسائل مالی
    - GENERAL: عمومی
    - FEATURE_REQUEST: درخواست ویژگی
    `,
  })
  @IsEnum(TicketCategory, { message: 'دسته‌بندی معتبر نیست' })
  @IsNotEmpty({ message: 'دسته‌بندی الزامی است' })
  category: TicketCategory;

  @ApiProperty({
    enum: TicketPriority,
    enumName: 'TicketPriority',
    example: TicketPriority.MEDIUM,
    description: `
    مقادیر مجاز:
    - LOW: کم
    - MEDIUM: متوسط
    - HIGH: زیاد
    `,
  })
  @IsEnum(TicketPriority, { message: 'اولویت معتبر نیست' })
  @IsNotEmpty({ message: 'اولویت الزامی است' })
  priority: TicketPriority;
}
