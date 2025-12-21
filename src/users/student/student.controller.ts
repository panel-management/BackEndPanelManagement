import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
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
  getAllStudent(
    @Req() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.studentService.findAll(req.user.userId, page, limit);
  }

  @Get('/equipment')
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  getStudentForEquipment(@Req() req) {
    return this.studentService.getStudentForEquipment(req.user.userId);
  }

  // See You Profile Just yourself student
  @Get('/details')
  @Roles(Role.Student)
  @HttpCode(HttpStatus.OK)
  getStudentById(@Req() req) {
    return this.studentService.getStudentById(req.user.userId);
  }

  // See Student Profile by Id for Master
  @Get('/:id')
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  getById(@Req() req, @Param('id', ParseIntPipe) studentId: number) {
    return this.studentService.getById(studentId, req.user.userId);
  }

  @Post()
  @Roles(Role.Master)
  @HttpCode(HttpStatus.CREATED)
  createStudent(@Req() req, @Body() createStudentDto: CreateStudentDto) {
    return this.studentService.createStudent(req.user.userId, createStudentDto);
  }

  // See You Update Profile Just yourself student
  @Put('/update/details')
  @Roles(Role.Student)
  @HttpCode(HttpStatus.OK)
  updateStudent(@Req() req, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentService.updateStudentById(
      req.user.userId,
      updateStudentDto,
    );
  }

  // Update Student by Master
  @Put('/:id')
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  updateStudentByMaster(
    @Req() req,
    @Param('id', ParseIntPipe) studentId: number,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentService.updateById(
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
