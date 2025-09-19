import {
  Injectable,
  NestMiddleware,
  HttpException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AllExceptionsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    try {
      next();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'یک خطای داخلی در سرور رخ داده است',
      );
    }
  }
}
