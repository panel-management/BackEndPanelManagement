import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = exception.getResponse
      ? exception.getResponse()
      : null;

    let message = 'یک خطای پیش بینی نشده در سرور رخ داده است';

    if (exceptionResponse && typeof exceptionResponse === 'object') {
      message = (exceptionResponse as any).message || message;
    } else if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    }

    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        if (message === 'Unauthorized') {
          message = 'شما مجوز دسترسی به این بخش ندارید لطفا ابتدا وارد شوید';
        }
        break;

      case HttpStatus.FORBIDDEN:
        if (message === 'Forbidden' || message === 'Forbidden resource') {
          message = 'شما دسترسی لازم برای ورود یا انجام این کار ندارید';
        }
        break;

      case HttpStatus.NOT_FOUND:
        if (message.startsWith('Cannot GET')) {
          message = 'مسیر درخواستی شما یافت نشد';
        }
        break;

      case HttpStatus.BAD_REQUEST:
        if (message === 'Bad Request') {
          message = 'درخواست شما نامعتبر است';
        }
        break;

      case HttpStatus.CONFLICT:
        if (message === 'Conflict') {
          message = 'درخواست شما با وضعیت موجودیت تداخل دارد';
        }
        break;

      case HttpStatus.TOO_MANY_REQUESTS:
        if (message === 'Too Many Requests') {
          message = 'تعداد درخواست‌های شما بیش از حد مجاز است';
        }
        break;

      case HttpStatus.INTERNAL_SERVER_ERROR:
        if (message === 'Internal Server Error') {
          message = 'یک خطای داخلی در سرور رخ داده است';
        }
        break;

      case HttpStatus.NOT_IMPLEMENTED:
        if (message === 'Not Implemented') {
          message = 'این قابلیت هنوز پیاده‌سازی نشده است';
        }
        break;

      case HttpStatus.SERVICE_UNAVAILABLE:
        if (message === 'Service Unavailable') {
          message = 'سرویس در دسترس نیست، لطفاً بعداً تلاش کنید';
        }
        break;

      case HttpStatus.GATEWAY_TIMEOUT:
        if (message === 'Gateway Timeout') {
          message = 'درخواست شما به سرور زمان‌بر بود و تایم‌اوت شد';
        }
        break;
    }

    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}
