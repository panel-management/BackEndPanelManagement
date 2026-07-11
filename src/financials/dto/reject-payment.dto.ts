import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RejectPaymentDto {
  @ApiPropertyOptional({ example: 'عدم مغایرت مبلغ پراخت شده' })
  @IsString()
  @IsOptional()
  reason?: string;
}
