import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

export class AssignMasterPlanDto {
  @IsInt()
  @IsNotEmpty({ message: 'نمی تواند پلن خالی باشد' })
  @Type(() => Number)
  planId: number;
}
