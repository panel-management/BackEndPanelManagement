import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SmsService {
  constructor(private readonly prisma: PrismaService, private readonly httpService: HttpService) { }

  private readonly FARAZSMS = 'https://api.iranpayamak.com';
  private readonly FARAZSMS_API_KEY = process.env.FARAZSMS_API_KEY;
  private readonly FARAZSMS_PATTERN_CODE = process.env.FARAZSMS_PATTERN_CODE;

  async SendSmsMassageInfo(url: string, message: string, phoneNumber: string): Promise<string> {
    try {
      const numberFormat = /^[0-9]+$/.test(phoneNumber) ? 'english' : 'persian';

      const payload = {
        line_number: '90008361',
        text: message,
        recipients: [phoneNumber],
        number_format: numberFormat,
        schedule: null
      };

      const abservable = this.httpService.post(url, payload, { headers: { "Content-Type": "application/json", "Accept": "application/json", "Api-Key": this.FARAZSMS_API_KEY } })
      const result = await lastValueFrom(abservable)

      if (result.status) {
        return result.data
      } else {
        throw new HttpException(result, HttpStatus.INTERNAL_SERVER_ERROR);
      }

    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async SendSmsPattern(url: string, phoneNumber: string, code?: string): Promise<string> {
    try {
      const numberFormat = /^[0-9]+$/.test(phoneNumber) ? 'english' : 'persian';

      const payload = {
        code: this.FARAZSMS_PATTERN_CODE,
        attributes: {
          code: code
        },
        recipient: phoneNumber,
        line_number: '90008361',
        number_format: numberFormat,
      };

      const abservable = this.httpService.post(url, payload, { headers: { "Content-Type": "application/json", "Accept": "application/json", "Api-Key": this.FARAZSMS_API_KEY } })
      const result = await lastValueFrom(abservable)

      if (result.status) {
        return result.data
      } else {
        throw new HttpException(result, HttpStatus.INTERNAL_SERVER_ERROR);
      }

    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async sendMessageToUser(phoneNumber: string, message: string): Promise<string> {
    return await this.SendSmsMassageInfo(`${this.FARAZSMS}/ws/v1/sms/simple`, message, phoneNumber);
  }

  async sendOtpCode(userId: number, phoneNumber: string, code: string): Promise<string | number> {
    await this.prisma.users.update({
      where: { user_id: userId },
      data: {
        code: code,
        codeRequestedAt: new Date(),
      },
    });

    return await this.SendSmsPattern(`${this.FARAZSMS}/ws/v1/sms/pattern`, phoneNumber, code)
  }
  
  async clearOtp(userId: number): Promise<void> {
    await this.prisma.users.update({
      where: { user_id: userId },
      data: { code: null },
    });
  }
}
