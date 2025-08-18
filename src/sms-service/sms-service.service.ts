import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SmsServiceService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly X_API_KEY = process.env.X_API_KEY;
  private readonly Y_API_KEY = process.env.Y_API_KEY;
  private readonly ENDPOINT = 'https://api.sms.ir';
  private readonly ENDPOINT2 = 'https://edge.ippanel.com/v1';
  private readonly templateId = Number(process.env.TEMPLATE_ID);

  async sendMessageToUser(phoneNumber: string, message: string) {
    try {
      const response = await fetch(`${this.ENDPOINT2}/api/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.Y_API_KEY!,
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
        throw new InternalServerErrorException(data);
      }

      return data;
    } catch (error: any) {
      throw new InternalServerErrorException({
        statusCode: 500,
        message: error.message || 'خطا در ارسال پیامک',
      });
    }
  }

  async sendOtpCode(userId: number, mobile: string, code: string) {
    await this.prisma.users.update({
      where: { user_id: userId },
      data: {
        code: code,
        codeRequestedAt: new Date(),
      },
    });

    try {
      const response = await fetch(`${this.ENDPOINT}/v1/send/verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/plain',
          'x-api-key': this.X_API_KEY!,
        },
        body: JSON.stringify({
          Mobile: mobile,
          TemplateId: this.templateId,
          Parameters: [{ name: 'Code', value: code }],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new InternalServerErrorException(data);
      }

      return data;
    } catch (error: any) {
      throw new InternalServerErrorException({
        statusCode: 500,
        message: error.message || 'خطا در ارسال پیامک',
      });
    }
  }

  async clearOtp(userId: number): Promise<void> {
    await this.prisma.users.update({
      where: { user_id: userId },
      data: { code: null },
    });
  }
}
