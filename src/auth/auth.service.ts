import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { SmsService } from 'src/sms/sms.service';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import { JwtService } from '@nestjs/jwt';
import { Role } from './enums/role.enum';
import { PrismaService } from 'src/prisma/prisma.service';
import { randomInt } from 'crypto';
import { users } from '@prisma/client';

type profileData = {
  fullName: string;
  phoneNumber: string;
  nationalCode: string;
  sportId: number;
  type: number;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly smsService: SmsService,
    private readonly jwtService: JwtService,
  ) {}

  private checkOtpExpiration(requestedAt: Date | null) {
    if (!requestedAt) throw new HttpException('کد تایید یافت نشد', HttpStatus.UNAUTHORIZED);
    const diffInMinutes = (Date.now() - new Date(requestedAt).getTime()) / 1000 / 60;
    if (diffInMinutes > 2) {
      throw new HttpException('کد تایید منقضی شده است', HttpStatus.UNAUTHORIZED);
    }
  }

  async findByPhoneNumber(phoneNumber: string): Promise<users | null> {
    return this.prisma.users.findUnique({
      where: { phoneNumber },
    });
  }

  async createUser(phoneNumber: string): Promise<users> {
    return this.prisma.users.create({
      data: {
        phoneNumber,
      },
    });
  }

  async updateProfile(userId: number, profileData: profileData): Promise<users> {
    const existingUser = await this.prisma.users.findFirst({
      where: {
        OR: [{ nationalCode: profileData.nationalCode }, { phoneNumber: profileData.phoneNumber }],
        NOT: { user_id: userId },
      },
    });

    if (existingUser) {
      if (existingUser.nationalCode === profileData.nationalCode) {
        throw new HttpException(
          'کدملی تکراری است لطفا کدملی صحیح وارد کنید',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (existingUser.phoneNumber === profileData.phoneNumber) {
        throw new HttpException(
          'شماره تلفن تکراری است لطفا شماره تلفن صحیح وارد کنید',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    return this.prisma.users.update({
      where: { user_id: userId },
      data: {
        fullName: profileData.fullName,
        phoneNumber: profileData.phoneNumber,
        nationalCode: profileData.nationalCode,
        ...(profileData.sportId && {
          sport: { connect: { id: profileData.sportId } },
        }),
        type: profileData.type,
      },
    });
  }

  async validateUserById(userId: number) {
    return this.prisma.users.findUnique({
      where: { user_id: userId },
    });
  }

  async requestOtp(phoneNumber: string) {
    const otp = randomInt(100000, 1000000).toString();
    let user = await this.findByPhoneNumber(phoneNumber);

    if (user && user.codeRequestedAt) {
      const diffInSeconds = (Date.now() - new Date(user.codeRequestedAt).getTime()) / 1000;
      if (diffInSeconds < 60) {
        throw new HttpException(
          `لطفا ${Math.ceil(60 - diffInSeconds)} ثانیه دیگر دوباره امتحان کنید`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    if (!user) {
      user = await this.createUser(phoneNumber);
    }

    await this.smsService.sendOtpCode(user.user_id, user.phoneNumber, otp);

    return {
      statusCode: HttpStatus.OK,
      message: 'کد تایید با موفقیت ارسال شد',
      data: otp,
    };
  }

  async verifyOtp(phoneNumber: string, code: string) {
    const user = await this.findByPhoneNumber(phoneNumber);

    if (!user || !user.fullName) {
      throw new HttpException('ثبت‌ نام تکمیل نشده لطفا ابتدا ثبت‌ نام کنید', HttpStatus.NOT_FOUND);
    }

    this.checkOtpExpiration(user.codeRequestedAt);

    if (user.code !== code) {
      throw new HttpException('کد تایید نامعتبر است', HttpStatus.UNAUTHORIZED);
    }

    await this.smsService.clearOtp(user.user_id);

    const payload = {
      sub: user.user_id,
      phone: user.phoneNumber,
      type: user.type,
    };
    return {
      statusCode: HttpStatus.OK,
      message: 'ورود با موفقیت انجام شد',
      data: this.jwtService.sign(payload),
    };
  }

  async registration(dto: CompleteRegistrationDto) {
    const { phoneNumber, code, fullName, nationalCode, sportId } = dto;
    const user = await this.findByPhoneNumber(phoneNumber);

    if (!user) {
      throw new HttpException('ثبت‌ نام تکمیل نشده لطفا ابتدا ثبت‌ نام کنید', HttpStatus.NOT_FOUND);
    }

    this.checkOtpExpiration(user.codeRequestedAt);

    if (user.code !== code) {
      throw new HttpException('کد تایید نامعتبر است', HttpStatus.UNAUTHORIZED);
    }

    if (user.fullName) {
      throw new HttpException('این شماره تلفن قبلاً ثبت‌ نام شده است', HttpStatus.CONFLICT);
    }

    const updateUser = await this.updateProfile(user.user_id, {
      fullName,
      phoneNumber,
      nationalCode,
      sportId,
      type: Role.Master,
    });

    await this.smsService.clearOtp(user.user_id);

    await this.smsService.sendMessageToUser(
      phoneNumber,
      `سلام مدیر محترم ${fullName}
ثبت نام شما با موفقیت انجام شد لطف برای استفاده از پنل باشگاه هوشمند اطلاعات خود را تکمیل کنید✅`,
    );

    const payload = {
      sub: updateUser.user_id,
      phoneNumber: updateUser.phoneNumber,
      type: updateUser.type,
    };
    return {
      statusCode: HttpStatus.CREATED,
      message: 'ثبت نام با موفقیت انجام شد',
      data: this.jwtService.sign(payload),
    };
  }
}
