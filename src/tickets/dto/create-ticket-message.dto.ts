import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTicketMessageDto {
  @IsString({ message: 'متن پیام باید از نوع رشته باشد' })
  @IsNotEmpty({ message: 'متن پیام نمی‌تواند خالی باشد' })
  text: string;
}
