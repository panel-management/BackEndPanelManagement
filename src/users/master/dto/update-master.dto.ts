import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsString, Matches } from 'class-validator';

export class UpdateMasterDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  nationalCode?: string;

  @IsString()
  @IsOptional()
  @Matches(/^09\d{9}$/, { message: 'فرمت شماره تلفن نامعتبر است' })
  phoneNumber?: string;

  @IsInt({ message: 'سن باید به صورت عدد باشد' })
  @IsOptional()
  @Type(() => Number)
  age?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  birthDate?: Date;

  @IsString()
  @IsOptional()
  history?: string;

  @IsString()
  @IsOptional()
  certificates?: string;

  @IsInt({ message: 'شناسه ورزش باید یک عدد صحیح باشد' })
  @IsOptional()
  @Type(() => Number)
  sportId?: number;
}
