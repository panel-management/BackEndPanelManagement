import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTicketMessageDto {
  @ApiProperty({ example: 'بفرمایید مشکل چیست درخدمت هستم' })
  @IsString()
  @IsNotEmpty({ message: 'متن پیام الزامی است' })
  text: string;
}
