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
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MasterService } from './master.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UpdateMasterDto } from './dto/update-master.dto';
import { AssignMasterPlanDto } from './dto/assign-master-plan.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateStatusDto } from 'src/common/dto/updateStatus.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';

@Controller('master')
@ApiBearerAuth('authorization')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MasterController {
  constructor(private readonly masterService: MasterService) {}

  // get all master
  @Get()
  @ApiOperation({ summary: 'نمایش لیست مستر برای ادمین' })
  @ApiOkResponse({ description: 'لیست استاد های باشگاه با موفقیت دریافت شد' })
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  getMaster() {
    return this.masterService.getMaster();
  }

  // see profile master himself
  @Get('profile')
  @ApiOperation({ summary: 'نمایش پروفایل مستر' })
  @ApiOkResponse({ description: 'پروفایل با موفقیت نمایش داده شد' })
  @ApiForbiddenResponse({ description: 'کاربر مورد نظر از نوع استاد نیست' })
  @ApiNotFoundResponse({ description: 'استادی با این مشخصات یافت نشد' })
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  getMasterById(@Req() req) {
    return this.masterService.getMasterById(req.user.userId);
  }

  // see profile master by admin
  @Get('profile/:id')
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

  // update profile master himself
  @Patch('update/profile')
  @ApiOperation({ summary: 'بروزرسانی پروفایل مستر' })
  @ApiOkResponse({ description: 'پروفایل با موفقیت بروزرسانی شد' })
  @ApiForbiddenResponse({ description: 'کاربر مورد نظر از نوع استاد نیست' })
  @ApiNotFoundResponse({ description: 'استادی با این مشخصات یافت نشد' })
  @ApiBody({ type: UpdateMasterDto })
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  updateMasterByAdmin(@Req() req, @Body() updateMasterDto: UpdateMasterDto) {
    return this.masterService.updateMaster(req.user.userId, updateMasterDto);
  }

  // update profile master by admin
  @Patch('update/:id')
  @ApiOperation({ summary: 'بروزرسانی پروفایل مستر برای ادمین' })
  @ApiOkResponse({ description: 'پروفایل مستر با موفقیت بروزرسانی شد' })
  @ApiForbiddenResponse({ description: 'کاربر مورد نظر از نوع استاد نیست' })
  @ApiNotFoundResponse({ description: 'استادی با این مشخصات یافت نشد' })
  @ApiParam({ name: 'id', type: Number, example: 3 })
  @ApiBody({ type: UpdateMasterDto })
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  updateMaster(
    @Param('id', ParseIntPipe) masterId: number,
    @Body() updateMasterDto: UpdateMasterDto,
  ) {
    return this.masterService.updateMaster(masterId, updateMasterDto);
  }

  // change status master by admin
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

  // delete account master by admin
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
