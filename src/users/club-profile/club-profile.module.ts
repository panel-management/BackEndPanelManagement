import { Module } from '@nestjs/common';
import { ClubProfileController } from './club-profile.controller';
import { ClubProfileService } from './club-profile.service';

@Module({
  controllers: [ClubProfileController],
  providers: [ClubProfileService],
})
export class ClubProfileModule {}
