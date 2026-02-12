import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

export class AssignMasterPlanDto {
  @IsInt()
  @IsNotEmpty({ message: 'شناسه پلن الزامی است' })
  @Type(() => Number)
  planId: number;
}
