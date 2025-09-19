import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

const translations: Record<string, string> = {
  not_found: 'اطلاعات درخواستی شما یافت نشد',
  unauthorized: 'شما مجوز دسترسی به این بخش ندارید لطفا ابتدا وارد شوید',
  forbidden: 'شما دسترسی لازم برای ورود یا انجام این کار ندارید',
  bad_request: 'درخواست شما نامعتبر است',
  conflict: 'درخواست شما با وضعیت موجودیت تداخل دارد',
  too_many_requests: 'تعداد درخواست‌های شما بیش از حد مجاز است',
  internal_error: 'یک خطای داخلی در سرور رخ داده است',
  not_implemented: 'این قابلیت هنوز پیاده‌سازی نشده است',
  service_unavailable: 'سرویس در دسترس نیست، لطفاً بعداً تلاش کنید',
  gateway_timeout: 'درخواست شما به سرور زمان‌ بر بود و تایم‌اوت شد',
};

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception.getStatus?.() ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = exception.getResponse?.();

    let message = 'یک خطای پیش‌ بینی نشده در سرور رخ داده است';

    if (typeof exceptionResponse === 'string') {
      message = translations[exceptionResponse] || exceptionResponse;
    } else if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      (exceptionResponse as any).message
    ) {
      const exceptionMsg = (exceptionResponse as any).message;
      if (Array.isArray(exceptionMsg)) {
        message = exceptionMsg.join(', ');
      } else {
        message = translations[exceptionMsg] || exceptionMsg;
      }
    }

    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        if (message === 'Unauthorized') {
          message = translations['unauthorized'];
        }
        break;

      case HttpStatus.FORBIDDEN:
        if (message === 'Forbidden' || message === 'Forbidden resource') {
          message = translations['forbidden'];
        }
        break;

      case HttpStatus.NOT_FOUND:
        if (message.startsWith('Cannot GET')) {
          message = translations['not_found'];
        }
        break;

      case HttpStatus.BAD_REQUEST:
        if (message === 'Bad Request') {
          message = translations['bad_request'];
        }
        break;

      case HttpStatus.CONFLICT:
        if (message === 'Conflict') {
          message = translations['conflict'];
        }
        break;

      case HttpStatus.TOO_MANY_REQUESTS:
        if (message === 'Too Many Requests') {
          message = translations['too_many_requests'];
        }
        break;

      case HttpStatus.INTERNAL_SERVER_ERROR:
        if (message === 'Internal Server Error') {
          message = translations['internal_error'];
        }
        break;

      case HttpStatus.NOT_IMPLEMENTED:
        if (message === 'Not Implemented') {
          message = translations['not_implemented'];
        }
        break;

      case HttpStatus.SERVICE_UNAVAILABLE:
        if (message === 'Service Unavailable') {
          message = translations['service_unavailable'];
        }
        break;

      case HttpStatus.GATEWAY_TIMEOUT:
        if (message === 'Gateway Timeout') {
          message = translations['gateway_timeout'];
        }
        break;
    }

    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}
