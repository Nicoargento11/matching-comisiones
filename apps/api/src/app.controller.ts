import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Endpoint de health check público
   * @returns Mensaje de saludo del servicio
   */
  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
