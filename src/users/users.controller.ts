import { Controller, Get, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // get data user
  @Get()
  @HttpCode(HttpStatus.OK)
  getAllProfileUser(@Req() req) {
    return this.users.getProfileUsers(req.user.userId);
  }

  // get plan status
  @Get('plan/status')
  @Roles(Role.Admin, Role.Master, Role.Coach, Role.Student)
  @HttpCode(HttpStatus.OK)
  getMyPlanStatus(@Req() req) {
    return this.users.getPlanStatus(req.user.userId);
  }
}
