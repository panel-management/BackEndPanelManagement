import { PartialType } from '@nestjs/mapped-types';
import { CreateMasterPlanDto } from './create-master-plan.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateMasterPlanDto extends PartialType(CreateMasterPlanDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
