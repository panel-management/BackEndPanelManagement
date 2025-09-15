import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import jwtConfig from './auth/config/jwt.config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AttendanceModule } from './attendance/attendance.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SmsServiceService } from './sms-service/sms-service.service';
import { SmsServiceModule } from './sms-service/sms-service.module';
import { FinancialsModule } from './financials/financials.module';
import { TicketsModule } from './tickets/tickets.module';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [jwtConfig],
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60,
          limit: 20,
        },
      ],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    AttendanceModule,
    SmsServiceModule,
    FinancialsModule,
    TicketsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    SmsServiceService,
  ],
})
export class AppModule {}
