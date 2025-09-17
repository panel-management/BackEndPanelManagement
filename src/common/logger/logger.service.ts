import { ConsoleLogger, Injectable } from '@nestjs/common';

@Injectable()
export class LoggerService extends ConsoleLogger {
  error(message: any, stack?: string, context?: string) {
    super.error(message, stack, context);
    this.sendToTelegram(message, stack, context);
  }

  private async sendToTelegram(message: any, stack?: string, context?: string) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.log('Telegram bot token or chat ID is not configured.');
      return;
    }

    const formattedMessage = `
🚨 **An Error Occurred in ${context || 'Application'}** 🚨

**Message:**
\`\`\`
${message}
\`\`\`

**Stack Trace:**
\`\`\`
${stack || 'No stack trace available.'}
\`\`\`
    `;

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const payload = {
      chat_id: chatId,
      text: formattedMessage,
      parse_mode: 'Markdown',
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Telegram API Error: ${response.status} ${response.statusText} - ${errorBody}`,
        );
      }
    } catch (error) {
      super.error(
        'Failed to send log to Telegram',
        error.stack,
        'LoggerService',
      );
    }
  }
}
