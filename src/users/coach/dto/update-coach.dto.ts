import { IsOptional, IsString, Matches } from 'class-validator';

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

  @IsString()
  @IsOptional()
  history?: string;

  @IsString()
  @IsOptional()
  certificates?: string;
}
