import { Injectable } from '@nestjs/common';
import {
  NotFoundError,
  ConflictError,
} from '../../common/errors/business-error';
import { MensajesRepository } from './repositories/mensajes.repository';
import { CreateMensajeDto } from './dto/create-mensaje.dto';
import { CreateConversacionDto } from './dto/create-conversacion.dto';
import { MarcarLeidoDto } from './dto/marcar-leido.dto';
import { PaginacionDto } from '../../common/dto/paginacion.dto';
import {
  construirPaginacion,
  construirMetaPaginacion,
} from '../../common/helpers/paginacion';
import { verificarOExcepcion } from '../../common/helpers/verificar-existencia';
import { mapearConversacionResponse } from './mensajes.mapper';

@Injectable()
export class MensajesService {
  constructor(private readonly mensajesRepository: MensajesRepository) {}

  /**
   * Crea una nueva conversación entre dos usuarios
   * @param dto - Datos con los IDs de los dos participantes
   * @returns La conversación creada
   * @throws ConflictException si ya existe una conversación entre esos usuarios
   */
  async crearConversacion(dto: CreateConversacionDto) {
    const existente = await this.mensajesRepository.buscarConversacionExistente(
      dto.id_usuario_1,
      dto.id_usuario_2,
    );
    if (existente) {
      throw new ConflictError(
        'CONVERSACION_YA_EXISTE',
        'Ya existe una conversación entre estos usuarios',
      );
    }
    return this.mensajesRepository.crearConversacion(dto);
  }

  /**
   * Obtiene una conversación con sus participantes y mensajes
   * @param idConversacion - ID de la conversación
   * @returns La conversación completa
   * @throws NotFoundException si no existe la conversación
   */
  async obtenerConversacion(idConversacion: number) {
    const conversacion =
      await this.mensajesRepository.obtenerConversacion(idConversacion);
    if (!conversacion) {
      throw new NotFoundError(
        'CONVERSACION_NO_ENCONTRADA',
        `No existe conversación con id=${idConversacion}`,
      );
    }
    return mapearConversacionResponse(conversacion);
  }

  /**
   * Marca los mensajes de una conversación como leídos para un usuario
   * @param idConversacion - ID de la conversación
   * @param dto - Datos con el ID del usuario
   * @returns El participante con la fecha de último leído actualizada
   * @throws NotFoundException si el usuario no pertenece a la conversación
   */
  async marcarLeido(idConversacion: number, dto: MarcarLeidoDto) {
    const participante = await this.mensajesRepository.buscarParticipante(
      idConversacion,
      dto.id_usuario,
    );
    if (!participante) {
      throw new NotFoundError(
        'CONVERSACION_PARTICIPANTE_NO_ENCONTRADO',
        'El usuario no pertenece a esta conversación',
      );
    }
    return this.mensajesRepository.actualizarUltimoLeido(
      idConversacion,
      dto.id_usuario,
    );
  }

  /**
   * Obtiene los mensajes de una conversación ordenados por fecha
   * @param idConversacion - ID de la conversación
   * @returns Lista de mensajes con datos del emisor
   * @throws NotFoundException si no existe la conversación
   */
  async obtenerMensajes(idConversacion: number) {
    await verificarOExcepcion(
      () =>
        this.mensajesRepository.verificarExistenciaConversacion(idConversacion),
      'conversación',
      idConversacion,
    );
    return this.mensajesRepository.obtenerMensajes(idConversacion);
  }

  /**
   * Obtiene las conversaciones del usuario autenticado con paginación
   * @param supabaseAuthId - ID de autenticación de Supabase del usuario
   * @param paginacionDto - DTO de paginación con pagina, limite, ordenarPor y direccion
   * @returns Objeto con data (lista de conversaciones) y meta (info de paginación)
   * @throws NotFoundException si no existe el usuario
   */
  async obtenerMisConversaciones(
    supabaseAuthId: string,
    paginacionDto: PaginacionDto,
  ) {
    const usuario =
      await this.mensajesRepository.buscarUsuarioPorAuthId(supabaseAuthId);
    if (!usuario) {
      throw new NotFoundError('USUARIO_NO_ENCONTRADO', 'Usuario no encontrado');
    }
    const paginacion = construirPaginacion(paginacionDto, ['creado_en']);
    const [data, total] = await Promise.all([
      this.mensajesRepository.obtenerConversacionesDeUsuario(
        usuario.id_usuario,
        paginacion,
      ),
      this.mensajesRepository.contarConversacionesDeUsuario(usuario.id_usuario),
    ]);
    return { data, meta: construirMetaPaginacion(total, paginacionDto) };
  }

  /**
   * Envía un mensaje en una conversación
   * @param dto - Datos del mensaje a enviar
   * @returns El mensaje creado
   * @throws NotFoundException si no existe la conversación
   */
  async enviarMensaje(dto: CreateMensajeDto) {
    const conversacion =
      await this.mensajesRepository.verificarExistenciaConversacion(
        dto.id_conversacion,
      );
    if (!conversacion) {
      throw new NotFoundError(
        'CONVERSACION_NO_ENCONTRADA',
        `No existe conversación con id=${dto.id_conversacion}`,
      );
    }
    return this.mensajesRepository.crearMensaje(dto);
  }
}
