import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateStatusDto {
  @IsBoolean({ message: 'وضعیت با به صورت true یا false باشد' })
  @IsNotEmpty({ message: 'وضعیت نمی‌ تواند خالی باشد' })
  isActive: boolean;
}
