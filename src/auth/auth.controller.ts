import { Controller, Post, HttpCode, HttpStatus, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import { Public } from './decorators/public.decorator';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiOperation({ summary: 'Step 1' })
  @ApiBody({ type: RequestOtpDto, description: "شماره تلفن برای ارسال کد تایید" })
  @ApiResponse({ status: 200, description: "کد تأیید با موفقیت ارسال شد" })
  @ApiResponse({ status: 429, description: "درخواست های زیاد بعد 1 دقیقه دوباره تلاش کنید" })
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  requestOpt(@Body() requestOtpDto: RequestOtpDto) {
    return this.authService.requestOtp(requestOtpDto.phoneNumber);
  }

  @Public()
  @ApiOperation({ summary: 'Step 2' })
  @ApiBody({ type: VerifyOtpDto, description: "کد تایید برای ورود یا ثبت نام" })
  @ApiResponse({ status: 200, description: "کد تأیید با موفقیت تولید شد" })
  @ApiResponse({ status: 401, description: "کد تایید منقضی شده است دوباره تلاش کنید" })
  @ApiResponse({ status: 404, description: "کاربر ثبت نام نشده لطف اول ثبت نام کنید" })
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  verifyOpt(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto.phoneNumber, verifyOtpDto.code);
  }

  @Public()
  @ApiOperation({ summary: 'Step 3' })
  @ApiBody({ type: CompleteRegistrationDto, description: "ثبت نام" })
  @ApiResponse({ status: 201, description: "ثبت نام با موفقیت انجام شد" })
  @ApiResponse({ status: 401, description: "کد تایید نامعتبر است دوباره اقدام کنید" })
  @ApiResponse({ status: 409, description: "این شماره تلفن قبلاً ثبت‌ نام کرده" })
  @Post('registration')
  @HttpCode(HttpStatus.CREATED)
  registration(@Body() completeRegistration: CompleteRegistrationDto) {
    return this.authService.registration(completeRegistration);
  }
}
