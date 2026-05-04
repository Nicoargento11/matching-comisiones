import { Injectable } from '@nestjs/common';
import {
  NotFoundError,
  BadRequestError,
} from '../../common/errors/business-error';
import { UsuariosRepository } from './repositories/usuarios.repository';
import { PaginacionDto } from '../../common/dto/paginacion.dto';
import {
  construirPaginacion,
  construirMetaPaginacion,
} from '../../common/helpers/paginacion';
import { verificarOExcepcion } from '../../common/helpers/verificar-existencia';

@Injectable()
export class UsuariosService {
  constructor(private readonly usuariosRepository: UsuariosRepository) {}

  /**
   * Obtiene los datos de un estudiante por su ID
   * @param idUsuario - ID del usuario a buscar
   * @returns Datos del usuario con roles
   * @throws NotFoundException si no existe el usuario
   */
  async obtenerEstudiante(idUsuario: number) {
    const estudiante = await this.usuariosRepository.obtenerPorId(idUsuario);
    if (!estudiante) {
      throw new NotFoundError(
        'USUARIO_NO_ENCONTRADO',
        `No existe usuario con id_usuario=${idUsuario}`,
      );
    }
    return estudiante;
  }

  /**
   * Obtiene un usuario por su DNI
   * @param dni - DNI del usuario a buscar
   * @returns Datos del usuario con roles
   * @throws NotFoundException si no existe el usuario
   */
  async obtenerPorDni(dni: number) {
    if (dni < 1000000) {
      throw new BadRequestError(
        'DNI_INVALIDO',
        'El DNI debe tener al menos 7 dígitos',
      );
    }
    const usuario = await this.usuariosRepository.obtenerPorDni(dni);
    if (!usuario) {
      throw new NotFoundError(
        'USUARIO_NO_ENCONTRADO',
        `No existe usuario con DNI=${dni}`,
      );
    }
    return usuario;
  }

  /**
   * Obtiene todos los estudiantes registrados con paginación
   * @param paginacionDto - DTO de paginación con pagina, limite, ordenarPor y direccion
   * @returns Objeto con data (lista de usuarios) y meta (info de paginación)
   */
  async obtenerEstudiantes(paginacionDto: PaginacionDto) {
    const paginacion = construirPaginacion(paginacionDto, [
      'nombre_usuario',
      'apellido_usuario',
      'correo',
      'dni',
    ]);
    const [data, total] = await Promise.all([
      this.usuariosRepository.obtenerTodos(paginacion),
      this.usuariosRepository.contar(),
    ]);
    return { data, meta: construirMetaPaginacion(total, paginacionDto) };
  }

  /**
   * Obtiene el id_usuario del primer estudiante inscrito en una comisión
   * @returns ID del primer estudiante
   * @throws NotFoundException si no hay estudiantes en la base de datos
   */
  async obtenerPrimerEstudianteUsuarioId() {
    const id = await this.usuariosRepository.obtenerPrimerEstudianteUsuarioId();
    if (!id) {
      throw new NotFoundError(
        'USUARIO_NO_ENCONTRADO',
        'No hay estudiantes en la base de datos',
      );
    }
    return id;
  }

  /**
   * Obtiene el id_usuario del primer profesor con comisión asignada
   * @returns ID del primer profesor
   * @throws NotFoundException si no hay profesores en la base de datos
   */
  async obtenerPrimerProfesorUsuarioId() {
    const id = await this.usuariosRepository.obtenerPrimerProfesorUsuarioId();
    if (!id) {
      throw new NotFoundError(
        'USUARIO_NO_ENCONTRADO',
        'No hay profesores en la base de datos',
      );
    }
    return id;
  }

  /**
   * Obtiene las comisiones en las que está inscrito un estudiante
   * @param idUsuario - ID del estudiante
   * @returns Lista de inscripciones con datos de comisión, horarios y eventos
   * @throws NotFoundException si no existe el estudiante
   */
  async obtenerComisionesDeEstudiante(idUsuario: number) {
    await verificarOExcepcion(
      () => this.usuariosRepository.verificarExistencia(idUsuario),
      'estudiante',
      idUsuario,
    );
    return this.usuariosRepository.obtenerComisionesDeEstudiante(idUsuario);
  }

  /**
   * Obtiene las conversaciones de un usuario
   * @param idUsuario - ID del usuario
   * @returns Lista de conversaciones con último mensaje
   * @throws NotFoundException si no existe el usuario
   */
  async obtenerConversaciones(idUsuario: number) {
    await verificarOExcepcion(
      () => this.usuariosRepository.verificarExistencia(idUsuario),
      'usuario',
      idUsuario,
    );
    return this.usuariosRepository.obtenerConversaciones(idUsuario);
  }
}
