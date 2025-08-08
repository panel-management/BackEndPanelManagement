import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { StudentService } from './student.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { CreateStudentDto } from './dto/create-student.dto';

@Controller('student')
@UseGuards(RolesGuard)
@Roles(Role.Master)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  getAllStudent(@Req() req) {
    const masterId = req.user.userId;
    return this.studentService.findAll(masterId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  createStudent(@Req() req, @Body() createStudentDto: CreateStudentDto) {
    const masterId = req.user.userId;
    return this.studentService.createStudent(masterId, createStudentDto);
  }
}
