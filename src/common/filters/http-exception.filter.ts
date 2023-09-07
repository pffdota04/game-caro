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
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    const status = exception.getStatus();
    const response = exception.getResponse() as any;

    let message = exception.message;
    if (Array.isArray(response.message) && response.message.length > 0) {
      message = response.message[0];
    }

    res.status(HttpStatus.OK).json({
      status: {
        success: false,
        code: status,
        message: message,
      },
    });
  }
}
