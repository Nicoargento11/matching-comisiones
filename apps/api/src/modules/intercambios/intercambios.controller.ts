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
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IntercambiosService } from './intercambios.service';
import { CrearIntercambioDto } from './dto/crear-intercambio.dto';
import { CandidatosIntercambioDto } from './dto/candidatos-intercambio.dto';
import {
  CurrentUser,
  CurrentUserClaims,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Intercambios')
@ApiBearerAuth()
@Controller('intercambios')
export class IntercambiosController {
  constructor(private readonly intercambiosService: IntercambiosService) {}

  /**
   * Obtiene los intercambios del usuario autenticado
   * @param user - Claims del usuario autenticado extraídos del JWT
   * @returns Lista de intercambios del usuario
   */
  @Get('mios')
  @ApiOperation({ summary: 'Obtener intercambios del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de intercambios del usuario' })
  obtenerMios(@CurrentUser() user: CurrentUserClaims) {
    return this.intercambiosService.obtenerPorUsuario(user.id_usuario!);
  }

  /**
   * Busca candidatos válidos para intercambiar con el solicitante
   * @param datosBusqueda - Comisión origen y usuario solicitante (se excluye de los resultados)
   * @returns Lista de candidatos con su comisión actual
   */
  @Get('candidatos')
  @ApiOperation({ summary: 'Buscar candidatos válidos para un intercambio' })
  @ApiQuery({ name: 'id_comision_origen', required: true, type: Number })
  @ApiQuery({ name: 'id_usuario_solicitante', required: true, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de candidatos con su comisión actual' })
  @ApiResponse({ status: 404, description: 'La comisión origen no existe' })
  obtenerCandidatos(@Query() datosBusqueda: CandidatosIntercambioDto) {
    return this.intercambiosService.obtenerCandidatos(datosBusqueda);
  }

  /**
   * Obtiene el detalle de un intercambio por ID
   * @param idIntercambio - ID del intercambio
   * @returns El intercambio con sus relaciones
   */
  @Get(':id_intercambio')
  @Roles('estudiante', 'profesor')
  @ApiOperation({ summary: 'Obtener un intercambio por ID' })
  @ApiParam({ name: 'id_intercambio', type: Number })
  @ApiResponse({ status: 200, description: 'Detalle del intercambio' })
  @ApiResponse({ status: 404, description: 'Intercambio no encontrado' })
  obtenerPorId(@Param('id_intercambio', ParseIntPipe) idIntercambio: number) {
    return this.intercambiosService.obtenerPorId(idIntercambio);
  }

  /**
   * Crea un nuevo intercambio en estado PENDIENTE
   * @param datos - Datos del intercambio (IDs de usuarios y comisiones)
   * @returns El intercambio creado
   */
  @Post()
  @Roles('estudiante', 'profesor')
  @ApiOperation({ summary: 'Crear un intercambio de comisión' })
  @ApiBody({ type: CrearIntercambioDto })
  @ApiResponse({ status: 201, description: 'Intercambio creado en estado PENDIENTE' })
  @ApiResponse({ status: 400, description: 'Inscripciones inactivas' })
  @ApiResponse({ status: 409, description: 'Ya existe un intercambio pendiente' })
  crearIntercambio(@Body() datosIntercambio: CrearIntercambioDto) {
    return this.intercambiosService.crearIntercambio(datosIntercambio);
  }

  /**
   * Completa un intercambio de forma atómica (solo profesores)
   * @param idIntercambio - ID del intercambio a completar
   * @returns `{ id_intercambio, comprobante_url }` — la URL del comprobante generado
   *   por el observer crítico (`ComprobanteObserver`), para que el cliente pueda
   *   enlazarlo directamente sin hacer un fetch adicional
   */
  @Patch(':id_intercambio/completar')
  @Roles('profesor')
  @ApiOperation({ summary: 'Completar un intercambio (solo profesores)' })
  @ApiParam({ name: 'id_intercambio', type: Number })
  @ApiResponse({ status: 200, description: 'Intercambio completado: { id_intercambio, comprobante_url }' })
  @ApiResponse({ status: 404, description: 'Intercambio no encontrado' })
  @ApiResponse({ status: 409, description: 'Intercambio no está en estado PENDIENTE' })
  completar(@Param('id_intercambio', ParseIntPipe) idIntercambio: number) {
    return this.intercambiosService.completar(idIntercambio);
  }
}
