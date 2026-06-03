import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class DniParsePipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const dni = parseInt(value, 10);
    if (isNaN(dni) || dni < 1_000_000 || dni > 99_999_999) {
      throw new BadRequestException('DNI inválido: debe ser un número de 7 u 8 dígitos');
    }
    return dni;
  }
}
