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
import { UpdateStatusUserDto } from './dto/updateStatus-coach.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('coach')
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  getAllCoach(@Req() req) {
    return this.coachService.getAllCoach(req.user.userId);
  }

  @Get('/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.Master, Role.Coach)
  @HttpCode(HttpStatus.OK)
  getCoachById(@Req() req, @Param('id', ParseIntPipe) coachId: number) {
    return this.coachService.getCoachById(coachId, req.user.userId);
  }

  @Post()
  @UseGuards(RolesGuard)
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

  @Put('/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.Master, Role.Coach)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('imageFile'))
  updateCoach(
    @Req() req,
    @Param('id', ParseIntPipe) coachId: number,
    @Body() updateCoachDto: UpdateCoachDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.coachService.updateCoach(
      coachId,
      req.user.userId,
      updateCoachDto,
      file,
    );
  }

  @Put('/changeStatus/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  changeStatusCoach(
    @Req() req,
    @Param('id', ParseIntPipe) coachId: number,
    @Body() updateStatusUserDto: UpdateStatusUserDto,
  ) {
    return this.coachService.updateStatusCoach(
      coachId,
      req.user.userId,
      updateStatusUserDto.active,
    );
  }

  @Delete('/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  deleteCoach(@Req() req, @Param('id', ParseIntPipe) coachId: number) {
    return this.coachService.deleteCoach(coachId, req.user.userId);
  }
}
