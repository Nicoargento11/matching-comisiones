import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MensajesService } from './mensajes.service';
import { CreateMensajeDto } from './dto/create-mensaje.dto';
import { CreateConversacionDto } from './dto/create-conversacion.dto';
import { MarcarLeidoDto } from './dto/marcar-leido.dto';

@ApiTags('Mensajes')
@Controller()
export class MensajesController {
  constructor(private readonly mensajesService: MensajesService) {}

  @Post('conversaciones')
  @ApiOperation({ summary: 'Crear una conversación entre dos usuarios' })
  @ApiBody({ type: CreateConversacionDto })
  @ApiResponse({ status: 201, description: 'Conversación creada' })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una conversación entre estos usuarios',
  })
  crearConversacion(@Body() dto: CreateConversacionDto) {
    return this.mensajesService.crearConversacion(dto);
  }

  @Get('conversaciones/:id_conversacion')
  @ApiOperation({
    summary: 'Obtener detalle de una conversación con sus mensajes',
  })
  @ApiParam({ name: 'id_conversacion', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Conversación con participantes y mensajes',
  })
  @ApiResponse({ status: 404, description: 'Conversación no encontrada' })
  obtenerConversacion(
    @Param('id_conversacion', ParseIntPipe) idConversacion: number,
  ) {
    return this.mensajesService.obtenerConversacion(idConversacion);
  }

  @Patch('conversaciones/:id_conversacion/leido')
  @ApiOperation({ summary: 'Marcar mensajes como leídos' })
  @ApiParam({ name: 'id_conversacion', type: Number })
  @ApiBody({ type: MarcarLeidoDto })
  @ApiResponse({ status: 200, description: 'Último leído actualizado' })
  @ApiResponse({
    status: 404,
    description: 'Participante no encontrado en la conversación',
  })
  marcarLeido(
    @Param('id_conversacion', ParseIntPipe) idConversacion: number,
    @Body() dto: MarcarLeidoDto,
  ) {
    return this.mensajesService.marcarLeido(idConversacion, dto);
  }

  @Get('mensajes/:id_conversacion')
  @ApiOperation({ summary: 'Obtener mensajes de una conversación' })
  @ApiParam({ name: 'id_conversacion', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Lista de mensajes ordenados por fecha',
  })
  @ApiResponse({ status: 404, description: 'Conversación no encontrada' })
  getMensajes(@Param('id_conversacion', ParseIntPipe) idConversacion: number) {
    return this.mensajesService.obtenerMensajes(idConversacion);
  }

  @Post('mensajes')
  @ApiOperation({ summary: 'Enviar un mensaje' })
  @ApiBody({ type: CreateMensajeDto })
  @ApiResponse({ status: 201, description: 'Mensaje enviado' })
  @ApiResponse({ status: 404, description: 'Conversación no encontrada' })
  enviarMensaje(@Body() dto: CreateMensajeDto) {
    return this.mensajesService.enviarMensaje(dto);
  }
}
