import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsString, Matches } from 'class-validator';

export class UpdateCoachDto {
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

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  birthDate?: Date;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  age?: number;

  @IsString()
  @IsOptional()
  history?: string;

  @IsString()
  @IsOptional()
  certificates?: string;
}
