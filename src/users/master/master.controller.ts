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

@Controller('master')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MasterController {
  constructor(private readonly masterService: MasterService) {}

  // get master
  @Get()
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  getMaster() {
    return this.masterService.getMaster();
  }

  // See You Profile Just yourself master
  // get profile himself master
  @Get('details')
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  getMasterById(@Req() req) {
    return this.masterService.getMasterById(req.user.userId);
  }

  // See All Profile Master Just Admin
  // get profile master for admin
  @Get(':id')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  getMasterByIdSeeAdmin(@Param('id', ParseIntPipe) masterId: number) {
    return this.masterService.getMasterByIdSeeAdmin(masterId);
  }

  // See You Update Profile Just yourself master
  // update profile himself master
  @Put('update/details')
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('imageFile'))
  updateMasterByAdmin(
    @Req() req,
    @Body() updateMasterDto: UpdateMasterDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.masterService.updateMaster(
      req.user.userId,
      updateMasterDto,
      file,
    );
  }

  // See All Update Profile Master Just Admin
  // update profile master for admin
  @Put('update/:id')
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
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  changeStatusMaster(
    @Param('id', ParseIntPipe) masterId: number,
    @Body() updateStatusUserDto: UpdateStatusDto,
  ) {
    return this.masterService.changeStatusAccount(
      masterId,
      updateStatusUserDto,
    );
  }

  // select plan for master just admin
  @Put(':id/assign-plan')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  assignPlanByAdmin(
    @Param('id', ParseIntPipe) masterId: number,
    @Body() assignDto: AssignMasterPlanDto,
  ) {
    return this.masterService.assignPlanToMaster(masterId, assignDto.planId);
  }

  // select plan himself master
  @Put('my-plan')
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  selectMyPlan(@Req() req, @Body() assignDto: AssignMasterPlanDto) {
    return this.masterService.selectPlanHimSelf(
      req.user.userId,
      assignDto.planId,
    );
  }

  // delete account master
  @Delete(':id')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  deleteMaster(@Param('id', ParseIntPipe) masterId: number) {
    return this.masterService.deleteMaster(masterId);
  }
}
