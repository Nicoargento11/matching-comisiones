import { Body, Controller, Post } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { SimularMatchingDto } from './dto/simular-matching.dto';
import { MatchingService } from './matching.service';

@Controller('matching')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post('simular')
  @Roles('profesor', 'admin')
  async simularMatching(@Body() dto: SimularMatchingDto) {
    await this.matchingService.simularMatching(dto);
    return { message: 'Matching simulado correctamente' };
  }
}
