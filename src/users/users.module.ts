import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { StudentService } from './student/student.service';
import { StudentController } from './student/student.controller';
import { StudentModule } from './student/student.module';
import { SportBeltModule } from './sport-belt/sport-belt.module';
import { CoachModule } from './coach/coach.module';
import { MasterModule } from './master/master.module';
import { FinancialsModule } from 'src/financials/financials.module';
import { ClubProfileService } from './club-profile/club-profile.service';
import { ClubProfileController } from './club-profile/club-profile.controller';
import { ClubProfileModule } from './club-profile/club-profile.module';
import { SmsServiceModule } from 'src/sms-service/sms-service.module';

@Module({
  providers: [UsersService, StudentService, ClubProfileService],
  exports: [UsersService],
  controllers: [StudentController, ClubProfileController],
  imports: [
    SmsServiceModule,
    StudentModule,
    SportBeltModule,
    CoachModule,
    MasterModule,
    FinancialsModule,
    ClubProfileModule,
  ],
})
export class UsersModule {}
