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
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { StudentService } from './student.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Controller('student')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  getAllStudent(@Req() req) {
    const masterId = req.user.userId;
    return this.studentService.findAll(masterId);
  }

  @Get('/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.Master, Role.Student)
  @HttpCode(HttpStatus.OK)
  getStudentById(@Req() req, @Param('id', ParseIntPipe) studentId: number) {
    const masterId = req.user.userId;
    return this.studentService.getById(studentId, masterId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.Master)
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  createStudent(@Req() req, @Body() createStudentDto: CreateStudentDto) {
    const masterId = req.user.userId;
    return this.studentService.createStudent(masterId, createStudentDto);
  }

  @Put('/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.Master, Role.Student)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  updateStudent(
    @Req() req,
    @Param('id', ParseIntPipe) studentId: number,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    const masterId = req.user.userId;
    return this.studentService.updateStudentById(
      studentId,
      masterId,
      updateStudentDto,
    );
  }

  @Delete('/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  deleteStudent(@Req() req, @Param('id', ParseIntPipe) studentId: number) {
    const masterId = req.user.userId;
    return this.studentService.deleteStudentById(studentId, masterId);
  }
}
