import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateStatusDto {
  @ApiProperty({
    example: true,
    description: 'وضعیت فعال یا غیرفعال بودن',
  })
  @IsBoolean({ message: 'وضعیت با به صورت true یا false باشد' })
  @IsNotEmpty({ message: 'وضعیت نمی‌ تواند خالی باشد' })
  isActive: boolean;
}
