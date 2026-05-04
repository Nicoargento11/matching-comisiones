import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MensajesService } from './mensajes.service';
import { CreateMensajeDto } from './dto/create-mensaje.dto';
import { CreateConversacionDto } from './dto/create-conversacion.dto';
import { MarcarLeidoDto } from './dto/marcar-leido.dto';
import {
  CurrentUser,
  CurrentUserClaims,
} from '../../common/decorators/current-user.decorator';
import { PaginacionDto } from '../../common/dto/paginacion.dto';

@ApiTags('Mensajes')
@Controller()
export class MensajesController {
  constructor(private readonly mensajesService: MensajesService) {}

  /**
   * Crea una nueva conversación entre dos usuarios
   * @param dto - Datos de la conversación a crear (IDs de los participantes)
   * @returns Conversación creada con sus participantes
   * @throws ConflictException si ya existe una conversación entre estos usuarios
   */
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

  /**
   * Obtiene las conversaciones del usuario autenticado con paginación
   * @param user - Claims del usuario autenticado extraídos del token JWT
   * @param paginacionDto - Parámetros de paginación (página, límite, orden)
   * @returns Lista paginada de conversaciones con último mensaje
   */
  @Get('conversaciones/mis-conversaciones')
  @ApiOperation({ summary: 'Obtener conversaciones del usuario autenticado' })
  @ApiQuery({ name: 'pagina', required: false, type: Number })
  @ApiQuery({ name: 'limite', required: false, type: Number })
  @ApiQuery({ name: 'ordenarPor', required: false, type: String })
  @ApiQuery({ name: 'direccion', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de conversaciones con último mensaje',
  })
  obtenerMisConversaciones(
    @CurrentUser() user: CurrentUserClaims,
    @Query() paginacionDto: PaginacionDto,
  ) {
    return this.mensajesService.obtenerMisConversaciones(
      user.sub,
      paginacionDto,
    );
  }

  /**
   * Obtiene el detalle de una conversación con sus mensajes
   * @param idConversacion - ID de la conversación
   * @returns Conversación con participantes y mensajes
   * @throws NotFoundException si no existe la conversación
   */
  @Get('conversaciones/:id_conversacion')
  @ApiOperation({
    summary: 'Obtener detalle de una conversación con sus mensajes',
  })
  @ApiParam({ name: 'id_conversacion', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Conversación con participantes y mensajes',
  })
  @ApiResponse({ status: 404, description: 'Conversión no encontrada' })
  obtenerConversacion(
    @Param('id_conversacion', ParseIntPipe) idConversacion: number,
  ) {
    return this.mensajesService.obtenerConversacion(idConversacion);
  }

  /**
   * Marca los mensajes de una conversación como leídos
   * @param idConversacion - ID de la conversación
   * @param dto - Datos del último mensaje leído
   * @returns Último leído actualizado
   * @throws NotFoundException si no existe el participante en la conversación
   */
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

  /**
   * Obtiene los mensajes de una conversación
   * @param idConversacion - ID de la conversación
   * @returns Lista de mensajes ordenados por fecha
   * @throws NotFoundException si no existe la conversación
   */
  @Get('mensajes/:id_conversacion')
  @ApiOperation({ summary: 'Obtener mensajes de una conversación' })
  @ApiParam({ name: 'id_conversacion', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Lista de mensajes ordenados por fecha',
  })
  @ApiResponse({ status: 404, description: 'Conversación no encontrada' })
  obtenerMensajes(
    @Param('id_conversacion', ParseIntPipe) idConversacion: number,
  ) {
    return this.mensajesService.obtenerMensajes(idConversacion);
  }

  /**
   * Envía un mensaje en una conversación
   * @param dto - Datos del mensaje a enviar (conversación, remitente, contenido)
   * @returns Mensaje enviado
   * @throws NotFoundException si no existe la conversación
   */
  @Post('mensajes')
  @ApiOperation({ summary: 'Enviar un mensaje' })
  @ApiBody({ type: CreateMensajeDto })
  @ApiResponse({ status: 201, description: 'Mensaje enviado' })
  @ApiResponse({ status: 404, description: 'Conversación no encontrada' })
  enviarMensaje(@Body() dto: CreateMensajeDto) {
    return this.mensajesService.enviarMensaje(dto);
  }
}
