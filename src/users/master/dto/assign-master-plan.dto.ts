import { IsInt, IsNotEmpty } from 'class-validator';

export class AssignMasterPlanDto {
  @IsInt()
  @IsNotEmpty()
  planId: number;
}
