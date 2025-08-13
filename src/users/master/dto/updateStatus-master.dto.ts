import { Active } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateStatusUserDto {
  @IsEnum(Active, {
    message: 'وضعیت باید یکی از مقادیر ENABLE یا DISABLE باشد',
  })
  @IsNotEmpty({ message: 'وضعیت نمی‌تواند خالی باشد' })
  active: Active;
}
