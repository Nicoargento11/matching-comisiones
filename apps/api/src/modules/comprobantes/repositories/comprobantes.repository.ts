import { Injectable } from '@nestjs/common';
import { Comprobante } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export abstract class ComprobantesRepository {
  abstract crear(idIntercambio: number, archivoPdfUrl: string): Promise<Comprobante>;
}

@Injectable()
export class PrismaComprobantesRepository extends ComprobantesRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * Persiste un comprobante asociado al intercambio.
   * Lanza un error si ya existe un comprobante para ese intercambio (unique constraint).
   */
  async crear(idIntercambio: number, archivoPdfUrl: string): Promise<Comprobante> {
    return this.prisma.comprobante.create({
      data: {
        id_intercambio: idIntercambio,
        archivo_pdf_url: archivoPdfUrl,
      },
    });
  }
}
