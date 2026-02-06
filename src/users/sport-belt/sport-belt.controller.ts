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
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('sport-belt')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SportBeltController {
  constructor(private readonly sportBeltService: SportBeltService) {}

  @Public()
  @Get('sport')
  @HttpCode(HttpStatus.OK)
  getSports() {
    return this.sportBeltService.getSport();
  }

  @Get('belt')
  @Roles(Role.Admin, Role.Master)
  @HttpCode(HttpStatus.OK)
  getBelts() {
    return this.sportBeltService.getBelt();
  }

  @Get('belt/:id')
  @Roles(Role.Admin, Role.Master)
  @HttpCode(HttpStatus.OK)
  getBeltById(@Param('id', ParseIntPipe) beltId: number) {
    return this.sportBeltService.getBeltById(beltId);
  }
}
