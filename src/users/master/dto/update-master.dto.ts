import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsPhoneNumber, IsString, Matches } from 'class-validator';

export class UpdateMasterDto {
  @ApiPropertyOptional({ example: "کاربر تست" })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ example: "0967589713" })
  @IsString()
  @IsOptional()
  nationalCode?: string;

  @ApiPropertyOptional({ example: "09999531854" })
  @IsOptional()
  @IsPhoneNumber('IR', { message: 'شماره تلفن معتبر وارد کنید' })
  @Matches(/^09\d{9}$/, { message: 'فرمت شماره تلفن نامعتبر است' })
  phoneNumber?: string;

  @ApiPropertyOptional({ type: Number, example: 22 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  age?: number;

  @ApiPropertyOptional({ type: Date })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  birthDate?: Date;

  @ApiPropertyOptional({ example: "5 سال" })
  @IsString()
  @IsOptional()
  history?: string;

  @ApiPropertyOptional({ example: "دان 5 فدراسیون کارته" })
  @IsString()
  @IsOptional()
  certificates?: string;

  @ApiPropertyOptional({ type: Number, example: 25 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  sportId?: number;
}
