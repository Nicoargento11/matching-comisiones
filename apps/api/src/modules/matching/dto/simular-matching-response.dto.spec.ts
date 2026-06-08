import { plainToInstance } from 'class-transformer';
import { SimularMatchingResponseDto } from './simular-matching-response.dto';

describe('SimularMatchingResponseDto', () => {
  it('expone únicamente id_intercambio, estado, comprobante_url y mensaje', () => {
    const dto = plainToInstance(SimularMatchingResponseDto, {
      id_intercambio: 10,
      estado: 'COMPLETADO',
      comprobante_url: 'https://cdn.example.com/10.pdf',
      mensaje: 'Matching simulado correctamente',
      campoOculto: 'no debería aparecer',
    });

    expect(dto).toEqual({
      id_intercambio: 10,
      estado: 'COMPLETADO',
      comprobante_url: 'https://cdn.example.com/10.pdf',
      mensaje: 'Matching simulado correctamente',
    });
    expect((dto as unknown as { campoOculto?: unknown }).campoOculto).toBeUndefined();
  });
});
