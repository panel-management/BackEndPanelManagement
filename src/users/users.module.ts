import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { StudentService } from './student/student.service';
import { StudentController } from './student/student.controller';
import { StudentModule } from './student/student.module';
import { SportBeltModule } from './sport-belt/sport-belt.module';
import { CoachModule } from './coach/coach.module';

@Module({
  providers: [UsersService, StudentService],
  exports: [UsersService],
  controllers: [StudentController],
  imports: [StudentModule, SportBeltModule, CoachModule],
})
export class UsersModule {}
