import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserPayload } from './interfaces/user-payload.interface';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly auth: AuthService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('کلید مخفی JWT در متغیرهای محیطی (.env) تنظیم نشده است!');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any): Promise<UserPayload> {
    const user = await this.auth.validateUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'کاربر مورد نظر یافت نشد یا حذف شده است',
      });
    }
    return { userId: payload.sub, phone: payload.phone, type: payload.type };
  }
}
