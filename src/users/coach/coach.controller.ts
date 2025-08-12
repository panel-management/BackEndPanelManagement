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
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CoachService } from './coach.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/auth/enums/role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CreateCoachDto } from './dto/create-coach.dto';
import { UpdateCoachDto } from './dto/update-coach.dto';

@Controller('coach')
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  getAllCoach(@Req() req) {
    const masterId = req.user.userId;
    return this.coachService.getAllCoach(masterId);
  }

  @Get('/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  getCoachById(@Req() req, @Param('id', ParseIntPipe) coachId: number) {
    const masterId = req.user.userId;
    return this.coachService.getCoachById(coachId, masterId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.Master)
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  createCoach(@Req() req, @Body() createCoachDto: CreateCoachDto) {
    const masterId = req.user.userId;
    return this.coachService.createCoach(masterId, createCoachDto);
  }

  @Put('/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.Master, Role.Coach)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  updateCoach(
    @Req() req,
    @Param('id', ParseIntPipe) coachId: number,
    @Body() updateCoachDto: UpdateCoachDto,
  ) {
    const masterId = req.user.userId;
    return this.coachService.updateCoach(coachId, masterId, updateCoachDto);
  }

  @Delete('/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  deleteCoach(@Req() req, @Param('id', ParseIntPipe) coachId: number) {
    const masterId = req.user.userId;
    return this.coachService.deleteCoach(coachId, masterId);
  }
}
