import { Body, Controller, Post } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { SimularMatchingDto } from './dto/simular-matching.dto';
import { SimularMatchingResponseDto } from './dto/simular-matching-response.dto';
import { MatchingService } from './matching.service';

@Controller('matching')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post('simular')
  @Roles('profesor', 'admin')
  async ejecutarMatching(@Body() dto: SimularMatchingDto): Promise<SimularMatchingResponseDto> {
    return this.matchingService.ejecutarMatching(dto);
  }
}
