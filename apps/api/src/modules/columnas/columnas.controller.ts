import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CurrentUser, CurrentUserClaims } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ColumnasService } from './columnas.service';
import { CrearColumnaDto } from './dto/crear-columna.dto';

@Controller('columnas')
@Roles('estudiante')
export class ColumnasController {
  constructor(private readonly columnasService: ColumnasService) {}

  @Get()
  obtenerMias(@CurrentUser() user: CurrentUserClaims) {
    return this.columnasService.obtenerParaUsuario(user.id_usuario!);
  }

  @Post()
  crearColumna(@Body() datosColumna: CrearColumnaDto, @CurrentUser() user: CurrentUserClaims) {
    return this.columnasService.crearColumna(user.id_usuario!, datosColumna);
  }

  @Delete(':id')
  @HttpCode(204)
  async eliminarColumna(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserClaims,
  ) {
    await this.columnasService.eliminarColumna(id, user.id_usuario!);
  }
}
