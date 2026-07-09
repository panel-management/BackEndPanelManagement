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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CoachService } from './coach.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/auth/enums/role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CreateCoachDto } from './dto/create-coach.dto';
import { UpdateCoachDto } from './dto/update-coach.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateStatusDto } from 'src/common/dto/updateStatus.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  getSchemaPath,
} from '@nestjs/swagger';

@Controller('coach')
@ApiBearerAuth('authorization')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  @Get()
  @ApiOperation({ summary: 'نمایش لیست مربی ها برای مستر' })
  @ApiOkResponse({ description: 'لیست مربی ها با موفقیت دریافت شد' })
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  getCoach(@Req() req) {
    return this.coachService.getCoach(req.user.userId);
  }

  @Get('profile')
  @ApiOperation({ summary: 'نمایش پروفایل مربی' })
  @ApiOkResponse({ description: 'پروفایل با موفقیت دریافت شد' })
  @ApiNotFoundResponse({ description: 'مربی با این مشخصات یافت نشد' })
  @Roles(Role.Coach)
  @HttpCode(HttpStatus.OK)
  getCoachProfile(@Req() req) {
    return this.coachService.getCoachProfile(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'نمایش پروفایل مربی برای مستر' })
  @ApiOkResponse({ description: 'پروفایل مربی با موفقیت نمایش داد شد' })
  @ApiNotFoundResponse({ description: 'مربی با این مشخصات یافت نشد' })
  @ApiParam({ name: 'id', type: Number, example: 4 })
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  getCoachById(@Req() req, @Param('id', ParseIntPipe) coachId: number) {
    return this.coachService.getCoachById(coachId, req.user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'ایجاد مربی توسط مستر' })
  @ApiCreatedResponse({ description: 'مربی با موفقیت ایجاد شد' })
  @ApiForbiddenResponse({
    description:
      'برای ساخت مربی، شما به عنوان استاد باید ابتدا رشته ورزشی خود را در پروفایل مشخص کنید',
  })
  @ApiExtraModels(CreateCoachDto)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      allOf: [
        { $ref: getSchemaPath(CreateCoachDto) },
        {
          type: 'object',
          properties: {
            imageFile: {
              type: 'string',
              format: 'binary',
              nullable: true,
              description: 'اختیاری',
            },
          },
          required: [],
        },
      ],
    },
  })
  @Roles(Role.Master)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('imageFile'))
  createCoach(
    @Req() req,
    @Body() createCoachDto: CreateCoachDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.coachService.createCoach(req.user.userId, createCoachDto, file);
  }

  @Put('update/profile')
  @ApiOperation({ summary: 'بروزرسانی پروفایل مربی' })
  @ApiOkResponse({ description: 'پروفایل با موفقیت بروزرسانی شد' })
  @ApiNotFoundResponse({ description: 'مربی با این مشخصات یافت نشد' })
  @ApiExtraModels(UpdateCoachDto)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      allOf: [
        { $ref: getSchemaPath(UpdateCoachDto) },
        {
          type: 'object',
          properties: {
            imageFile: {
              type: 'string',
              format: 'binary',
              nullable: true,
              description: 'اختیاری',
            },
          },
          required: [],
        },
      ],
    },
  })
  @Roles(Role.Coach)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('imageFile'))
  updateCoachProfile(
    @Req() req,
    @Body() updateCoachDto: UpdateCoachDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.coachService.updateCoachProfile(req.user.userId, updateCoachDto, file);
  }

  @Put(':id')
  @ApiOperation({ summary: 'بروزرسانی پروفایل مربی توسط مستر' })
  @ApiOkResponse({ description: 'پروفایل مربی با موفقیت بروزرسانی شد' })
  @ApiNotFoundResponse({ description: 'مربی با این مشخصات یافت نشد' })
  @ApiExtraModels(UpdateCoachDto)
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', type: Number, example: 4 })
  @ApiBody({
    schema: {
      allOf: [
        { $ref: getSchemaPath(UpdateCoachDto) },
        {
          type: 'object',
          properties: {
            imageFile: {
              type: 'string',
              format: 'binary',
              nullable: true,
              description: 'اختیاری',
            },
          },
          required: [],
        },
      ],
    },
  })
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('imageFile'))
  updateCoach(
    @Req() req,
    @Param('id', ParseIntPipe) coachId: number,
    @Body() updateCoachDto: UpdateCoachDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.coachService.updateCoach(coachId, req.user.userId, updateCoachDto, file);
  }

  @Put('changeStatus/:id')
  @ApiOperation({ summary: 'تغییر وضعیت حساب مربی توسط مستر' })
  @ApiOkResponse({ description: 'وضعیت حساب کاربری با موفقیت تغییر کرد' })
  @ApiParam({ name: 'id', type: Number, example: 4 })
  @ApiBody({ type: UpdateStatusDto })
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  changeStatusAccount(
    @Req() req,
    @Param('id', ParseIntPipe) coachId: number,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.coachService.changeStatusAccount(coachId, req.user.userId, updateStatusDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف کامل مربی توسط مستر' })
  @ApiOkResponse({ description: 'مربی با موفقیت حذف شد' })
  @ApiParam({ name: 'id', type: Number, example: 4 })
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  deleteAccount(@Req() req, @Param('id', ParseIntPipe) coachId: number) {
    return this.coachService.deleteAccount(coachId, req.user.userId);
  }
}
