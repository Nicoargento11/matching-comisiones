import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { MensajesService } from './mensajes.service';
import { CreateMensajeDto } from './dto/create-mensaje.dto';

@Controller()
export class MensajesController {
  constructor(private readonly mensajesService: MensajesService) {}

  @Get('mensajes/:id_conversacion')
  getMensajes(@Param('id_conversacion', ParseIntPipe) idConversacion: number) {
    return this.mensajesService.obtenerMensajes(idConversacion);
  }

  @Post('mensajes')
  enviarMensaje(@Body() dto: CreateMensajeDto) {
    return this.mensajesService.enviarMensaje(dto);
  }
}
