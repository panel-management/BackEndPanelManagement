import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async requestOtp(phoneNumber: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    let user = await this.userService.findByPhoneNumber(phoneNumber);

    if (user && user.codeRequestedAt) {
      const now = new Date();
      const lastRequestTime = new Date(user.codeRequestedAt);
      const diffInSeconds = (now.getTime() - lastRequestTime.getTime()) / 1000;
      if (diffInSeconds < 60) {
        const timeLeft = Math.ceil(60 - diffInSeconds);

        throw new HttpException(
          `لطفا ${timeLeft} ثانیه دیگر دوباره امتحان کنید`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    if (!user) {
      user = await this.userService.createUser(phoneNumber);
    }

    await this.userService.setOtpWithTimestamp(user.user_id, otp);

    return {
      statusCode: 200,
      message: 'کد تایید با موفقیت ارسال شد',
      data: {
        code: otp,
      },
    };
  }

  async verifyOtp(phoneNumber: string, code: string) {
    const user = await this.userService.findByPhoneNumber(phoneNumber);

    if (!user || !user.fullName) {
      throw new NotFoundException({
        statusCode: 404,
        message:
          'کاربری با این مشخصات یافت نشد ثبت‌ نام شما کامل نیست. لطفا ابتدا ثبت‌نام کنید',
      });
    }

    if (user.code !== code) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'کد تایید نامعتبر است',
      });
    }

    await this.userService.setOtpCode(user.user_id, '');

    const isNewUser = !user.fullName;
    const payload = {
      sub: user.user_id,
      phone: user.phoneNumber,
      type: user.type,
    };
    const accessToken = this.jwtService.sign(payload);
    return {
      statusCode: 200,
      message: 'ورود با موفقیت انجام شد',
      data: { accessToken, isNewUser },
    };
  }

  async completeRegistration(dto: CompleteRegistrationDto) {
    const { phoneNumber, code, fullName, nationalCode, sportId } = dto;
    const user = await this.userService.findByPhoneNumber(phoneNumber);

    if (!user || user.code !== dto.code) {
      throw new UnauthorizedException('شماره تلفن یا کد تایید نامعتبر است');
    }

    if (user.fullName) {
      throw new ConflictException('این شماره تلفن قبلاً ثبت‌نام شده است');
    }

    const updateUser = await this.userService.updateProfile(user.user_id, {
      fullName,
      nationalCode,
      sportId,
    });
    await this.userService.clearOtp(user.user_id);
    const payload = {
      sub: updateUser.user_id,
      phoneNumber: updateUser.phoneNumber,
      type: updateUser.type,
    };
    const accessToken = this.jwtService.sign(payload);
    return {
      statusCode: 201,
      message: 'ثبت نام با موفقیت انجام شد',
      data: { accessToken },
    };
  }
}
