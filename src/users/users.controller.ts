import { Controller, Get, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';

@Controller('users')
@ApiBearerAuth('authorization')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin, Role.Master, Role.Coach, Role.Student)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // get data user
  @Get()
  @ApiOperation({
    summary: 'نمایش پروفایل کاربر',
    description: `
    این Endpoint برای تمام کاربران احراز هویت‌شده قابل استفاده است.
    نقش‌های موجود در سیستم:
    - Admin (${Role.Admin})
    - Master (${Role.Master})
    - Coach (${Role.Coach})
    - Student (${Role.Student})
    `,
  })
  @ApiOkResponse({ description: 'پروفایل کاربر با موفقیت دریافت شد' })
  @HttpCode(HttpStatus.OK)
  getAllProfileUser(@Req() req) {
    return this.users.getProfileUsers(req.user.userId);
  }

  // get plan status
  @Get('plan/status')
  @ApiOperation({
    summary: 'نمایش وضعیت پلن کاربر',
    description: `
    Admin Plan:
      userType: 0,
      isActive: true,
      isAdmin: true,
    Master Plan:
      userType: 1,
      isActive: false,
      noPlan: true,
      isPending: true,
      needsPayment: true,
      isExpired: true,
    Coach Plan:
      userType: 2,
      isActive: true,
    Student Plan:
      userType: 3,
      isActive: false,
      noPlan: true,
      isExpired: true,
      isPending: true,
    `,
  })
  @ApiOkResponse({ description: 'پلن با موفقیت دریافت شد' })
  @ApiNotFoundResponse({ description: 'کاربر یافت نشد' })
  @HttpCode(HttpStatus.OK)
  getMyPlanStatus(@Req() req) {
    return this.users.getPlanStatus(req.user.userId);
  }
}
