import { Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  CurrentUser,
  CurrentUserClaims,
} from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  getMe(@CurrentUser() user: CurrentUserClaims) {
    return this.authService.getMe(user.sub);
  }
}
