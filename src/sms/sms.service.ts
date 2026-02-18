import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SmsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly FARAZSMS = 'https://edge.ippanel.com/v1';
  private readonly FARAZSMS_API_KEY = process.env.FARAZSMS_API_KEY;
  private readonly FARAZSMS_PATTERN_CODE = process.env.FARAZSMS_PATTERN_CODE;

  async sendMessageToUser(phoneNumber: string, message: string) {
    try {
      const response = await fetch(`${this.FARAZSMS}/api/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.FARAZSMS_API_KEY!,
        },
        body: JSON.stringify({
          sending_type: 'webservice',
          from_number: '+983000505',
          message: message,
          params: {
            recipients: [phoneNumber],
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new HttpException(data, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return data;
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async sendOtpCode(userId: number, phoneNumber: string, code: string) {
    try {
      const response = await fetch(`${this.FARAZSMS}/api/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.FARAZSMS_API_KEY!,
        },
        body: JSON.stringify({
          sending_type: 'pattern',
          from_number: '+983000505',
          code: this.FARAZSMS_PATTERN_CODE!,
          recipients: [phoneNumber],
          params: {
            code: code,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new HttpException(data, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      await this.prisma.users.update({
        where: { user_id: userId },
        data: {
          code: code,
          codeRequestedAt: new Date(),
        },
      });

      return data;
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async clearOtp(userId: number): Promise<void> {
    await this.prisma.users.update({
      where: { user_id: userId },
      data: { code: null },
    });
  }
}
