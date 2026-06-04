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
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Arial', 'Helvetica Neue', sans-serif;
      background: #f5f5f7;
      color: #1a1a2e;
      padding: 0;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      background: #ffffff;
      margin: 0 auto;
      padding: 0 0 40px;
    }

    /* ── HEADER ── */
    .header {
      background: #4F46E5;
      color: #ffffff;
      padding: 36px 48px 32px;
    }
    .header-system {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      opacity: 0.85;
      margin-bottom: 6px;
    }
    .header-title {
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    /* ── META BADGE ── */
    .meta-bar {
      background: #f0f0f5;
      border-bottom: 1px solid #e2e2ea;
      padding: 16px 48px;
      display: flex;
      gap: 40px;
      align-items: center;
    }
    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .meta-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #6b6b80;
    }
    .meta-value {
      font-size: 15px;
      font-weight: 700;
      color: #1a1a2e;
    }

    /* ── SUCCESS BANNER ── */
    .success-banner {
      margin: 32px 48px 0;
      background: #dcfce7;
      border: 1px solid #86efac;
      border-radius: 8px;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .success-icon {
      width: 28px;
      height: 28px;
      background: #16a34a;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 15px;
      font-weight: 700;
      flex-shrink: 0;
      line-height: 1;
      padding-top: 1px;
    }
    .success-text {
      font-size: 14px;
      font-weight: 600;
      color: #15803d;
    }

    /* ── SECTIONS ── */
    .sections {
      padding: 32px 48px 0;
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .section {
      border: 1px solid #e2e2ea;
      border-radius: 10px;
      overflow: hidden;
    }

    .section-header {
      padding: 14px 20px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: #ffffff;
    }
    .section-header.solicitante { background: #4F46E5; }
    .section-header.receptor    { background: #6366f1; }

    .section table {
      width: 100%;
      border-collapse: collapse;
    }
    .section table tr:last-child td {
      border-bottom: none;
    }
    .section table td {
      padding: 12px 20px;
      font-size: 13px;
      border-bottom: 1px solid #f0f0f5;
      vertical-align: top;
    }
    .section table td.field-label {
      font-weight: 600;
      color: #6b6b80;
      width: 160px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding-top: 14px;
    }
    .section table td.field-value {
      color: #1a1a2e;
      font-size: 14px;
    }

    /* ── FOOTER ── */
    .footer {
      margin: 40px 48px 0;
      padding-top: 20px;
      border-top: 1px solid #e2e2ea;
      font-size: 11px;
      color: #9999aa;
      text-align: center;
      line-height: 1.6;
    }

    @media print {
      body { background: #fff; }
      .page { margin: 0; box-shadow: none; }
    }
  </style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="header-system">SIC — Sistema de Intercambio de Comisiones</div>
    <div class="header-title">Comprobante de Intercambio</div>
  </div>

  <div class="meta-bar">
    <div class="meta-item">
      <span class="meta-label">ID de intercambio</span>
      <span class="meta-value">#${datos.idIntercambio}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Fecha de generación</span>
      <span class="meta-value">${fecha}</span>
    </div>
  </div>

  <div class="success-banner">
    <div class="success-icon">&#10003;</div>
    <div class="success-text">Intercambio completado exitosamente</div>
  </div>

  <div class="sections">

    <div class="section">
      <div class="section-header solicitante">Alumno Solicitante</div>
      <table>
        <tr>
          <td class="field-label">Nombre completo</td>
          <td class="field-value">${datos.alumnoOfrece.nombre_usuario} ${datos.alumnoOfrece.apellido_usuario}</td>
        </tr>
        <tr>
          <td class="field-label">DNI</td>
          <td class="field-value">${datos.alumnoOfrece.dni}</td>
        </tr>
        <tr>
          <td class="field-label">Comisión</td>
          <td class="field-value">${nombreComisionOfrece}</td>
        </tr>
        <tr>
          <td class="field-label">Profesor</td>
          <td class="field-value">${datos.comisionOfrece.profesor.nombre_usuario} ${datos.comisionOfrece.profesor.apellido_usuario}</td>
        </tr>
      </table>
    </div>

    <div class="section">
      <div class="section-header receptor">Alumno Receptor</div>
      <table>
        <tr>
          <td class="field-label">Nombre completo</td>
          <td class="field-value">${datos.alumnoDestino.nombre_usuario} ${datos.alumnoDestino.apellido_usuario}</td>
        </tr>
        <tr>
          <td class="field-label">DNI</td>
          <td class="field-value">${datos.alumnoDestino.dni}</td>
        </tr>
        <tr>
          <td class="field-label">Comisión</td>
          <td class="field-value">${nombreComisionDestino}</td>
        </tr>
        <tr>
          <td class="field-label">Profesor</td>
          <td class="field-value">${datos.comisionDestino.profesor.nombre_usuario} ${datos.comisionDestino.profesor.apellido_usuario}</td>
        </tr>
      </table>
    </div>

  </div>

  <div class="footer">
    Documento generado automáticamente por el sistema SIC.<br/>
    ${fecha}
  </div>

</div>
</body>
</html>`;
}
