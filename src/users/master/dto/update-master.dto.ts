import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

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

  @IsNumber()
  @IsOptional()
  age?: number;

  @IsString()
  @IsOptional()
  birthDate?: string;

  @IsString()
  @IsOptional()
  history?: string;

  @IsString()
  @IsOptional()
  certificates?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'شناسه ورزش باید یک عدد صحیح باشد' })
  sportId?: number;
}
