import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from 'src/users/users.module';
import { ConfigModule } from '@nestjs/config';
import jwtConfig from './config/jwt.config';
import { SmsServiceModule } from 'src/sms-service/sms-service.module';

@Module({
  imports: [
    UsersModule,
    SmsServiceModule,
    ConfigModule,
    JwtModule.registerAsync(jwtConfig.asProvider()),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
