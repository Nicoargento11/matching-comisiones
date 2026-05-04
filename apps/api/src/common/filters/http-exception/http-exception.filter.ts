import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

type ErrorResponseBody = {
  message?: string | string[];
  mensaje?: string;
  codigo?: string;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = isHttpException
      ? (exception.getResponse() as string | ErrorResponseBody)
      : undefined;
    const body =
      typeof exceptionResponse === 'object' ? exceptionResponse : null;
    const codigo = body?.codigo;
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (body?.message ?? 'Internal server error');
    response.status(status).json({
      statusCode: status,
      ...(codigo && { codigo }),
      message,
      path: request.originalUrl ?? request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    });
  }
}
