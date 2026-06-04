import { api } from './api';

interface SimularMatchingBody {
  usuarioSolicitanteId: number;
  usuarioReceptorId: number;
  comisionOrigenId: number;
  comisionDestinoId: number;
}

interface SimularMatchingResponse {
  message: string;
}

export const matchingServicio = {
  simular: (body: SimularMatchingBody, token?: string): Promise<SimularMatchingResponse> =>
    api.post('/matching/simular', body, token),
};
