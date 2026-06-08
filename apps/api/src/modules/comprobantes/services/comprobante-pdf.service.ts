import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer from 'puppeteer-core';
import { construirHtmlComprobante, DatosComprobante } from '../comprobante.template';

@Injectable()
export class ComprobantePdfService {
  constructor(private readonly config: ConfigService) {}

  /**
   * Genera un buffer PDF a partir de los datos del intercambio.
   * Hard-fail: cualquier error se propaga al caller.
   */
  async generarPdf(datos: DatosComprobante): Promise<Buffer> {
    const executablePath = this.config.getOrThrow<string>('CHROME_EXECUTABLE_PATH');

    const browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      const html = construirHtmlComprobante(datos);
      await page.setContent(html, { waitUntil: 'load' });

      const pdfUint8Array = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
      });

      return Buffer.from(pdfUint8Array);
    } finally {
      await browser.close();
    }
  }
}
