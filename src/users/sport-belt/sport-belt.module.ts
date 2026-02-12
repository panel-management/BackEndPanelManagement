import { Module } from '@nestjs/common';
import { SportBeltService } from './sport-belt.service';
import { SportBeltController } from './sport-belt.controller';

@Module({
  providers: [SportBeltService],
  controllers: [SportBeltController],
})
export class SportBeltModule {}
