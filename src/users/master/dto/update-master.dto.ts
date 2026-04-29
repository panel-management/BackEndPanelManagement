import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsPhoneNumber, IsString, Matches } from 'class-validator';

export class UpdateMasterDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  nationalCode?: string;

  @IsOptional()
  @IsPhoneNumber("IR", { message: "شماره تلفن معتبر وارد کنید" })
  @Matches(/^09\d{9}$/, { message: 'فرمت شماره تلفن نامعتبر است' })
  phoneNumber?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  age?: number;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  birthDate?: Date;

  @IsString()
  @IsOptional()
  history?: string;

  @IsString()
  @IsOptional()
  certificates?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  sportId?: number;
}
