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
import { UpdateStatusUserDto } from './dto/updateStatus-master.dto';
import { AssignMasterPlanDto } from './dto/assign-master-plan.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('master')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MasterController {
  constructor(private readonly masterService: MasterService) {}

  @Get()
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  getAllMaster() {
    return this.masterService.getAllMaster();
  }

  @Get('/:id')
  @Roles(Role.Admin, Role.Master)
  @HttpCode(HttpStatus.OK)
  getMasterById(@Param('id', ParseIntPipe) masterId: number) {
    return this.masterService.getMasterById(masterId);
  }

  @Put('/:id')
  @Roles(Role.Admin, Role.Master)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('imageFile'))
  updateMaster(
    @Param('id', ParseIntPipe) masterId: number,
    @Body() updateMasterDto: UpdateMasterDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.masterService.updateMaster(masterId, updateMasterDto, file);
  }

  @Put('/changeStatus/:id')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  changeStatusMaster(
    @Param('id', ParseIntPipe) masterId: number,
    @Body() updateStatusUserDto: UpdateStatusUserDto,
  ) {
    return this.masterService.updateStatusMaster(
      masterId,
      updateStatusUserDto.active,
    );
  }

  // select plan just one master in admin
  @Put('/:id/assign-plan')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  assignPlanByAdmin(
    @Param('id', ParseIntPipe) masterId: number,
    @Body() assignDto: AssignMasterPlanDto,
  ) {
    return this.masterService.assignPlanToMaster(masterId, assignDto.planId);
  }

  @Put('my-plan')
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  selectMyPlan(@Req() req, @Body() assignDto: AssignMasterPlanDto) {
    return this.masterService.selectPlanForSelf(
      req.user.userId,
      assignDto.planId,
    );
  }

  @Delete('/:id')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  deleteMaster(@Param('id', ParseIntPipe) masterId: number) {
    return this.masterService.deleteMaster(masterId);
  }
}
