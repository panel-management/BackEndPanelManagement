import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ClubProfileService } from './club-profile.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('club-profile')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClubProfileController {
  constructor(private readonly clubProfile: ClubProfileService) {}

  @Get('view-club-profile')
  @Roles(Role.Master)
  getMyClubProfile(@Req() req) {
    return this.clubProfile.getInstructorProfile(req.user.userId);
  }

  @Post('complete-profile-club')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.Master)
  completeInstructorProfile(
    @Req() req,
    @Body() completeProfileDto: CompleteProfileDto,
  ) {
    return this.clubProfile.completeInstructorProfile(
      req.user.userId,
      completeProfileDto,
    );
  }

  @Put('update-profile-club')
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  updateInstructorProfile(
    @Req() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.clubProfile.updateInstructorProfile(
      req.user.userId,
      updateProfileDto,
    );
  }
}
