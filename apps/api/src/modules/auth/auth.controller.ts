import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  CurrentUser,
  CurrentUserClaims,
} from '../../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Obtiene los datos del usuario autenticado a partir del token JWT
   * @param user - Claims del usuario extraídos del token JWT
   * @returns Datos del usuario autenticado
   * @throws NotFoundException si no existe el usuario
   */
  @Get('me')
  @ApiOperation({ summary: 'Obtener el usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Datos del usuario autenticado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  obtenerMe(@CurrentUser() user: CurrentUserClaims) {
    return this.authService.obtenerMe(user.sub);
  }
}
