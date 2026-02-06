import { PartialType } from '@nestjs/mapped-types';
import { CompleteProfileDto } from './complete-profile.dto';

export class UpdateProfileDto extends PartialType(CompleteProfileDto) {}