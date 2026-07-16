import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
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
import { PaginationQueryDto } from 'src/common/dto/pagination.dto';
import { UpdateStatusDto } from 'src/common/dto/updateStatus.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';

@Controller('student')
@ApiBearerAuth('authorization')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  // get all student by master
  @Get()
  @ApiOperation({
    summary: 'نمایش لیست هنرجو های مستر',
    description: `
    نمونه درخواست:
    GET /api/v1/student?page=1&limit=10
    `,
  })
  @ApiOkResponse({ description: 'لیست هنرجو ها با موفقیت دریافت شد' })
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  getAllStudent(@Req() req, @Query() pageQueryDto: PaginationQueryDto) {
    return this.studentService.findAll(req.user.userId, pageQueryDto);
  }

  // see profile student yourself
  @Get('profile')
  @ApiOperation({ summary: 'نمایش پروفایل توسط هنرجو' })
  @ApiOkResponse({ description: 'پروفایل با موفقیت نمایش داد شد' })
  @ApiNotFoundResponse({ description: 'هنرجویی با این مشخاصت یافت نشد' })
  @Roles(Role.Student)
  @HttpCode(HttpStatus.OK)
  getStudentById(@Req() req) {
    return this.studentService.getStudentById(req.user.userId);
  }

  // see profile student by Master
  @Get('profile/:id')
  @ApiOperation({ summary: 'نمایش پروفایل هنرجو توسط مستر' })
  @ApiOkResponse({ description: 'پروفایل با موفقیت نمایش داد شد' })
  @ApiNotFoundResponse({ description: 'هنرجویی با این مشخاصت یافت نشد' })
  @ApiParam({ name: 'id', type: Number, example: 7 })
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  getById(@Req() req, @Param('id', ParseIntPipe) studentId: number) {
    return this.studentService.getById(studentId, req.user.userId);
  }

  // create student by master
  @Post()
  @ApiOperation({ summary: 'ایجاد هنرجو توسط مستر' })
  @ApiCreatedResponse({ description: 'هنرجو ایجاد شد و تراکنش شهریه اولیه ثبت گردید' })
  @ApiNotFoundResponse({
    description: `
    کمربند با این ایدی یافت نشد
    پلن شهریه انتخاب شده معتبر نیست یا متعلق به شما نمی‌ باشد
    `,
  })
  @ApiBadRequestResponse({ description: 'انتخاب پلن برای هنرجو الزامی است' })
  @ApiForbiddenResponse({ description: 'شما به عنوان مربی باید ابتدا رشته ورزشی خود را مشخص کنید' })
  @ApiBody({ type: CreateStudentDto })
  @Roles(Role.Master)
  @HttpCode(HttpStatus.CREATED)
  createStudent(@Req() req, @Body() createStudentDto: CreateStudentDto) {
    return this.studentService.createStudent(req.user.userId, createStudentDto);
  }

  // update profile student yourself
  @Patch('update/profile')
  @ApiOperation({ summary: 'بروزرسانی پروفایل توسط هنرجو' })
  @ApiOkResponse({ description: 'پروفایل با موفقیت بروزرسانی شد' })
  @ApiBody({ type: UpdateStudentDto })
  @Roles(Role.Student)
  @HttpCode(HttpStatus.OK)
  updateStudent(@Req() req, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentService.updateStudentById(req.user.userId, updateStudentDto);
  }

  // update student by master
  @Patch('update/:id')
  @ApiOperation({ summary: 'بروزرسانی پروفایل هنرجو توسط مستر' })
  @ApiOkResponse({ description: 'پروفایل هنرجو با موفقیت بروزرسانی شد' })
  @ApiNotFoundResponse({ description: 'پلن جدید معتبر نیست یا متعلق به شما نیست' })
  @ApiParam({ name: 'id', type: Number, example: 7 })
  @ApiBody({ type: UpdateStudentDto })
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  updateStudentByMaster(
    @Req() req,
    @Param('id', ParseIntPipe) studentId: number,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentService.updateById(studentId, req.user.userId, updateStudentDto);
  }

  // change status student by master
  @Put('changeStatus/:id')
  @ApiOperation({ summary: 'تغییر وضعیت حساب کاربری هنرجو توسط مستر' })
  @ApiOkResponse({ description: 'وضعیت حساب کاربری هنرچو با موفقیت انجام شد' })
  @ApiParam({ name: 'id', type: Number, example: 7 })
  @ApiBody({ type: UpdateStatusDto })
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  changeStatusAccount(
    @Req() req,
    @Param('id', ParseIntPipe) studentId: number,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.studentService.changeStatusAccount(studentId, req.user.userId, updateStatusDto);
  }

  // delete student by master
  @Delete(':id')
  @ApiOperation({ summary: 'حذف هنرجو توسط مستر' })
  @ApiOkResponse({ description: 'هنرجو با موفقیت حذف شد' })
  @ApiParam({ name: 'id', type: Number, example: 7 })
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  deleteStudent(@Req() req, @Param('id', ParseIntPipe) studentId: number) {
    return this.studentService.deleteStudentById(studentId, req.user.userId);
  }
}
