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
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { MasterService } from './master.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UpdateMasterDto } from './dto/update-master.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateStatusUserDto } from './dto/updateStatus-master.dto';

@Controller('master')
export class MasterController {
  constructor(private readonly masterService: MasterService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  getAllMaster() {
    return this.masterService.getAllMaster();
  }

  @Get('/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Master)
  @HttpCode(HttpStatus.OK)
  getMasterById(@Param('id', ParseIntPipe) masterId: number) {
    return this.masterService.getMasterById(masterId);
  }

  @Put('/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Master)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('imageFile'))
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  updateMaster(
    @Param('id', ParseIntPipe) masterId: number,
    @Body() updateMasterDto: UpdateMasterDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.masterService.updateMaster(masterId, updateMasterDto, file);
  }

  @Put('/changeStatus/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  changeStatusMaster(
    @Param('id', ParseIntPipe) masterId: number,
    @Body() updateStatusUserDto: UpdateStatusUserDto,
  ) {
    return this.masterService.updateStatusMaster(
      masterId,
      updateStatusUserDto.active,
    );
  }

  @Delete('/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  deleteMaster(@Param('id', ParseIntPipe) masterId: number) {
    return this.masterService.deleteMaster(masterId);
  }
}
