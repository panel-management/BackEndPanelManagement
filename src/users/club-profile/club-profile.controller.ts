import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ClubProfileService } from './club-profile.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

@Controller('club-profile')
@ApiBearerAuth('authorization')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Master)
export class ClubProfileController {
  constructor(private readonly clubProfile: ClubProfileService) {}

  @Get('view-club-profile')
  @ApiOperation({ summary: 'نمایش پروفایل باشگاه' })
  @ApiOkResponse({ description: 'پروفایل باشگاه با موفقیت دریافت شد' })
  @ApiNotFoundResponse({ description: 'اطلاعات باشگاه تکمیل نیست' })
  @HttpCode(HttpStatus.OK)
  getClubProfile(@Req() req) {
    return this.clubProfile.getClubProfile(req.user.userId);
  }

  @Post('complete-profile-club')
  @ApiOperation({ summary: 'ایجاد پروفایل باشگاه' })
  @ApiCreatedResponse({ description: 'پروفایل باشگاه با موفقیت ایجاد شد' })
  @ApiForbiddenResponse({ description: 'پروفایل باشگاه شما قبلا تکمیل شده است' })
  @ApiBody({ type: CompleteProfileDto })
  @HttpCode(HttpStatus.CREATED)
  completeClubProfile(@Req() req, @Body() completeProfileDto: CompleteProfileDto) {
    return this.clubProfile.completeClubProfile(req.user.userId, completeProfileDto);
  }

  @Patch('update-profile-club')
  @ApiOperation({ summary: "ویرایش و بروزرسانی پروفایل باشگاه" })
  @ApiOkResponse({ description: "پروفایل باشگاه با موفقیت بروزرسانی شد" })
  @ApiBody({ type: UpdateProfileDto })
  @HttpCode(HttpStatus.OK)
  updateClubProfile(@Req() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.clubProfile.updateClubProfile(req.user.userId, updateProfileDto);
  }
}
