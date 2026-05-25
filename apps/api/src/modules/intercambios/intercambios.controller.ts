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
import { IntercambiosService } from './intercambios.service';
import { CreateIntercambioDto } from './dto/create-intercambio.dto';
import {
  CurrentUser,
  CurrentUserClaims,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Intercambios')
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
   * Obtiene el detalle de un intercambio por ID
   * @param idIntercambio - ID del intercambio
   * @returns El intercambio con sus relaciones
   */
  @Get(':id_intercambio')
  @ApiOperation({ summary: 'Obtener un intercambio por ID' })
  @ApiParam({ name: 'id_intercambio', type: Number })
  @ApiResponse({ status: 200, description: 'Detalle del intercambio' })
  @ApiResponse({ status: 404, description: 'Intercambio no encontrado' })
  obtenerPorId(@Param('id_intercambio', ParseIntPipe) idIntercambio: number) {
    return this.intercambiosService.obtenerPorId(idIntercambio);
  }

  /**
   * Crea un nuevo intercambio en estado PENDIENTE
   * @param dto - Datos del intercambio (IDs de usuarios y comisiones)
   * @returns El intercambio creado
   */
  @Post()
  @ApiOperation({ summary: 'Crear un intercambio de comisión' })
  @ApiBody({ type: CreateIntercambioDto })
  @ApiResponse({ status: 201, description: 'Intercambio creado en estado PENDIENTE' })
  @ApiResponse({ status: 400, description: 'Inscripciones inactivas' })
  @ApiResponse({ status: 409, description: 'Ya existe un intercambio pendiente' })
  crear(@Body() dto: CreateIntercambioDto) {
    return this.intercambiosService.crear(dto);
  }

  /**
   * Completa un intercambio de forma atómica (solo profesores)
   * @param idIntercambio - ID del intercambio a completar
   */
  @Patch(':id_intercambio/completar')
  @Roles('profesor')
  @ApiOperation({ summary: 'Completar un intercambio (solo profesores)' })
  @ApiParam({ name: 'id_intercambio', type: Number })
  @ApiResponse({ status: 200, description: 'Intercambio completado' })
  @ApiResponse({ status: 404, description: 'Intercambio no encontrado' })
  @ApiResponse({ status: 409, description: 'Intercambio no está en estado PENDIENTE' })
  completar(@Param('id_intercambio', ParseIntPipe) idIntercambio: number) {
    return this.intercambiosService.completar(idIntercambio);
  }
}
