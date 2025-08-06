import {
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { AuthGuard } from '@nestjs/passport';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe())
  requestOpt(@Body() requestOtpDto: RequestOtpDto) {
    return this.authService.requestOtp(requestOtpDto.phoneNumber);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe())
  verifyOpt(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(
      verifyOtpDto.phoneNumber,
      verifyOtpDto.code,
    );
  }

  @Post('registration')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe())
  completeRegistration(@Body() completeRegistration: CompleteRegistrationDto) {
    return this.authService.completeRegistration(completeRegistration);
  }
}
