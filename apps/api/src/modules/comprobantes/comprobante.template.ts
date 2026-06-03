export interface DatosComprobante {
  idIntercambio: number;
  fechaGeneracion: Date;
  alumnoOfrece: {
    nombre_usuario: string;
    apellido_usuario: string;
    dni: number;
  };
  comisionOfrece: {
    nombre_comision: string | null;
    numero_comision: number | null;
    profesor: {
      nombre_usuario: string;
      apellido_usuario: string;
    };
  };
  alumnoDestino: {
    nombre_usuario: string;
    apellido_usuario: string;
    dni: number;
  };
  comisionDestino: {
    nombre_comision: string | null;
    numero_comision: number | null;
    profesor: {
      nombre_usuario: string;
      apellido_usuario: string;
    };
  };
}

export function construirHtmlComprobante(datos: DatosComprobante): string {
  const fecha = datos.fechaGeneracion.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

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

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Comprobante de Intercambio #${datos.idIntercambio}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 40px; color: #333; }
    h1 { font-size: 22px; color: #1a1a2e; border-bottom: 2px solid #1a1a2e; padding-bottom: 8px; }
    .meta { font-size: 13px; color: #666; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #1a1a2e; color: #fff; text-align: left; padding: 8px 12px; font-size: 13px; }
    td { padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #e0e0e0; }
    .label { font-weight: bold; width: 180px; }
    .section-title { font-size: 15px; font-weight: bold; color: #1a1a2e; margin: 20px 0 8px; }
    .footer { margin-top: 40px; font-size: 11px; color: #aaa; text-align: center; }
  </style>
</head>
<body>
  <h1>Comprobante de Intercambio</h1>
  <div class="meta">
    <strong>ID de intercambio:</strong> #${datos.idIntercambio} &nbsp;|&nbsp;
    <strong>Fecha de generación:</strong> ${fecha}
  </div>

  <div class="section-title">Alumno que ofrece</div>
  <table>
    <tr>
      <td class="label">Nombre completo</td>
      <td>${datos.alumnoOfrece.nombre_usuario} ${datos.alumnoOfrece.apellido_usuario}</td>
    </tr>
    <tr>
      <td class="label">DNI</td>
      <td>${datos.alumnoOfrece.dni}</td>
    </tr>
    <tr>
      <td class="label">Comisión origen</td>
      <td>${nombreComisionOfrece}</td>
    </tr>
    <tr>
      <td class="label">Profesor</td>
      <td>${datos.comisionOfrece.profesor.nombre_usuario} ${datos.comisionOfrece.profesor.apellido_usuario}</td>
    </tr>
  </table>

  <div class="section-title">Alumno destino</div>
  <table>
    <tr>
      <td class="label">Nombre completo</td>
      <td>${datos.alumnoDestino.nombre_usuario} ${datos.alumnoDestino.apellido_usuario}</td>
    </tr>
    <tr>
      <td class="label">DNI</td>
      <td>${datos.alumnoDestino.dni}</td>
    </tr>
    <tr>
      <td class="label">Comisión destino</td>
      <td>${nombreComisionDestino}</td>
    </tr>
    <tr>
      <td class="label">Profesor</td>
      <td>${datos.comisionDestino.profesor.nombre_usuario} ${datos.comisionDestino.profesor.apellido_usuario}</td>
    </tr>
  </table>

  <div class="footer">
    Este documento fue generado automáticamente por el sistema de Matching de Comisiones.
  </div>
</body>
</html>`;
}
