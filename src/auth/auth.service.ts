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
import { SmsServiceService } from 'src/sms-service/sms-service.service';
import { Role } from './enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly smsService: SmsServiceService,
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

    await this.smsService.sendOtpCode(user.user_id, user.phoneNumber!, otp);

    return {
      statusCode: 200,
      message: 'کد تایید با موفقیت ارسال شد',
      data: otp,
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

    await this.smsService.clearOtp(user.user_id);

    const payload = {
      sub: user.user_id,
      phone: user.phoneNumber,
      type: user.type,
    };
    const accessToken = this.jwtService.sign(payload);
    return {
      statusCode: 200,
      message: 'ورود با موفقیت انجام شد',
      data: accessToken,
    };
  }

  async completeRegistration(dto: CompleteRegistrationDto) {
    const { phoneNumber, code, fullName, nationalCode, sportId } = dto;
    const user = await this.userService.findByPhoneNumber(phoneNumber);

    if (!user || user.code !== dto.code) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'شماره تلفن یا کد تایید نامعتبر است',
      });
    }

    if (user.fullName) {
      throw new ConflictException({
        statusCode: 409,
        message: 'این شماره تلفن قبلاً ثبت‌ نام شده است'
      });
    }

    const updateUser = await this.userService.updateProfile(user.user_id, {
      fullName,
      nationalCode,
      sportId,
      type: Role.Master,
    });

    await this.smsService.clearOtp(user.user_id);

    const message = `سلام مدیر محترم ${fullName}
    ثبت نام شما با موفقیت انجام شد لطف برای استفاده از پنل باشگاه هوشمند اطلاعات خود را تکمیل کنید✅`;

    try {
      await this.smsService.sendMessageToUser(phoneNumber, message);
    } catch (error) {
      console.error(
        `ارسال پیامک خوش آمدگویی به ${phoneNumber} ناموفق بود:`,
        error,
      );
    }

    const payload = {
      sub: updateUser.user_id,
      phoneNumber: updateUser.phoneNumber,
      type: updateUser.type,
    };
    const accessToken = this.jwtService.sign(payload);
    return {
      statusCode: 201,
      message: 'ثبت نام با موفقیت انجام شد',
      data: accessToken,
    };
  }
}
