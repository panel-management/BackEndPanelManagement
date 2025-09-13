import { Module } from '@nestjs/common';
import { ClubProfileController } from './club-profile.controller';
import { ClubProfileService } from './club-profile.service';
import { SmsServiceModule } from 'src/sms-service/sms-service.module';

@Module({
  imports: [SmsServiceModule],
  controllers: [ClubProfileController],
  providers: [ClubProfileService],
})
export class ClubProfileModule {}
