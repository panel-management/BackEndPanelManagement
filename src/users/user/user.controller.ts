import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly user: UserService) {}

  // get data user
  @Get()
  @HttpCode(HttpStatus.OK)
  getAllProfileUser(@Req() req) {
    return this.user.getAllProfileUser(req.user.userId);
  }

  @Get('plan/status')
  @Roles(Role.Admin, Role.Master, Role.Coach, Role.Student)
  @HttpCode(HttpStatus.OK)
  getMyPlanStatus(@Req() req) {
    return this.user.getPlanStatus(req.user.userId);
  }
}
