import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { StudentService } from './student.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('student')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get()
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  getAllStudent(@Req() req) {
    return this.studentService.findAll(req.user.userId);
  }

  @Get('/:id')
  @Roles(Role.Master, Role.Student)
  @HttpCode(HttpStatus.OK)
  getStudentById(@Req() req, @Param('id', ParseIntPipe) studentId: number) {
    return this.studentService.getById(studentId, req.user.userId);
  }

  @Post()
  @Roles(Role.Master)
  @HttpCode(HttpStatus.CREATED)
  createStudent(@Req() req, @Body() createStudentDto: CreateStudentDto) {
    return this.studentService.createStudent(req.user.userId, createStudentDto);
  }

  @Put('/:id')
  @Roles(Role.Master, Role.Student)
  @HttpCode(HttpStatus.OK)
  updateStudent(
    @Req() req,
    @Param('id', ParseIntPipe) studentId: number,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentService.updateStudentById(
      studentId,
      req.user.userId,
      updateStudentDto,
    );
  }

  @Delete('/:id')
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  deleteStudent(@Req() req, @Param('id', ParseIntPipe) studentId: number) {
    return this.studentService.deleteStudentById(studentId, req.user.userId);
  }
}
