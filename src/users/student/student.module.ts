import { Module } from '@nestjs/common';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { FinancialsModule } from 'src/financials/financials.module';
import { SmsServiceModule } from 'src/sms-service/sms-service.module';

@Module({
  imports: [FinancialsModule, SmsServiceModule],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}
