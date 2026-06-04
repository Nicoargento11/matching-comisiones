import { Injectable } from '@nestjs/common';
import { SimularMatchingDto } from './dto/simular-matching.dto';
import { IMatchingObserver, MatchingCompletadoData } from './interfaces/matching-observer.interface';

@Injectable()
export class MatchingService {
  private readonly observers: IMatchingObserver[] = [];

  registrarObserver(observer: IMatchingObserver): void {
    this.observers.push(observer);
  }

  private async notificar(data: MatchingCompletadoData): Promise<void> {
    for (const observer of this.observers) {
      await observer.onMatchingCompleted(data);
    }
  }

  async simularMatching(dto: SimularMatchingDto): Promise<void> {
    await this.notificar({ ...dto, intercambioId: Date.now(), completadoEn: new Date() });
  }
}
