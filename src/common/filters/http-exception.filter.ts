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
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = 'یک خطای پیش بینی نشده در سرور رخ داده است';

    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        message = 'شما مجوز درسترسی به این بخش ندارید لطفا ابتدا وارد شوید';
        break;
      case HttpStatus.FORBIDDEN:
        message = 'شما دسترسی لازم برای ورود یا انجام این کار ندارید';
        break;
      case HttpStatus.NOT_FOUND:
        message = 'مسیر یا منبع درخواستی شما یافت نشد';
        break;
      case HttpStatus.BAD_REQUEST:
        message =
          (exceptionResponse as any).message || 'درخواست شما نامعتبر است';
        break;
      default:
        if (typeof exceptionResponse === 'string') {
          message = exceptionResponse;
        } else if (
          typeof exceptionResponse === 'object' &&
          exceptionResponse !== null
        ) {
          message = (exceptionResponse as any).message || message;
        }
        break;
    }

    response.status(status).json({
      statusCode: status,
      message: message,
    });
  }
}
