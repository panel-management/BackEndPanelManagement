import { PartialType } from "@nestjs/swagger";
// import { Type } from 'class-transformer';
// import { IsDate, IsInt, IsOptional, IsPhoneNumber, IsString, Matches } from 'class-validator';
import { CreateCoachDto } from "./create-coach.dto";

export class UpdateCoachDto extends PartialType(CreateCoachDto) {}

// export class UpdateCoachDto {
//   @IsString()
//   @IsOptional()
//   fullName?: string;

//   @IsString()
//   @IsOptional()
//   nationalCode?: string;

//   @IsOptional()
//   @IsPhoneNumber("IR", { message: "شماره تلفن معتبر وارد کنید" })
//   @Matches(/^09\d{9}$/, { message: 'فرمت شماره تلفن نامعتبر است' })
//   phoneNumber?: string;

//   @IsDate()
//   @IsOptional()
//   @Type(() => Date)
//   birthDate?: Date;

//   @IsInt()
//   @IsOptional()
//   @Type(() => Number)
//   age?: number;

//   @IsString()
//   @IsOptional()
//   history?: string;

//   @IsString()
//   @IsOptional()
//   certificates?: string;
// }
