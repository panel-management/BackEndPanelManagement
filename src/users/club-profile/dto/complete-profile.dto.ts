import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instagram?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telegram?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eitaa?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website?: string;
}

export class CompleteProfileDto {
  @ApiProperty({ example: 'باشگاه تست' })
  @IsString()
  @IsNotEmpty({ message: 'نام باشگاه الزامی است' })
  clubName: string;

  @ApiProperty({ example: 'کاراته' })
  @IsString()
  @IsNotEmpty({ message: 'حوضه فعالیت باشگاه الزامی است' })
  activityType: string;

  @ApiProperty({ example: 'تهران جوردن خیابات 40 نبش قنادی روبه روی لوازم ورزشی' })
  @IsString()
  @IsNotEmpty({ message: 'ادرس باشگاه الزامی است' })
  clubAddress: string;

  @ApiProperty({ example: 'باشگاه ما با 10 سال سابقه در هنر های رزمی  است' })
  @IsString()
  @IsNotEmpty({ message: 'درباره باشگاه الزامی است' })
  aboutClub: string;

  @ApiProperty({ example: '05123456789' })
  @IsString()
  @IsNotEmpty({ message: 'شماره تلفن باشگاه الزامی است' })
  clubPhoneNumber?: string;

  @ApiProperty({ example: '2026/06/07' })
  @IsDate()
  @IsNotEmpty({ message: 'تاریخ ایجاد باشگاه الزامی است' })
  @Type(() => Date)
  foundationDate: Date;

  @ApiProperty({ example: 'هدف باشگاه ترویج سلامت و نشاط' })
  @IsString()
  @IsNotEmpty({ message: 'هدف باشگاه الزامی است' })
  goal?: string;

  @ApiPropertyOptional({ examples: SocialNetworksDto })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => SocialNetworksDto)
  socialNetworks?: SocialNetworksDto;
}
