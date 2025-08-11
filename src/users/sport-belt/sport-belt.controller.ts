import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { SportBeltService } from './sport-belt.service';

@Controller('sport-belt')
export class SportBeltController {
  constructor(private readonly sportBeltService: SportBeltService) {}

  @Get('sport')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Master)
  @HttpCode(HttpStatus.OK)
  getAllSport() {
    return this.sportBeltService.getAllSport();
  }

  @Get('sport/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Master)
  @HttpCode(HttpStatus.OK)
  getSportById(@Param('id', ParseIntPipe) sportId: number) {
    return this.sportBeltService.getSportById(sportId);
  }

  @Get('belt')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Master, Role.coach)
  @HttpCode(HttpStatus.OK)
  getAllBelt() {
    return this.sportBeltService.getAllBelt();
  }

  @Get('belt/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Master, Role.coach)
  @HttpCode(HttpStatus.OK)
  getBeltById(@Param('id', ParseIntPipe) beltId: number) {
    return this.sportBeltService.getBeltById(beltId);
  }
}
