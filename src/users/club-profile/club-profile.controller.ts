import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
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

  @Put('complete-profile-club')
  @Roles(Role.Master)
  @HttpCode(HttpStatus.CREATED)
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
