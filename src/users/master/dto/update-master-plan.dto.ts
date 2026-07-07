import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateMasterPlanDto } from './create-master-plan.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateMasterPlanDto extends PartialType(CreateMasterPlanDto) {
  @ApiProperty({ example: true, type: Boolean })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
