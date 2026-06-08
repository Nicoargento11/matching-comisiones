import { Module } from '@nestjs/common';
import { IntercambiosModule } from '../intercambios/intercambios.module';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';

@Module({
  imports: [IntercambiosModule],
  controllers: [MatchingController],
  providers: [MatchingService],
})
export class MatchingModule {}
