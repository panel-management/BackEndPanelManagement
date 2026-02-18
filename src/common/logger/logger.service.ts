import { ConsoleLogger, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execPromise = promisify(exec);

@Injectable()
export class LoggerService extends ConsoleLogger {
  @Cron('59 23 * * *', { timeZone: 'Asia/Tehran' })
  async handleBackupCron() {
    this.log('شروع فرآیند بک‌آپ‌گیری روزانه', 'BackupSystem');

    const dbUser = process.env.DB_USER;
    const dbName = process.env.DB_NAME;
    const dbPass = process.env.DB_PASS;
    const dbHost = process.env.DB_HOST;
    const dbPort = process.env.DB_PORT;

    const fileName = `backup-${new Date().toISOString().split('T')[0]}.sql.gz`;
    const filePath = path.join(process.cwd(), fileName);

    try {
      await execPromise(
        `PGPASSWORD='${dbPass}' pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} ${dbName} | gzip > ${filePath}`,
      );
      if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
        this.log(`فایل با موفقیت ساخته شد. در حال ارسال به تلگرام...`, 'BackupSystem');
        await this.sendFileToTelegram(filePath, fileName);
        fs.unlinkSync(filePath);
        this.log('بک‌آپ با موفقیت به تلگرام ارسال شد', 'BackupSystem');
      } else {
        throw new Error('فایل بک‌آپ ساخته نشد یا حجم آن صفر است');
      }
    } catch (err) {
      this.error('خطا در عملیات بک‌آپ‌گیری', err.stack, 'BackupSystem');
    } finally {
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          this.log('فایل موقت بک‌آپ برای جلوگیری از پر شدن حافظه پاک شد', 'BackupSystem');
        } catch (cleanupError) {
          this.error('خطا در پاکسازی فایل موقت', cleanupError.stack, 'BackupSystem');
        }
      }
    }
  }

  log(message: any, context?: string) {
    super.log(message, context);
    const systemContexts = [
      'InstanceLoader',
      'RoutesResolver',
      'RouterExplorer',
      'NestFactory',
      'NestApplication',
    ];
    if (context && !systemContexts.includes(context)) {
      this.sendToTelegram(message, context, 'INFO');
    }
  }

  error(message: any, stack?: string, context?: string) {
    super.error(message, stack, context);
    this.sendToTelegram(message, context, 'ERROR', stack);
  }

  private async sendToTelegram(
    message: any,
    context?: string,
    type: 'INFO' | 'ERROR' = 'ERROR',
    stack?: string,
  ) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) return;

    const isError = type === 'ERROR';
    const emoji = isError ? '🚨' : '🔔';
    const title = isError ? `Error in ${context || 'App'}` : `Info from ${context || 'App'}`;

    let formattedMessage = `${emoji} **${title}** ${emoji}\n\n`;
    formattedMessage += `**Message:**\n\`${message}\`\n`;

    if (isError && stack) {
      formattedMessage += `\n**Stack Trace:**\n\`\`\`\n${stack}\n\`\`\``;
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: formattedMessage,
          parse_mode: 'Markdown',
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Telegram API Error: ${response.status} ${response.statusText} - ${errorBody}`,
        );
      }
    } catch (e) {
      console.log(`Failed to send Telegram notification: ${e.message}`);
    }
  }

  private async sendFileToTelegram(filePath: string, fileName: string) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!botToken || !chatId) return;

    const url = `https://api.telegram.org/bot${botToken}/sendDocument`;

    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('caption', `📅 بک‌آپ دیتابیس مورخ: ${new Date().toLocaleDateString('fa-IR')}`);

    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer]);
    formData.append('document', blob, fileName);

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Telegram API Error: ${response.status} ${response.statusText} - ${errorBody}`,
        );
      }
    } catch (e) {
      console.log(`Failed to send Backup file: ${e.message}`);
    }
  }
}
