import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Interceptor que loguea método HTTP + ruta + statusCode + duración de cada request.
 * No loguea cuerpo de request/respuesta para evitar leak de contrasena (RNF-11/R6.3).
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const duration = Date.now() - now;
          this.logger.log(`[${method} ${url}] ${statusCode} ${duration}ms`);
        },
        error: (error) => {
          const duration = Date.now() - now;
          const statusCode = error.status ?? 500;
          this.logger.error(
            `[${method} ${url}] ${statusCode} ${duration}ms - ${error.message}`,
          );
        },
      }),
    );
  }
}
