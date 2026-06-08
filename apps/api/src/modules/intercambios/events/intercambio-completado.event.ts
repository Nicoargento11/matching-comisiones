/**
 * Evento de dominio rico emitido por `IntercambiosService.completar` una vez que
 * la transacción atómica (`completarAtomico`) confirma el cambio de estado y el
 * intercambio de comisiones.
 *
 * Espeja EXACTAMENTE el shape que `IntercambiosRepository.obtenerDatosCompletos`
 * ya retorna (usuario + comisión + profesor para `ofrece` y `destino`), de modo
 * que los observers consuman datos ya obtenidos sin re-consultar repositorios de
 * usuarios/comisiones/profesores.
 *
 * No incluye `id_estado`: ya no es relevante una vez completada la transacción.
 */
export interface IntercambioCompletadoEvent {
  readonly id_intercambio: number;
  readonly id_comision_ofrece: number;
  readonly id_comision_destino: number;
  readonly completadoEn: Date;
  readonly ofrece: IntercambioCompletadoParticipante;
  readonly destino: IntercambioCompletadoParticipante;
}

export interface IntercambioCompletadoParticipante {
  readonly usuario: {
    readonly id_usuario: number;
    readonly nombre_usuario: string;
    readonly apellido_usuario: string;
    readonly dni: number;
    readonly correo: string;
  };
  readonly comision: {
    readonly id_comision: number;
    readonly nombre_comision: string | null;
    readonly numero_comision: number | null;
    readonly profesor: {
      readonly id_usuario: number;
      readonly nombre_usuario: string;
      readonly apellido_usuario: string;
      readonly correo: string;
    };
  };
}
