import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { MasterService } from './master.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UpdateMasterDto } from './dto/update-master.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { AssignMasterPlanDto } from './dto/assign-master-plan.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateStatusDto } from 'src/common/dto/updateStatus.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  getSchemaPath,
} from '@nestjs/swagger';

@Controller('master')
@ApiBearerAuth('authorization')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MasterController {
  constructor(private readonly masterService: MasterService) {}

  // get master
  @Get()
  @ApiOperation({ summary: 'نمایش لیست مستر برای ادمین' })
  @ApiOkResponse({ description: 'لیست استاد های باشگاه با موفقیت دریافت شد' })
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  getMaster() {
    return this.masterService.getMaster();
  }

  // See You Profile Just yourself master
  // get profile himself master
  @Get('details')
  @ApiOperation({ summary: 'نمایش پروفایل مستر' })
  @ApiOkResponse({ description: 'پروفایل با موفقیت نمایش داده شد' })
  @ApiForbiddenResponse({ description: 'کاربر مورد نظر از نوع استاد نیست' })
  @ApiNotFoundResponse({ description: 'استادی با این مشخصات یافت نشد' })
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  getMasterById(@Req() req) {
    return this.masterService.getMasterById(req.user.userId);
  }

  // See All Profile Master Just Admin
  // get profile master for admin
  @Get(':id')
  @ApiOperation({ summary: 'نمایش پروفایل مستر برای ادمین' })
  @ApiOkResponse({ description: 'پروفایل با موفقیت نمایش داده شد' })
  @ApiForbiddenResponse({ description: 'کاربر مورد نظر از نوع استاد نیست' })
  @ApiNotFoundResponse({ description: 'استادی با این مشخصات یافت نشد' })
  @ApiParam({ name: 'id', example: 3, type: Number })
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  getMasterByIdSeeAdmin(@Param('id', ParseIntPipe) masterId: number) {
    return this.masterService.getMasterByIdSeeAdmin(masterId);
  }

  // See You Update Profile Just yourself master
  // update profile himself master
  @Put('update/details')
  @ApiOperation({ summary: 'بروزرسانی پروفایل مستر' })
  @ApiOkResponse({ description: 'پروفایل با موفقیت بروزرسانی شد' })
  @ApiForbiddenResponse({ description: 'کاربر مورد نظر از نوع استاد نیست' })
  @ApiNotFoundResponse({ description: 'استادی با این مشخصات یافت نشد' })
  @ApiExtraModels(UpdateMasterDto)
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      allOf: [
        { $ref: getSchemaPath(UpdateMasterDto) },
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
  updateMasterByAdmin(
    @Req() req,
    @Body() updateMasterDto: UpdateMasterDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.masterService.updateMaster(req.user.userId, updateMasterDto, file);
  }

  // See All Update Profile Master Just Admin
  // update profile master for admin
  @Put('update/:id')
  @ApiOperation({ summary: 'بروزرسانی پروفایل مستر برای ادمین' })
  @ApiOkResponse({ description: 'پروفایل مستر با موفقیت بروزرسانی شد' })
  @ApiForbiddenResponse({ description: 'کاربر مورد نظر از نوع استاد نیست' })
  @ApiNotFoundResponse({ description: 'استادی با این مشخصات یافت نشد' })
  @ApiExtraModels(UpdateMasterDto)
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiParam({ name: 'id', type: Number, example: 3 })
  @ApiBody({
    schema: {
      allOf: [
        { $ref: getSchemaPath(UpdateMasterDto) },
        {
          type: 'object',
          properties: {
            imageFile: {
              type: 'string',
              format: 'binary',
              nullable: true,
              description: "اختیاری"
            },
          },
          required: [],
        },
      ],
    },
  })
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('imageFile'))
  updateMaster(
    @Param('id', ParseIntPipe) masterId: number,
    @Body() updateMasterDto: UpdateMasterDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.masterService.updateMaster(masterId, updateMasterDto, file);
  }

  // change status master for admin
  @Put('changeStatus/:id')
  @ApiOperation({ summary: 'تغییر وضعیت اکانت مستر توسط ادمین' })
  @ApiOkResponse({ description: 'وضعیت اکانت مستر با موفقیت انجام شد' })
  @ApiForbiddenResponse({ description: 'کاربر مورد نظر از نوع استاد نیست' })
  @ApiNotFoundResponse({ description: 'استادی با این مشخصات یافت نشد' })
  @ApiParam({ name: 'id', type: Number, example: 3 })
  @ApiBody({ type: UpdateStatusDto })
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  changeStatusMaster(
    @Param('id', ParseIntPipe) masterId: number,
    @Body() updateStatusUserDto: UpdateStatusDto,
  ) {
    return this.masterService.changeStatusAccount(masterId, updateStatusUserDto);
  }

  // select plan himself master
  @Put('my-plan')
  @ApiOperation({ summary: 'انتخاب پلن توسط خود مستر' })
  @ApiOkResponse({
    description: `
    پلن ازمایشی با موفقیت فعال شد
    پلن پولی انتخاب شد لطفاً برای فعال‌سازی، هزینه را پرداخت کنید
    `,
  })
  @ApiNotFoundResponse({
    description: `
    استاد با این مشخصات یافت نشد
    پلن اشتراک یافت نشد
    `,
  })
  @ApiBadRequestResponse({
    description: `
    امکان اختصاص پلن به این کاربر وجود ندارد
    شما یک پرداخت در انتظار تایید دارید لطفا صبر کنید تا پرداخت قبلی بررسی شود
    کاربر گرامی شما قبلا پلن رایگان را استفاده کرده اید
    `,
  })
  @ApiBody({ type: AssignMasterPlanDto })
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  selectMyPlan(@Req() req, @Body() assignDto: AssignMasterPlanDto) {
    return this.masterService.assignPlanToMaster(req.user.userId, assignDto.planId);
  }

  // delete account master
  @Delete(':id')
  @ApiOperation({ summary: 'حذف کامل اکانت مستر توسط ادمین' })
  @ApiOkResponse({ description: 'استاد و تمامی اطلاعات وابسته با موفقیت حذف شدند' })
  @ApiForbiddenResponse({ description: 'کاربر مورد نظر از نوع استاد نیست' })
  @ApiNotFoundResponse({ description: 'استادی با این مشخصات یافت نشد' })
  @ApiParam({ name: 'id', type: Number, example: 2 })
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  deleteMaster(@Param('id', ParseIntPipe) masterId: number) {
    return this.masterService.deleteMaster(masterId);
  }
}
