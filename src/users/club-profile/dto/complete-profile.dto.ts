import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class SocialNetworksDto {
  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsString()
  telegram?: string;

  @IsOptional()
  @IsString()
  eitaa?: string;

  @IsOptional()
  @IsString()
  website?: string;
}

export class CompleteProfileDto {
  @IsString({ message: 'نام باشگاه باید از نوع رشته باشد' })
  @IsNotEmpty({ message: 'نام باشگاه نمی‌ تواند خالی باشد' })
  clubName: string;

  @IsString()
  @IsNotEmpty()
  activityType: string;

  @IsString()
  @IsNotEmpty()
  clubAddress: string;

  @IsString()
  @IsOptional()
  aboutClub?: string;

  @IsString()
  @IsOptional()
  clubPhoneNumber?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  foundationDate?: Date;

  @IsString()
  @IsOptional()
  goal?: string;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => SocialNetworksDto)
  socialNetworks?: SocialNetworksDto;
}
