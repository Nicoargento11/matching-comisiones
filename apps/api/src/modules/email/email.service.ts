import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { DatosComprobante } from '../comprobantes/comprobante.template';

@Injectable()
export class EmailService {
  private readonly transport: nodemailer.Transporter;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.from = this.config.getOrThrow<string>('SMTP_FROM');
    this.transport = nodemailer.createTransport({
      host: this.config.getOrThrow<string>('SMTP_HOST'),
      port: this.config.get<number>('SMTP_PORT') ?? 587,
      secure: this.config.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.config.getOrThrow<string>('SMTP_USER'),
        pass: this.config.getOrThrow<string>('SMTP_PASSWORD'),
      },
    });
  }

  /**
   * Envía el comprobante PDF adjunto al alumno.
   * El caller es responsable del manejo de errores (soft-fail).
   */
  async enviarComprobanteAlumno(
    to: string,
    datos: DatosComprobante,
    pdf: Buffer,
  ): Promise<void> {
    await this.transport.sendMail({
      from: this.from,
      to,
      subject: 'Comprobante de cambio de comisión',
      html: `
        <p>Hola,</p>
        <p>Tu cambio de comisión (intercambio <strong>#${datos.idIntercambio}</strong>) fue completado exitosamente.</p>
        <p>Encontrás el comprobante adjunto a este correo.</p>
        <p>Saludos,<br/>El equipo de Matching de Comisiones</p>
      `,
      attachments: [
        {
          filename: `comprobante-intercambio-${datos.idIntercambio}.pdf`,
          content: pdf,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  /**
   * Envía una notificación al profesor sobre el intercambio en su comisión.
   * El caller es responsable del manejo de errores (soft-fail).
   */
  async enviarNotificacionProfesor(to: string, datos: DatosComprobante): Promise<void> {
    const nombreComisionOfrece =
      datos.comisionOfrece.nombre_comision ??
      (datos.comisionOfrece.numero_comision != null
        ? `Comisión ${datos.comisionOfrece.numero_comision}`
        : 'Comisión');
    const nombreComisionDestino =
      datos.comisionDestino.nombre_comision ??
      (datos.comisionDestino.numero_comision != null
        ? `Comisión ${datos.comisionDestino.numero_comision}`
        : 'Comisión');

    await this.transport.sendMail({
      from: this.from,
      to,
      subject: 'Intercambio de alumnos en tu comisión',
      html: `
        <p>Estimado/a profesor/a,</p>
        <p>Se realizó un intercambio de alumnos en tu comisión (intercambio <strong>#${datos.idIntercambio}</strong>):</p>
        <ul>
          <li>
            <strong>${datos.alumnoOfrece.nombre_usuario} ${datos.alumnoOfrece.apellido_usuario}</strong>
            (DNI ${datos.alumnoOfrece.dni}) pasó de <em>${nombreComisionOfrece}</em> a <em>${nombreComisionDestino}</em>.
          </li>
          <li>
            <strong>${datos.alumnoDestino.nombre_usuario} ${datos.alumnoDestino.apellido_usuario}</strong>
            (DNI ${datos.alumnoDestino.dni}) pasó de <em>${nombreComisionDestino}</em> a <em>${nombreComisionOfrece}</em>.
          </li>
        </ul>
        <p>Saludos,<br/>El equipo de Matching de Comisiones</p>
      `,
    });
  }
}
