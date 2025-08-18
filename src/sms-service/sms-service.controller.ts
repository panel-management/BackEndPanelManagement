import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { SmsServiceService } from './sms-service.service';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('sms-service')
export class SmsServiceController {
  constructor(private readonly SmsService: SmsServiceService) {}

  // @Public()
  // @Post()
  // @HttpCode(HttpStatus.OK)
  // sendMessageToUsers() {
  //   this.SmsService.sendMessageToUser(
  //     '09025672263',
  //     'ثبت نام یا موفقیت انجام شد پنل مدیریت باشگاه رزمی احسان فولادی',
  //   );
  // }
}
