import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ClubProfileService } from './club-profile.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('club-profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Master)
export class ClubProfileController {
  constructor(private readonly clubProfile: ClubProfileService) {}

  @Get('view-club-profile')
  @HttpCode(HttpStatus.OK)
  getClubProfile(@Req() req) {
    return this.clubProfile.getClubProfile(req.user.userId);
  }

  @Post('complete-profile-club')
  @HttpCode(HttpStatus.CREATED)
  completeClubProfile(@Req() req, @Body() completeProfileDto: CompleteProfileDto) {
    return this.clubProfile.completeClubProfile(req.user.userId, completeProfileDto);
  }

  @Post('update-profile-club')
  @HttpCode(HttpStatus.OK)
  updateClubProfile(@Req() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.clubProfile.updateClubProfile(req.user.userId, updateProfileDto);
  }
}
