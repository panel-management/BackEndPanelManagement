import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { StudentService } from './student/student.service';
import { StudentController } from './student/student.controller';
import { StudentModule } from './student/student.module';

@Module({
  providers: [UsersService, StudentService],
  exports: [UsersService],
  controllers: [StudentController],
  imports: [StudentModule],
})
export class UsersModule {}
