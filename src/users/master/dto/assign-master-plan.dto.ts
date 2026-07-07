import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

export class AssignMasterPlanDto {
  @ApiProperty({ example: 1, type: Number, minimum: 1, maximum: 1 })
  @IsInt()
  @IsNotEmpty({ message: 'شناسه پلن الزامی است' })
  @Type(() => Number)
  planId: number;
}
