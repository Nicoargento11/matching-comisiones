export interface MatchingCompletadoData {
  intercambioId: number;
  usuarioSolicitanteId: number;
  usuarioReceptorId: number;
  comisionOrigenId: number;
  comisionDestinoId: number;
  completadoEn: Date;
}

export interface IMatchingObserver {
  onMatchingCompleted(data: MatchingCompletadoData): Promise<void>;
}
