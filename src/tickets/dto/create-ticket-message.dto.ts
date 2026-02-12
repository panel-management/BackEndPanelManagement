import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTicketMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'متن پیام الزامی است' })
  text: string;
}
