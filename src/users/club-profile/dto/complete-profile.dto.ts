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
  @IsString()
  @IsNotEmpty({ message: 'نام باشگاه الزامی است' })
  clubName: string;

  @IsString()
  @IsNotEmpty({ message: 'حوضه فعالیت الزامی است' })
  activityType: string;

  @IsString()
  @IsNotEmpty({ message: 'ادرس باشگاه الزامی است' })
  clubAddress: string;

  @IsString()
  @IsOptional()
  aboutClub?: string;

  @IsString()
  @IsOptional()
  clubPhoneNumber?: string;

  @IsDate()
  @IsOptional()
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
