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
import { CreateColumnaDto } from './dto/create-columna.dto';

@Controller('columnas')
@Roles('estudiante')
export class ColumnasController {
  constructor(private readonly columnasService: ColumnasService) {}

  @Get()
  obtenerMias(@CurrentUser() user: CurrentUserClaims) {
    return this.columnasService.obtenerParaUsuario(user.id_usuario!);
  }

  @Post()
  crear(@Body() dto: CreateColumnaDto, @CurrentUser() user: CurrentUserClaims) {
    return this.columnasService.crear(user.id_usuario!, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async eliminar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserClaims,
  ) {
    await this.columnasService.eliminar(id, user.id_usuario!);
  }
}
