import { api } from './api';

interface SimularMatchingBody {
  usuarioSolicitanteId: number;
  usuarioReceptorId: number;
  comisionOrigenId: number;
  comisionDestinoId: number;
}

interface SimularMatchingResponse {
  id_intercambio: number;
  estado: string;
  comprobante_url: string;
  mensaje: string;
}

export interface CandidatoIntercambio {
  usuario: {
    id_usuario: number;
    nombre_usuario: string;
    apellido_usuario: string;
    dni: number;
  };
  comision: {
    id_comision: number;
    numero_comision: number | null;
    nombre_comision: string | null;
  };
}

export const matchingServicio = {
  simular: (body: SimularMatchingBody, token?: string): Promise<SimularMatchingResponse> =>
    api.post('/matching/simular', body, token),

  obtenerCandidatos: (
    idComisionOrigen: number,
    idUsuarioSolicitante: number,
    token?: string,
  ): Promise<CandidatoIntercambio[]> => {
    const params = new URLSearchParams({
      id_comision_origen: String(idComisionOrigen),
      id_usuario_solicitante: String(idUsuarioSolicitante),
    });
    return api.get<CandidatoIntercambio[]>(`/intercambios/candidatos?${params.toString()}`, token);
  },
};
