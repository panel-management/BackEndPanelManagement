import { Type } from 'class-transformer';
import {
  IsISO8601,
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

export class UpdateProfileDto {
  @IsString({ message: 'نام باشگاه باید از نوع رشته باشد' })
  @IsOptional()
  clubName?: string;

  @IsString()
  @IsOptional()
  activityType?: string;

  @IsString()
  @IsOptional()
  clubAddress?: string;

  @IsString()
  @IsOptional()
  aboutClub?: string;

  @IsString()
  @IsOptional()
  clubPhoneNumber?: string;

  @IsOptional()
  @IsISO8601()
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
