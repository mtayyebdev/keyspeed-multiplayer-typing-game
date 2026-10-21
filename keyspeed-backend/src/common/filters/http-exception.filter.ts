import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: any = 'Internal server error';

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (status === HttpStatus.TOO_MANY_REQUESTS) {
        message = 'Too many requests. Please slow down and wait a moment before trying again.';
      } else {
        message = typeof res === 'object' && (res as any).message ? (res as any).message : res;
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled Internal Error: ${exception.message}`, exception.stack);
      message = 'An unexpected internal error occurred. Please try again later.';
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request?.url,
      message,
    });
  }
}

