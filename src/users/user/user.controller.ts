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

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly user: UserService) {}

  // get all data users
  @Get()
  @HttpCode(HttpStatus.OK)
  getAllProfileUser(@Req() req) {
    return this.user.getAllProfileUser(req.user.userId);
  }
}
