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

  const nombreCompletoOfrece = `${datos.alumnoOfrece.nombre_usuario} ${datos.alumnoOfrece.apellido_usuario}`;
  const nombreCompletoDestino = `${datos.alumnoDestino.nombre_usuario} ${datos.alumnoDestino.apellido_usuario}`;

  const profesorOfrece = `${datos.comisionOfrece.profesor.nombre_usuario} ${datos.comisionOfrece.profesor.apellido_usuario}`;
  const profesorDestino = `${datos.comisionDestino.profesor.nombre_usuario} ${datos.comisionDestino.profesor.apellido_usuario}`;

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
      gap: 24px;
    }

    .section {
      border: 1px solid #e2e2ea;
      border-radius: 10px;
      overflow: hidden;
    }

    .section-header {
      padding: 14px 24px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      color: #ffffff;
    }
    .section-header.persona {
      background: #4F46E5;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .section-header .persona-dni {
      font-size: 11px;
      font-weight: 500;
      opacity: 0.8;
      text-transform: none;
      letter-spacing: 0.02em;
    }

    /* ── JOURNEY ── */
    .section-body {
      padding: 20px 24px;
    }

    .journey {
      display: flex;
      align-items: stretch;
      gap: 0;
    }

    .journey-side {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .journey-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #6b6b80;
      margin-bottom: 10px;
    }

    .journey-card {
      background: #f8f8fc;
      border: 1px solid #e8e8f0;
      border-radius: 8px;
      padding: 16px;
      flex: 1;
    }

    .journey-commission {
      font-size: 15px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 4px;
    }

    .journey-profesor {
      font-size: 12px;
      color: #6b6b80;
    }

    /* ── ARROW ── */
    .journey-arrow {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 18px;
      flex-shrink: 0;
      margin-top: 22px; /* align with cards below labels */
    }
    .journey-arrow-icon {
      width: 36px;
      height: 36px;
      background: #EEF2FF;
      border: 1px solid #C7D2FE;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #4F46E5;
      font-size: 18px;
      font-weight: 700;
      line-height: 1;
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

    <!-- ${nombreCompletoOfrece}: sale de su comisión y entra en la del otro -->
    <div class="section">
      <div class="section-header persona">
        <span>${nombreCompletoOfrece}</span>
        <span class="persona-dni">DNI ${datos.alumnoOfrece.dni}</span>
      </div>
      <div class="section-body">
        <div class="journey">
          <div class="journey-side">
            <div class="journey-label">Comisión anterior</div>
            <div class="journey-card">
              <div class="journey-commission">${nombreComisionOfrece}</div>
              <div class="journey-profesor">Prof. ${profesorOfrece}</div>
            </div>
          </div>
          <div class="journey-arrow">
            <div class="journey-arrow-icon">→</div>
          </div>
          <div class="journey-side">
            <div class="journey-label">Comisión nueva</div>
            <div class="journey-card">
              <div class="journey-commission">${nombreComisionDestino}</div>
              <div class="journey-profesor">Prof. ${profesorDestino}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ${nombreCompletoDestino}: sale de su comisión y entra en la del otro -->
    <div class="section">
      <div class="section-header persona">
        <span>${nombreCompletoDestino}</span>
        <span class="persona-dni">DNI ${datos.alumnoDestino.dni}</span>
      </div>
      <div class="section-body">
        <div class="journey">
          <div class="journey-side">
            <div class="journey-label">Comisión anterior</div>
            <div class="journey-card">
              <div class="journey-commission">${nombreComisionDestino}</div>
              <div class="journey-profesor">Prof. ${profesorDestino}</div>
            </div>
          </div>
          <div class="journey-arrow">
            <div class="journey-arrow-icon">→</div>
          </div>
          <div class="journey-side">
            <div class="journey-label">Comisión nueva</div>
            <div class="journey-card">
              <div class="journey-commission">${nombreComisionOfrece}</div>
              <div class="journey-profesor">Prof. ${profesorOfrece}</div>
            </div>
          </div>
        </div>
      </div>
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
