import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SmsServiceService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly X_API_KEY = process.env.X_API_KEY;
  private readonly ENDPOINT = 'https://api.sms.ir';
  private readonly templateId = Number(process.env.TEMPLATE_ID);

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
          ACCEPT: 'application/json',
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
      throw new InternalServerErrorException(
        error.message || 'خطا در ارسال پیامک',
      );
    }
  }

  async clearOtp(userId: number): Promise<void> {
    await this.prisma.users.update({
      where: { user_id: userId },
      data: { code: null },
    });
  }
}
