import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { SmsServiceModule } from 'src/sms-service/sms-service.module';

@Module({
  imports: [SmsServiceModule],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}
