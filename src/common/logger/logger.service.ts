import { ConsoleLogger, Injectable } from '@nestjs/common';

@Injectable()
export class LoggerService extends ConsoleLogger {
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
}
