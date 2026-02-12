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

@Controller('coach')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  @Get()
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  getCoach(@Req() req) {
    return this.coachService.getCoach(req.user.userId);
  }

  @Get('profile')
  @Roles(Role.Coach)
  @HttpCode(HttpStatus.OK)
  getCoachProfile(@Req() req) {
    return this.coachService.getCoachProfile(req.user.userId);
  }

  @Get(':id')
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  getCoachById(@Req() req, @Param('id', ParseIntPipe) coachId: number) {
    return this.coachService.getCoachById(coachId, req.user.userId);
  }

  @Post()
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
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  deleteAccount(@Req() req, @Param('id', ParseIntPipe) coachId: number) {
    return this.coachService.deleteAccount(coachId, req.user.userId);
  }
}
