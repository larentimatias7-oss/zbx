import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logoModule = require('../.agents/skills/milicic-corporate-docs/resources/assets/logo-milicic-base64.js');
const logoUri = logoModule.LOGO_DATA_URI;

const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Manual Ejecutivo & Guía de Presentación: Dashboard Mensual de SLA | Milicic S.A.</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 18mm 14mm 18mm 14mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    :root {
      --primary: #ea580c;
      --primary-hover: #c2410c;
      --primary-light: #fff7ed;
      --primary-border: #fdba74;
      --dark-slate: #0f172a;
      --slate-lead: #1e293b;
      --slate-text: #334155;
      --slate-body: #475569;
      --slate-muted: #64748b;
      --slate-light: #94a3b8;
      --card-bg: #f8fafc;
      --border-color: #e2e8f0;
      --success: #16a34a;
      --success-bg: #dcfce7;
      --success-border: #86efac;
      --warning: #d97706;
      --warning-bg: #fef3c7;
      --warning-border: #fcd34d;
      --danger: #dc2626;
      --danger-bg: #fee2e2;
      --danger-border: #fca5a5;
      --info: #0891b2;
      --info-bg: #ecfeff;
      --info-border: #a5f3fc;
      --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }

    body {
      font-family: var(--font-family);
      color: var(--slate-text);
      line-height: 1.45;
      margin: 0;
      padding: 0;
      font-size: 9pt;
      background: #ffffff;
    }

    .page {
      page-break-after: always;
      break-after: page;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      min-height: 250mm;
      padding-top: 2mm;
    }

    .page:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    /* Portada Corporativa */
    .cover-page {
      page-break-after: always;
      break-after: page;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 250mm;
      padding: 10mm 6mm 4mm 6mm;
    }

    .cover-top {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .cover-logo {
      height: 52px;
      margin-bottom: 18mm;
      object-fit: contain;
    }

    .category-badge {
      display: inline-block;
      background: var(--primary-light);
      color: var(--primary);
      border: 1px solid var(--primary-border);
      padding: 5px 14px;
      border-radius: 4px;
      font-size: 8.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 10mm;
    }

    .cover-title {
      font-size: 26pt;
      font-weight: 800;
      color: var(--dark-slate);
      line-height: 1.15;
      margin: 0 0 5mm 0;
      letter-spacing: -0.5px;
    }

    .cover-title span {
      color: var(--primary);
    }

    .cover-subtitle {
      font-size: 11.5pt;
      color: var(--slate-body);
      font-weight: 500;
      line-height: 1.45;
      max-width: 95%;
      margin: 0 0 10mm 0;
    }

    .cover-highlight-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-left: 5px solid var(--primary);
      border-radius: 6px;
      padding: 14px 18px;
      margin-top: 5mm;
      width: 100%;
    }

    .cover-highlight-card h4 {
      margin: 0 0 6px 0;
      font-size: 10.5pt;
      color: var(--dark-slate);
      font-weight: 700;
    }

    .cover-highlight-card p {
      margin: 0;
      font-size: 8.8pt;
      color: var(--slate-text);
      line-height: 1.4;
    }

    .cover-footer {
      border-top: 2px solid var(--primary);
      padding-top: 6mm;
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 15mm;
    }

    .meta-group {
      font-size: 8.5pt;
      color: var(--slate-muted);
      line-height: 1.6;
    }

    .meta-group strong {
      color: var(--slate-lead);
      font-weight: 600;
    }

    /* Encabezados de Contenido */
    .content-header {
      border-bottom: 2px solid var(--primary);
      padding-bottom: 5px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .content-title {
      font-size: 14pt;
      font-weight: 800;
      color: var(--dark-slate);
      margin: 0;
      letter-spacing: -0.3px;
    }

    .content-subtitle {
      font-size: 8pt;
      color: var(--primary);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0;
    }

    .content-tag {
      font-size: 7.5pt;
      color: var(--slate-muted);
      font-weight: 600;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      padding: 3px 8px;
      border-radius: 4px;
    }

    /* Grilla de Métricas / KPI Cards */
    .kpi-grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 9px;
      margin-bottom: 12px;
    }

    .kpi-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 9px;
      margin-bottom: 12px;
    }

    .kpi-box {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-top: 3px solid var(--primary);
      border-radius: 6px;
      padding: 8px 10px;
    }

    .kpi-box.success { border-top-color: var(--success); }
    .kpi-box.warning { border-top-color: var(--warning); }
    .kpi-box.danger { border-top-color: var(--danger); }
    .kpi-box.info { border-top-color: var(--info); }

    .kpi-label {
      font-size: 7.2pt;
      color: var(--slate-muted);
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.4px;
      margin-bottom: 2px;
    }

    .kpi-number {
      font-size: 14.5pt;
      font-weight: 800;
      color: var(--dark-slate);
      line-height: 1.1;
      margin-bottom: 2px;
    }

    .kpi-desc {
      font-size: 7.2pt;
      color: var(--slate-body);
      line-height: 1.25;
    }

    /* Callouts y Cajas Informativas */
    .callout {
      background-color: var(--primary-light);
      border-left: 4px solid var(--primary);
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 10px;
      font-size: 8.5pt;
      color: var(--slate-text);
      line-height: 1.4;
    }

    .callout-title {
      font-weight: 700;
      color: var(--primary-hover);
      margin-bottom: 3px;
      font-size: 9pt;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .callout-blue {
      background-color: var(--info-bg);
      border-left-color: var(--info);
    }
    .callout-blue .callout-title { color: #0e7490; }

    .callout-green {
      background-color: var(--success-bg);
      border-left-color: var(--success);
    }
    .callout-green .callout-title { color: #15803d; }

    .callout-amber {
      background-color: var(--warning-bg);
      border-left-color: var(--warning);
    }
    .callout-amber .callout-title { color: #b45309; }

    /* Tablas Corporativas */
    .milicic-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 8.2pt;
    }

    .milicic-table th {
      background-color: var(--dark-slate);
      color: #ffffff;
      padding: 6px 8px;
      font-weight: 700;
      text-align: left;
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      border: 1px solid var(--dark-slate);
    }

    .milicic-table th.primary {
      background-color: var(--primary);
      border-color: var(--primary);
    }

    .milicic-table td {
      padding: 6px 8px;
      border: 1px solid var(--border-color);
      color: var(--slate-body);
      vertical-align: top;
    }

    .milicic-table tbody tr:nth-child(even) {
      background-color: #f8fafc;
    }

    .milicic-table .text-right { text-align: right; }
    .milicic-table .text-center { text-align: center; }
    .milicic-table strong { color: var(--dark-slate); }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .badge-success { background: var(--success-bg); color: var(--success); border: 1px solid var(--success-border); }
    .badge-warning { background: var(--warning-bg); color: var(--warning); border: 1px solid var(--warning-border); }
    .badge-danger  { background: var(--danger-bg);  color: var(--danger);  border: 1px solid var(--danger-border); }
    .badge-orange  { background: var(--primary-light); color: var(--primary); border: 1px solid var(--primary-border); }
    .badge-info    { background: var(--info-bg); color: var(--info); border: 1px solid var(--info-border); }

    /* Secciones de Oratoria y Speech */
    .speech-box {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-left: 4px solid var(--slate-lead);
      border-radius: 5px;
      padding: 9px 13px;
      margin-bottom: 9px;
      font-size: 8.4pt;
      position: relative;
    }

    .speech-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-weight: 700;
      font-size: 8.6pt;
      color: var(--dark-slate);
    }

    .speech-quote {
      font-style: italic;
      color: #1e293b;
      margin-bottom: 4px;
      line-height: 1.35;
    }

    .speech-rationale {
      font-size: 7.8pt;
      color: var(--slate-muted);
      border-top: 1px dashed #cbd5e1;
      padding-top: 4px;
      margin-top: 4px;
    }

    .qa-box {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 8px;
    }

    .qa-question {
      font-weight: 700;
      color: var(--primary);
      font-size: 8.5pt;
      margin-bottom: 3px;
    }

    .qa-answer {
      font-size: 8.2pt;
      color: var(--slate-text);
      line-height: 1.35;
    }

    /* Firmas */
    .signatures-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-top: 15px;
    }

    .signature-card {
      border-top: 1.5px solid var(--slate-light);
      padding-top: 8px;
      text-align: center;
      font-size: 7.8pt;
      color: var(--slate-muted);
    }

    .signature-card strong {
      display: block;
      color: var(--dark-slate);
      font-size: 8.5pt;
      margin-bottom: 2px;
    }

    h3 {
      font-size: 10.2pt;
      color: var(--dark-slate);
      margin: 8px 0 5px 0;
      font-weight: 700;
    }

    p {
      margin: 0 0 8px 0;
      line-height: 1.4;
    }

    ul, ol {
      margin: 0 0 8px 0;
      padding-left: 18px;
    }

    li {
      margin-bottom: 3px;
      line-height: 1.35;
    }
  </style>
</head>
<body>

  <!-- ==================== PÁGINA 1: PORTADA ==================== -->
  <div class="cover-page">
    <div class="cover-top">
      <img src="${logoUri}" alt="Milicic S.A." class="cover-logo" />
      
      <div class="category-badge">Guía Ejecutiva & Manual de Gobernanza Operativa</div>
      
      <h1 class="cover-title">
        Observabilidad Ejecutiva y <span>Gestión de SLA / SRE</span>
      </h1>
      
      <p class="cover-subtitle">
        Interpretación integral de indicadores, justificación de impacto de negocio y guion estratégico de presentación ante la Alta Dirección y el Directorio sobre el Dashboard Mensual de Infraestructura (<code>milicic-exec-monthly</code>).
      </p>

      <div class="cover-highlight-card">
        <h4>Objetivo de este Documento para la Gerencia de IT</h4>
        <p>
          Este manual proporciona al liderazgo de TI de Milicic S.A. el marco metodológico, la justificación cuantitativa y la narrativa ejecutiva necesaria para defender el desempeño de la infraestructura ante los máximos decisores de la compañía. Transforma el monitoreo técnico de servidores y switches en un diálogo estratégico de <strong>continuidad operativa, gestión de riesgo de negocio y justificación empírica de inversiones de capital (CAPEX)</strong>.
        </p>
      </div>
    </div>

    <div class="cover-footer">
      <div class="meta-group">
        <div><strong>Organización:</strong> Milicic S.A. | Construcción, Minería e Infraestructura</div>
        <div><strong>Área Emisora:</strong> Gerencia de Tecnologías de la Información & Comunicaciones</div>
        <div><strong>Plataforma:</strong> Zabbix 7.0.22 LTS + Grafana 11 Enterprise (Dokploy)</div>
        <div><strong>Tablero Asociado:</strong> <code>milicic-exec-monthly</code> (Versión 2.0 Oficial)</div>
      </div>
      <div class="meta-group" style="text-align: right;">
        <div><strong>Fecha de Emisión:</strong> Octubre 2026</div>
        <div><strong>Clasificación:</strong> Confidencial / Uso Gerencial y Directorio</div>
        <div><strong>Ciclo Auditado:</strong> Cierre Mensual Operativo (Últimos 30 días)</div>
        <div><strong>Estado:</strong> Aprobado para Presentación Ejecutiva</div>
      </div>
    </div>
  </div>

  <!-- ==================== PÁGINA 2: PROPÓSITO ESTRATÉGICO ==================== -->
  <div class="page">
    <div class="content-header">
      <div>
        <h2 class="content-title">1. Propósito Estratégico & Cambio de Paradigma</h2>
        <p class="content-subtitle">Evolución de la Gestión de TI: Del Monitoreo Técnico a la Observabilidad de Negocio</p>
      </div>
      <div class="content-tag">Marco Metodológico SRE / ITIL v4</div>
    </div>

    <h3>1.1 El Reto Histórico de la Comunicación de TI con la Dirección</h3>
    <p>
      Tradicionalmente, las áreas de infraestructura han presentado ante la Gerencia General y los Directorios reportes basados en métricas técnicas de bajo nivel: consumos de CPU, volumen de memoria RAM o estado de puertos de switches. Este lenguaje técnico genera dos problemas graves de gobierno:
    </p>
    <ul>
      <li><strong>Desconexión con el Negocio:</strong> El Directorio no puede inferir si un pico de CPU del 95% detuvo una obra minera, frenó la facturación o fue simplemente un proceso normal de indexación nocturna.</li>
      <li><strong>Falso Sentido de Alarma o Complacencia:</strong> Reportar "99.9% de uptime" promediando un switch secundario con el servidor central de base de datos oculta caídas críticas que sí costaron dinero a la organización.</li>
    </ul>

    <div class="callout callout-green">
      <div class="callout-title">El Nuevo Estándar Milicic: Arquitectura Tag-Driven y Niveles de Criticidad (Tiering)</div>
      A través del despliegue del dashboard <code>milicic-exec-monthly</code>, la Gerencia de IT unifica la telemetría de <strong>65 activos críticos</strong> de Rosario, San Juan y proyectos mineros bajo los principios de <strong>Site Reliability Engineering (SRE)</strong> de Google y gestión de incidentes <strong>ITIL v4</strong>. Se audita la experiencia del usuario y el impacto económico real.
    </div>

    <h3>1.2 Los Tres Pilares que Defiende este Reporte Mensual</h3>
    <div class="kpi-grid-3">
      <div class="kpi-box success">
        <div class="kpi-label">Pilar 1: Continuidad Operativa</div>
        <div class="kpi-number" style="font-size: 13pt;">SLO 99.50%</div>
        <div class="kpi-desc">Garantía matemática de que los sistemas que generan ingresos no se detienen.</div>
      </div>
      <div class="kpi-box info">
        <div class="kpi-label">Pilar 2: Eficiencia en Respuesta</div>
        <div class="kpi-number" style="font-size: 13pt;">MTTR &lt; 30m</div>
        <div class="kpi-desc">Contención inmediata de eventos críticos antes de causar daño colateral.</div>
      </div>
      <div class="kpi-box warning">
        <div class="kpi-label">Pilar 3: Previsibilidad Financiera</div>
        <div class="kpi-number" style="font-size: 13pt;">CAPEX Proyectivo</div>
        <div class="kpi-desc">Planificación anticipada de discos y hardware evitando compras de pánico.</div>
      </div>
    </div>

    <h3>1.3 Glosario Fundamental SRE Aplicado a Milicic</h3>
    <table class="milicic-table">
      <thead>
        <tr>
          <th style="width: 15%;">Concepto</th>
          <th style="width: 25%;">Definición Técnica</th>
          <th style="width: 35%;">Aplicación Concreta en Milicic S.A.</th>
          <th style="width: 25%;">Valor para la Dirección</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>SLI</strong><br><span style="font-size:7pt;color:var(--slate-muted);">Service Level Indicator</span></td>
          <td>Métrica cuantitativa real que mide el nivel de servicio entregado.</td>
          <td>Disponibilidad ponderada mensual (%) calculada sobre tablas <code>trends</code> de Zabbix 7.0 (sin pings transitorios).</td>
          <td>La verdad empírica auditada, sin interpretaciones subjetivas.</td>
        </tr>
        <tr>
          <td><strong>SLO</strong><br><span style="font-size:7pt;color:var(--slate-muted);">Service Level Objective</span></td>
          <td>Objetivo formal acordado entre el área de TI y el negocio.</td>
          <td>Meta global fijada en <strong>99.50%</strong> (mínimo admisible) y <strong>99.90%</strong> para sistemas Tier 0.</td>
          <td>El estándar de compromiso por el cual se evalúa la gestión de TI.</td>
        </tr>
        <tr>
          <td><strong>Error Budget</strong><br><span style="font-size:7pt;color:var(--slate-muted);">Presupuesto de Error</span></td>
          <td>Margen de indisponibilidad admisible en un periodo sin violar el SLO (100% - SLO).</td>
          <td>En un mes de 43.200 minutos, el 0.50% admisible equivale a exactamente <strong>216 minutos tolerados</strong>.</td>
          <td>Define el margen de seguridad para realizar cambios y mantenimientos.</td>
        </tr>
        <tr>
          <td><strong>MTTR</strong><br><span style="font-size:7pt;color:var(--slate-muted);">Mean Time To Resolve</span></td>
          <td>Tiempo promedio requerido para resolver un incidente desde su inicio.</td>
          <td>Calculado automáticamente sobre incidentes P1 mediante el conector API Zabbix.</td>
          <td>Mide la agilidad del NOC y del equipo de guardia ante emergencias.</td>
        </tr>
      </tbody>
    </table>

    <div class="callout callout-blue">
      <div class="callout-title">Mensaje Clave para la Gerencia de IT</div>
      <em>"Nosotros no pedimos presupuesto de tecnología para apagar incendios; mostramos un tablero de control matemático donde cada minuto de indisponibilidad y cada gigabyte de almacenamiento se gestionan como activos financieros de Milicic."</em>
    </div>
  </div>

  <!-- ==================== PÁGINA 3: BLOQUE 1 SCORECARD ==================== -->
  <div class="page">
    <div class="content-header">
      <div>
        <h2 class="content-title">2. Bloque 1: Scorecard y Presupuesto de Error</h2>
        <p class="content-subtitle">Desglose de los 8 Indicadores de Máximo Nivel del Tablero Ejecutivo</p>
      </div>
      <div class="content-tag">Sección 1 del Dashboard</div>
    </div>

    <p>
      El Bloque 1 sintetiza en 8 tarjetas numéricas el estado de salud mensual de toda la infraestructura. A continuación se detalla el significado riguroso de cada uno y su importancia estratégica:
    </p>

    <div class="kpi-grid-4">
      <div class="kpi-box success">
        <div class="kpi-label">1. Uptime Global (30d)</div>
        <div class="kpi-number">99.82%</div>
        <div class="kpi-desc">Meta SLO: 99.50% (+0.32% a favor)</div>
      </div>
      <div class="kpi-box info">
        <div class="kpi-label">2. Presupuesto Total</div>
        <div class="kpi-number">216 min</div>
        <div class="kpi-desc">Base: 43.200 min / mes (0.50% admisible)</div>
      </div>
      <div class="kpi-box warning">
        <div class="kpi-label">3. Consumo Real</div>
        <div class="kpi-number">78 min</div>
        <div class="kpi-desc">Indisponibilidad neta ponderada</div>
      </div>
      <div class="kpi-box success">
        <div class="kpi-label">4. Presupuesto Restante</div>
        <div class="kpi-number">64%</div>
        <div class="kpi-desc">138 minutos de margen seguro</div>
      </div>
    </div>

    <div class="kpi-grid-4">
      <div class="kpi-box success">
        <div class="kpi-label">5. MTTR P1 (Resolución)</div>
        <div class="kpi-number">18 min</div>
        <div class="kpi-desc">Benchmark de industria: &lt; 30 min</div>
      </div>
      <div class="kpi-box success">
        <div class="kpi-label">6. Incidentes P1</div>
        <div class="kpi-number">1</div>
        <div class="kpi-desc">Totalmente contenido y mitigado</div>
      </div>
      <div class="kpi-box warning">
        <div class="kpi-label">7. Alertas CAPEX</div>
        <div class="kpi-number">2</div>
        <div class="kpi-desc">Volúmenes con saturación &lt; 60 días</div>
      </div>
      <div class="kpi-box info">
        <div class="kpi-label">8. Activos Auditados</div>
        <div class="kpi-number">65</div>
        <div class="kpi-desc">Inventario crítico Tier 0, 1 y 2</div>
      </div>
    </div>

    <h3>2.1 Análisis Exhaustivo de los Indicadores Clave</h3>
    <table class="milicic-table">
      <thead>
        <tr>
          <th style="width: 22%;">Indicador</th>
          <th style="width: 38%;">¿Por qué lo consideramos importante?</th>
          <th style="width: 40%;">Significado Práctico y Gobernanza</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Uptime Global SLI<br>(99.82%)</strong></td>
          <td>Es la métrica reina. Demuestra objetivamente si la TI de Milicic estuvo a la altura del negocio. Estar en 99.82% frente a un compromiso del 99.50% prueba una operación con <strong>holgura positiva</strong>.</td>
          <td>Calculado sobre las horas de operación de los 65 activos productivos. Representa que las operaciones sufrieron menos de una hora y media de degradación acumulada en todo el mes.</td>
        </tr>
        <tr>
          <td><strong>Presupuesto de Error<br>(216 min total / 78 min usado)</strong></td>
          <td>Elimina la falsa expectativa del "100%". En ingeniería, el 100% de disponibilidad es astronómicamente costoso e impide actualizar sistemas. Este indicador fija una <strong>cuota mensual admisible</strong>.</td>
          <td>De los 216 minutos tolerados por el negocio, solo se consumieron 78 minutos (el 36%). El 64% restante (138 minutos) fue un "ahorro operativo" que protegió la facturación de la empresa.</td>
        </tr>
        <tr>
          <td><strong>Presupuesto Remanente<br>(64% a favor)</strong></td>
          <td>Es el termómetro de riesgo para la innovación. Si el presupuesto remanente es alto (>50%), la Gerencia de IT tiene luz verde para autorizar cambios complejos y despliegues sin arriesgar el contrato con el negocio.</td>
          <td>Si en algún mes el presupuesto remanente cayera por debajo del 20%, se activa automáticamente un protocolo de "congelamiento de cambios" (change freeze) para priorizar estabilidad.</td>
        </tr>
        <tr>
          <td><strong>MTTR P1<br>(18 minutos)</strong></td>
          <td>Mide la capacidad de reacción del equipo humano y las herramientas automáticas. Las fallas de hardware son inevitables; lo que define a un equipo de excelencia es la <strong>velocidad de restauración</strong>.</td>
          <td>Milicic resolvió el incidente crítico en 18 minutos. La norma ITIL fija como excelente todo tiempo menor a 30 minutos. Esto prueba que el bot de Telegram y las guardias activas funcionan sin demoras.</td>
        </tr>
        <tr>
          <td><strong>Alertas CAPEX (2)<br>y Activos (65)</strong></td>
          <td>Desacopla la gestión operativa del día a día de la planificación financiera de inversiones en hardware.</td>
          <td>Indica que 2 volúmenes de disco se saturarán en menos de dos meses si no se invierte en ampliación de almacenamiento (detallado en el Bloque 4).</td>
        </tr>
      </tbody>
    </table>

    <div class="callout callout-amber">
      <div class="callout-title">Argumento Clave para la Presentación</div>
      <em>"Señores Directores: Nuestra meta mensual era no exceder 216 minutos de interrupciones acumuladas en todos los sistemas de la empresa. Cerramos el mes consumiendo apenas 78 minutos, con 138 minutos de reserva y un tiempo récord de 18 minutos para solucionar el único incidente grave que tuvimos."</em>
    </div>
  </div>

  <!-- ==================== PÁGINA 4: BLOQUE 2 MATRIZ DE SERVICIOS ==================== -->
  <div class="page">
    <div class="content-header">
      <div>
        <h2 class="content-title">3. Bloque 2: Matriz de Servicios Críticos (Tiering & SLO)</h2>
        <p class="content-subtitle">Desacoplamiento de Impacto: Misión Crítica, Operaciones Mineras y Distribución</p>
      </div>
      <div class="content-tag">Sección 2 del Dashboard</div>
    </div>

    <p>
      El Bloque 2 del dashboard presenta la disponibilidad clasificada por <strong>capas de valor de negocio</strong>. Esto responde a la regla de gobernanza: <em>"Una caída en un switch de acceso de planta baja jamás debe mezclarse con la caída del servidor central de Presea o del enlace satelital en cordillera"</em>.
    </p>

    <table class="milicic-table">
      <thead>
        <tr>
          <th class="primary" style="width: 20%;">Capa de Servicio</th>
          <th style="width: 25%;">Activos Representativos</th>
          <th style="width: 15%;" class="text-center">Meta SLO</th>
          <th style="width: 15%;" class="text-center">Uptime Real</th>
          <th style="width: 25%;">Impacto Financiero y Operativo</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Tier 0: ERP Presea / SAP & Core Database</strong></td>
          <td><code>SRO-SQL01</code> (SQL Server Cluster)<br><code>SRO-APP01</code> (Servidor de Apps)</td>
          <td class="text-center"><strong>99.90%</strong></td>
          <td class="text-center"><span class="badge badge-success">99.98%</span></td>
          <td><strong>Misión Crítica Absoluta:</strong> Facturación, compras, liquidación de haberes, certificaciones de obra y contabilidad general.</td>
        </tr>
        <tr>
          <td><strong>Tier 0: Datacenter Core & Virtualización</strong></td>
          <td><code>SRO-HPV01</code>, <code>SRO-HPV02</code><br>Hyper-V Cluster / Nutanix Core</td>
          <td class="text-center"><strong>99.50%</strong></td>
          <td class="text-center"><span class="badge badge-success">99.92%</span></td>
          <td><strong>Cómputo Central:</strong> Aloja más de 40 máquinas virtuales de servicios productivos, controladores de dominio y almacenamiento.</td>
        </tr>
        <tr>
          <td><strong>Tier 0: Core Switching & Routing Rosario</strong></td>
          <td><code>SRO-E02-PB00-CORE01</code><br>Aruba CX 6300 / Core L3</td>
          <td class="text-center"><strong>99.90%</strong></td>
          <td class="text-center"><span class="badge badge-success">100.00%</span></td>
          <td><strong>Columna Vertebral:</strong> Interconecta todos los servidores del Datacenter con las redes WAN y enlaces externos.</td>
        </tr>
        <tr>
          <td><strong>Tier 1: Enlace SD-WAN & Minería San Juan</strong></td>
          <td><code>SSJ-R01</code> (Router San Juan)<br>Enlaces Satelitales Starlink / Microondas</td>
          <td class="text-center"><strong>99.00%</strong></td>
          <td class="text-center"><span class="badge badge-success">99.64%</span></td>
          <td><strong>Operación en Faenas Remotas:</strong> Comunicación con campamentos mineros, despacho de equipos, partes diarios y seguridad operativa.</td>
        </tr>
        <tr>
          <td><strong>Tier 1: Perímetro & Ciberseguridad</strong></td>
          <td><code>SRO-FW01</code>, <code>SRO-FW02</code><br>FortiGate HA Cluster</td>
          <td class="text-center"><strong>99.50%</strong></td>
          <td class="text-center"><span class="badge badge-success">99.99%</span></td>
          <td><strong>Defensa de Frontera:</strong> Túneles VPN de faenas, filtrado UTM, prevención de intrusiones y blindaje contra ransomware.</td>
        </tr>
        <tr>
          <td><strong>Tier 1: Energía Crítica & UPS Datacenter</strong></td>
          <td>APC Symmetra LX / Smart-UPS<br>Telemetría SNMP de Baterías</td>
          <td class="text-center"><strong>99.50%</strong></td>
          <td class="text-center"><span class="badge badge-success">100.00%</span></td>
          <td><strong>Respaldo Físico:</strong> Autonomía eléctrica ininterrumpida frente a microcortes o apagones de la distribuidora eléctrica.</td>
        </tr>
        <tr>
          <td><strong>Tier 2: Conectividad Distribución & Campus</strong></td>
          <td>Switches de Acceso Pisos E01/E02<br>Puntos de Acceso Wi-Fi</td>
          <td class="text-center"><strong>98.50%</strong></td>
          <td class="text-center"><span class="badge badge-success">99.78%</span></td>
          <td><strong>Productividad de Oficinas:</strong> Puestos administrativos, telefonía IP y navegación de estaciones de trabajo locales.</td>
        </tr>
      </tbody>
    </table>

    <div class="callout callout-green">
      <div class="callout-title">Por qué es Vital Explicar este Tiering al Directorio</div>
      <ul>
        <li><strong>Protección contra el sesgo de reclamos menores:</strong> Si un usuario directivo tuvo un problema con la impresora o el Wi-Fi de una sala de reuniones (Tier 2), esta matriz demuestra con datos irrefutables que el corazón operativo (Presea 99.98% y Datacenter 99.92%) no se detuvo ni un segundo.</li>
        <li><strong>Validación de la conectividad minera:</strong> Lograr un <strong>99.64% de disponibilidad en San Juan y campamentos mineros</strong> supera con creces el objetivo acordado del 99.00%, justificando las inversiones realizadas en redundancia SD-WAN y enlaces Starlink de baja latencia en entornos cordilleranos hostiles.</li>
      </ul>
    </div>

    <div class="speech-box">
      <div class="speech-header">
        <span>Guion para el Gerente: Defensa de la Matriz de Negocio</span>
        <span class="badge badge-orange">Discurso</span>
      </div>
      <div class="speech-quote">
        "Como pueden apreciar en la matriz de servicios, nuestros sistemas de misión crítica —la base de datos de Presea y el Datacenter— operaron al 99.98% de disponibilidad, muy por encima de la exigencia del 99.90%. Y en los proyectos mineros de San Juan, donde las condiciones geográficas son extremas, mantuvimos un 99.64% de operatividad continua, garantizando que ninguna faena remota quedara aislada ni frenara sus reportes de despacho."
      </div>
    </div>
  </div>

  <!-- ==================== PÁGINA 5: BLOQUE 3 TAXONOMÍA ITIL ==================== -->
  <div class="page">
    <div class="content-header">
      <div>
        <h2 class="content-title">4. Bloque 3: Fiabilidad Operativa & Distribución ITIL</h2>
        <p class="content-subtitle">Gestión de Incidentes por Severidad P1, P2, P3 y Estabilidad Temporal</p>
      </div>
      <div class="content-tag">Sección 3 del Dashboard</div>
    </div>

    <h3>4.1 El Modelo de Notificaciones y Filtrado de Ruido Operativo</h3>
    <p>
      Para evitar la fatiga de alertas y garantizar que el equipo de guardia responda de forma fulminante ante eventos verdaderamente destructivos, Milicic opera con una arquitectura unificada sobre Telegram oficial (<code>@inframilicic_bot</code>) estructurada en 3 niveles de severidad y persistencia:
    </p>

    <table class="milicic-table">
      <thead>
        <tr>
          <th style="width: 15%;">Severidad</th>
          <th style="width: 15%;">Persistencia</th>
          <th style="width: 25%;">Canal de Telegram</th>
          <th style="width: 15%;" class="text-center">Eventos Mes</th>
          <th style="width: 30%;">Criterio Operativo y Justificación</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="badge badge-danger">P1 - Crítico</span></td>
          <td><strong>Inmediato (0 min)</strong></td>
          <td><code>🚨 Alertas P1 CRITICAS</code><br>ID: <code>-1004383937012</code></td>
          <td class="text-center"><strong>1</strong></td>
          <td>Caídas de Core, servidores ERP, bases de datos o storage central. Disparo sonoro 24/7 sin demora. Cero tolerancia a pérdidas de tiempo.</td>
        </tr>
        <tr>
          <td><span class="badge badge-warning">P2 - Medio</span></td>
          <td><strong>10 minutos</strong><br>(Paso 2 escalamiento)</td>
          <td><code>📋 Alertas General P1 P2 P3</code><br>ID: <code>-1004396424523</code></td>
          <td class="text-center"><strong>4</strong></td>
          <td>Switches de distribución, enlaces WAN secundarios o hipervisores redundantes. La espera de 10 min filtra microcortes que el protocolo LACP/STP resuelve solo.</td>
        </tr>
        <tr>
          <td><span class="badge badge-info">P3 - Preventivo</span></td>
          <td><strong>30 minutos</strong><br>(Paso 2 escalamiento)</td>
          <td><code>📋 Alertas General P1 P2 P3</code><br>ID: <code>-1004396424523</code></td>
          <td class="text-center"><strong>12</strong></td>
          <td>Umbrales de capacidad (disco > 85%, memoria, puertos de acceso). Ventana de 30 min para gestionar acciones preventivas durante horario laboral.</td>
        </tr>
      </tbody>
    </table>

    <div class="callout callout-blue">
      <div class="callout-title">Por qué la Demora Escalonada Protege a la Organización</div>
      El 85% de las alarmas transitorias de red (microcortes de paquetes, reconexiones satelitales momentáneas) se recuperan en menos de 3 a 5 minutos gracias a la redundancia automática de hardware. Si notificáramos de inmediato cada parpadeo, el personal técnico se saturaría de falsas alarmas y perdería foco. El retardo de 10 minutos en P2 y 30 minutos en P3 asegura que <strong>cuando Telegram suena, es porque existe un problema real que requiere intervención</strong>.
    </div>

    <h3>4.2 Interpretación de la Curva Temporal de Estabilidad (30 Días)</h3>
    <p>
      El panel gráfico central del dashboard traza la línea diaria de Uptime frente a la <strong>Línea Base del SLO (99.50% en línea roja punteada)</strong>:
    </p>

    <div class="kpi-box success" style="margin-bottom: 10px;">
      <div class="kpi-label">Diagnóstico de la Serie Temporal de 30 Días</div>
      <p style="margin: 3px 0 0 0; font-size: 8.3pt; color: var(--slate-text);">
        • <strong>Días 1 al 2:</strong> Estabilidad al 100.00%.<br>
        • <strong>Día 3 (03/10):</strong> Depresión controlada al <strong>99.38%</strong> producto del incidente P1 en el storage de Rosario (18 minutos). La curva absorbió el impacto y regresó de inmediato a la zona verde.<br>
        • <strong>Días 4 al 30:</strong> Operación ininterrumpida por encima del 99.85% y picos continuos de 100.00%.<br>
        • <strong>Conclusión Matemática:</strong> La infraestructura demostró <strong>alta resiliencia</strong>. Un incidente aislado no comprometió el promedio ponderado del mes (99.82%).
      </p>
    </div>

    <div class="speech-box">
      <div class="speech-header">
        <span>Guion para el Gerente: Presentación de la Taxonomía ITIL</span>
        <span class="badge badge-orange">Discurso</span>
      </div>
      <div class="speech-quote">
        "En este gráfico temporal pueden ver cómo se comportó la empresa día a día. El único momento donde la curva rozó nuestro umbral fue el 3 de octubre debido a una degradación en el almacenamiento de Rosario. Gracias a nuestro sistema de alertas inteligentes que notifica en 0 minutos a los teléfonos de guardia, el equipo contuvo el problema en 18 minutos y el resto de los 29 días operamos prácticamente al 100%."
      </div>
    </div>
  </div>

  <!-- ==================== PÁGINA 6: BLOQUE 4 GESTIÓN CAPEX ==================== -->
  <div class="page">
    <div class="content-header">
      <div>
        <h2 class="content-title">5. Bloque 4: Gestión de Capacidad & Algoritmo CAPEX</h2>
        <p class="content-subtitle">Planificación Predictiva de Inversiones en Hardware con Regresión Lineal de Zabbix</p>
      </div>
      <div class="content-tag">Sección 4 del Dashboard</div>
    </div>

    <h3>5.1 Cómo Funciona el Algoritmo Predictivo de Capacidad</h3>
    <p>
      La mayoría de las empresas monitorean el almacenamiento con una regla estática: <em>"Avisar cuando el disco supere el 90%"</em>. Para una base de datos corporativa de 2 Terabytes, llegar al 90% significa que quedan menos de 200 GB, lo que en periodos de alto procesamiento puede llenarse en cuestión de días, provocando la caída súbita del sistema.
    </p>
    <p>
      Zabbix 7.0 LTS en Milicic implementa una <strong>regresión lineal sobre la tabla histórica <code>trends</code></strong> (muestreos consolidados de los últimos 30 días). El algoritmo calcula:
    </p>
    <div class="callout callout-blue" style="font-family: monospace; font-size: 8pt;">
      Tasa de Consumo Diario (Pendiente) = &Delta;Volumen / &Delta;Tiempo (GB/día)<br>
      Días Restantes a Saturación = (Espacio Total - Espacio Usado Actual) / Tasa Diaria
    </div>

    <h3>5.2 Detalle de las 2 Alertas CAPEX Detectadas este Mes</h3>
    <table class="milicic-table">
      <thead>
        <tr>
          <th style="width: 25%;">Servidor / Volumen</th>
          <th style="width: 15%;" class="text-center">Capacidad</th>
          <th style="width: 15%;" class="text-center">Uso Actual</th>
          <th style="width: 15%;" class="text-center">Tasa Crecimiento</th>
          <th style="width: 15%;" class="text-center">Días al 100%</th>
          <th style="width: 15%;" class="text-center">Estado / Urgencia</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>SRO-SQL01</strong><br><code>Data Volume (D:)</code> (Archivos de Base Presea)</td>
          <td class="text-center">2.07 TB</td>
          <td class="text-center"><strong>89.2%</strong><br>(1.85 TB)</td>
          <td class="text-center">+14.2 GB / día</td>
          <td class="text-center"><strong>23 días</strong></td>
          <td class="text-center"><span class="badge badge-danger">Crítico (&lt; 30d)</span></td>
        </tr>
        <tr>
          <td><strong>SRO-HPV01</strong><br><code>CSV01</code> (Cluster Shared Volume Hyper-V)</td>
          <td class="text-center">9.00 TB</td>
          <td class="text-center"><strong>84.6%</strong><br>(7.61 TB)</td>
          <td class="text-center">+28.5 GB / día</td>
          <td class="text-center"><strong>48 días</strong></td>
          <td class="text-center"><span class="badge badge-warning">Atención (&lt; 60d)</span></td>
        </tr>
      </tbody>
    </table>

    <div class="callout callout-amber">
      <div class="callout-title">El Valor Financiero de este Indicador para el Directorio</div>
      Este cuadro cambia radicalmente la conversación financiera. En lugar de que el Gerente de IT deba presentarse ante la Dirección diciendo <em>"La base de datos se llenó esta mañana y necesitamos comprar discos de urgencia hoy pagando fletes aéreos y sobreprecios"</em>, el Gerente se anticipa con <strong>23 a 48 días de holgura</strong>:
      <ul>
        <li>Permite solicitar cotizaciones a múltiples proveedores de hardware con plazos regulares de entrega.</li>
        <li>Permite coordinar con el área de Compras y Finanzas el flujo de fondos de la orden de compra.</li>
        <li>Evita interrupciones no programadas en las operaciones de obra y facturación de Milicic.</li>
      </ul>
    </div>

    <div class="speech-box">
      <div class="speech-header">
        <span>Guion para el Gerente: La Justificación del Presupuesto CAPEX</span>
        <span class="badge badge-orange">Discurso</span>
      </div>
      <div class="speech-quote">
        "Estimados Directores, este panel no solo muestra el pasado, sino que predice el futuro de nuestra infraestructura. Nuestro modelo matemático nos alerta hoy que la base de datos de Presea alcanzará el 100% de su capacidad en exactamente 23 días debido al ritmo de crecimiento transaccional de las obras. No venimos a pedir un gasto imprevisto: venimos con un plan estructurado para ampliar el volumen SAN con una inversión de $X que ya tiene plazo y justificación técnica matemática."
      </div>
      <div class="speech-rationale">
        Razón estratégica: Convierte una solicitud de hardware en una medida de mitigación de riesgo corporativo imposible de rechazar.
      </div>
    </div>
  </div>

  <!-- ==================== PÁGINA 7: BLOQUE 5 BITÁCORA Y RCA ==================== -->
  <div class="page">
    <div class="content-header">
      <div>
        <h2 class="content-title">6. Bloque 5: Bitácora de Auditoría & Heurística RCA</h2>
        <p class="content-subtitle">Transparencia Radical, Análisis de Causa Raíz (RCA) y Mitigación Estructural</p>
      </div>
      <div class="content-tag">Sección 5 del Dashboard</div>
    </div>

    <h3>6.1 Por qué Mostrar los Problemas Fortalece la Confianza Gerencial</h3>
    <p>
      Un reporte de tecnología que afirma tener "cero problemas" resulta inverosímil para cualquier Directorio experimentado. La verdadera madurez institucional de la Gerencia de IT radica en demostrar que cuando un incidente ocurre:
    </p>
    <ol>
      <li><strong>Fue detectado automáticamente</strong> en segundos por la plataforma de monitoreo.</li>
      <li><strong>Fue resuelto rápidamente</strong> dentro de los acuerdos de servicio (MTTR de 18 min).</li>
      <li><strong>Se identificó la Causa Raíz (RCA)</strong> técnica real sin culpar factores externos.</li>
      <li><strong>Se implementó una corrección definitiva</strong> para garantizar que nunca vuelva a repetirse.</li>
    </ol>

    <h3>6.2 Cronología y Análisis Post-Mortem del Incidente P1 Auditado</h3>
    <table class="milicic-table">
      <thead>
        <tr>
          <th style="width: 15%;">Campo de Registro</th>
          <th style="width: 85%;">Detalle Técnico y Operativo Auditado en Zabbix</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Código de Incidente</strong></td>
          <td><code>INC-2026-10-01-P1</code> (Registrado en Bitácora Zabbix y Grafana)</td>
        </tr>
        <tr>
          <td><strong>Momento del Evento</strong></td>
          <td>Viernes 03 de Octubre de 2026, 14:22:15 hs a 14:40:10 hs (Duración Neta: <strong>17 minutos y 55 segundos</strong>).</td>
        </tr>
        <tr>
          <td><strong>Servicio Afectado</strong></td>
          <td>Storage Secundario / Pool de I/O de Servidores Virtuales en Datacenter Rosario.</td>
        </tr>
        <tr>
          <td><strong>Síntoma Percibido</strong></td>
          <td>Latencia de lectura/escritura en disco superior a 150 ms en 4 máquinas virtuales secundarias.</td>
        </tr>
        <tr>
          <td><strong>Causa Raíz (RCA)</strong></td>
          <td><strong>Colisión de Procesos de E/S Concurrentes:</strong> Se ejecutó una reindexación programada de base de datos en paralelo imprevisto con una tarea de réplica remota de backups de Veeam que había sufrido un retraso en la noche anterior.</td>
        </tr>
        <tr>
          <td><strong>Mitigación Inmediata</strong></td>
          <td>Aislamiento de la cola de replicación de Veeam a las 14:31 hs, rebalanceo de carga sobre controladora B y retorno inmediato a latencias normales (&lt; 12 ms) a las 14:40 hs.</td>
        </tr>
        <tr>
          <td><strong>Acción Preventiva Definitiva</strong></td>
          <td>Se reprogramaron las ventanas de mantenimiento en Veeam Backup & Replication con bloqueo mutuo (exclusión mutua) respecto a los planes de mantenimiento de SQL Server. Se agregó un trigger en Zabbix que aborta réplicas secundarias si la latencia de disco supera los 35 ms.</td>
        </tr>
      </tbody>
    </table>

    <div class="callout callout-green">
      <div class="callout-title">Gobernanza y Cumplimiento de Auditoría</div>
      El dashboard <code>milicic-exec-monthly</code> extrae este registro directamente de los eventos auditados en la base de datos de Zabbix (<code>event.get</code> y <code>problem.get</code>). No hay posibilidad de alteración manual. La Dirección cuenta con la certeza de que el historial es una copia fiel de la telemetría institucional.
    </div>

    <div class="speech-box">
      <div class="speech-header">
        <span>Guion para el Gerente: La Explicación del Incidente P1</span>
        <span class="badge badge-orange">Discurso</span>
      </div>
      <div class="speech-quote">
        "En la bitácora de cierre pueden observar con total transparencia el único incidente de severidad alta que tuvimos en el mes. Ocurrió el 3 de octubre en el almacenamiento secundario debido a una coincidencia de procesos de respaldo. En 18 minutos el equipo técnico contuvo la latencia y restableció el servicio sin que se viera afectada la base de datos principal. Además, ya implementamos la política de exclusión mutua para que este escenario no vuelva a repetirse jamás."
      </div>
    </div>
  </div>

  <!-- ==================== PÁGINA 8: GUION DE PRESENTACIÓN ==================== -->
  <div class="page">
    <div class="content-header">
      <div>
        <h2 class="content-title">7. Guion Estratégico de Presentación ante el Directorio</h2>
        <p class="content-subtitle">Estructura del Discurso Paso a Paso para la Gerencia de IT (Executive Speech)</p>
      </div>
      <div class="content-tag">Guía de Oratoria & Defensa</div>
    </div>

    <p>
      A continuación se detalla la secuencia oratoria recomendada para que el Gerente de IT o Líder de Infraestructura conduzca la presentación del dashboard ante el Directorio o Comité de Dirección en una reunión de <strong>8 a 10 minutos</strong>:
    </p>

    <div class="speech-box">
      <div class="speech-header">
        <span>Paso 1: La Apertura Ejecutiva y Posicionamiento de Valor (1 Minuto)</span>
        <span class="badge badge-orange">Minuto 0 a 1</span>
      </div>
      <div class="speech-quote">
        "Buenos días a todos. Hoy venimos a presentarles el cierre mensual de infraestructura y telecomunicaciones de Milicic S.A., pero no a través de números técnicos de informática, sino desde la perspectiva de la continuidad operativa del negocio, la protección de nuestros ingresos y la previsibilidad de inversiones.<br><br>
        Todo lo que ven en este panel proviene de nuestro sistema de telemetría centralizada Zabbix y Grafana, que audita en tiempo real los 65 activos tecnológicos más importantes de la empresa en Rosario, San Juan y los proyectos mineros."
      </div>
      <div class="speech-rationale">
        Objetivo: Captar de inmediato la atención del Directorio alejándose de tecnicismos y vinculando la exposición con el dinero y la operación de la compañía.
      </div>
    </div>

    <div class="speech-box">
      <div class="speech-header">
        <span>Paso 2: El Uptime y el Presupuesto de Error (1.5 Minutos)</span>
        <span class="badge badge-orange">Minuto 1 a 2.5</span>
      </div>
      <div class="speech-quote">
        "Comenzando por el tablero de control principal: nuestro compromiso mensual de disponibilidad con la empresa era alcanzar un 99.50%. Cerramos el periodo en <strong>99.82%</strong>, superando nuestra meta en más de tres décimas.<br><br>
        En términos prácticos: un mes tiene 43.200 minutos. Nuestro acuerdo tolera un máximo de 216 minutos de afectación acumulada en todos los sistemas. Consumimos únicamente 78 minutos. Cerramos el mes con un <strong>64% de margen de seguridad a favor</strong>, lo que demuestra la solidez de los sistemas ante cualquier contingencia."
      </div>
      <div class="speech-rationale">
        Objetivo: Demostrar cumplimiento de contrato y validar que la TI está operando con holgura y bajo control.
      </div>
    </div>

    <div class="speech-box">
      <div class="speech-header">
        <span>Paso 3: La Matriz de Servicios y la Conectividad en Faena (1.5 Minutos)</span>
        <span class="badge badge-orange">Minuto 2.5 a 4</span>
      </div>
      <div class="speech-quote">
        "Al mirar la matriz de servicios críticos por niveles, los resultados son contundentes: nuestro ERP Presea y las bases de datos registraron un <strong>99.98% de operatividad continua</strong>. La facturación, los pagos y las compras no tuvieron demoras.<br><br>
        Y en el plano de las operaciones mineras en San Juan y campamentos remotos, alcanzamos un <strong>99.64% de uptime</strong> frente a un objetivo del 99.00%. Las inversiones que aprobó este Directorio en enlaces satelitales redundantes y tecnología SD-WAN están pagando dividendos: ninguna faena minera quedó aislada en el mes."
      </div>
      <div class="speech-rationale">
        Objetivo: Demostrar el retorno de inversión (ROI) de los proyectos aprobados anteriormente por la Dirección.
      </div>
    </div>

    <div class="speech-box">
      <div class="speech-header">
        <span>Paso 4: El Incidente P1 y la Capacidad de Reacción (1.5 Minutos)</span>
        <span class="badge badge-orange">Minuto 4 a 5.5</span>
      </div>
      <div class="speech-quote">
        "En nuestra gestión creemos en la transparencia total. Tuvimos un único incidente de alta severidad el 3 de octubre en el almacenamiento secundario de Rosario. ¿Cómo respondió la organización? Nuestro sistema automático alertó en 0 minutos a los teléfonos de guardia, el equipo diagnosticó la colisión de tareas de respaldo y a los <strong>18 minutos exactos</strong> el servicio quedó 100% normalizado. La norma internacional considera excelente cualquier tiempo menor a 30 minutos. Además, ya corregimos la programación para que no vuelva a suceder."
      </div>
      <div class="speech-rationale">
        Objetivo: Desarmar cualquier crítica sobre la caída convirtiéndola en una demostración de excelencia operativa y velocidad de respuesta.
      </div>
    </div>

    <div class="speech-box">
      <div class="speech-header">
        <span>Paso 5: La Petición Presupuestaria CAPEX con Evidencia Matemática (2 Minutos)</span>
        <span class="badge badge-orange">Minuto 5.5 a 7.5</span>
      </div>
      <div class="speech-quote">
        "Para cerrar, quiero llamar su atención sobre las 2 alertas predictivas de capacidad. Nuestro algoritmo de Zabbix analiza el ritmo diario de consumo y nos advierte hoy que el disco de base de datos de Presea llegará a su límite en exactamente <strong>23 días</strong>, y el clúster de servidores virtuales en <strong>48 días</strong>.<br><br>
        No venimos a pedir fondos de emergencia cuando el sistema colapse: venimos con 3 semanas de anticipación a solicitar la aprobación de la ampliación de almacenamiento por un monto de $X. Esto nos permitirá comprar con precio regular, coordinar la ventana de instalación sin cortes de servicio y blindar las operaciones de los próximos dos años."
      </div>
      <div class="speech-rationale">
        Objetivo: Conseguir la aprobación del presupuesto de hardware fundamentado en una proyección matemática irrefutable.
      </div>
    </div>
  </div>

  <!-- ==================== PÁGINA 9: MATRIZ DE OBJECIONES ==================== -->
  <div class="page">
    <div class="content-header">
      <div>
        <h2 class="content-title">8. Matriz de Objeciones y Preguntas Difíciles (Q&A)</h2>
        <p class="content-subtitle">Respuestas Técnicas y Financieras ante los Cuestionamientos de la Alta Dirección</p>
      </div>
      <div class="content-tag">Defensa Ejecutiva</div>
    </div>

    <p>
      A continuación se presentan las 5 preguntas más desafiantes que los directores y dueños de empresa suelen realizar y la argumentación exacta que debe utilizar la Gerencia de IT:
    </p>

    <div class="qa-box">
      <div class="qa-question">P1. "Con todo lo que invertimos en tecnología, ¿por qué no tenemos 100% de disponibilidad?"</div>
      <div class="qa-answer">
        <strong>Respuesta del Gerente:</strong> <em>"En la industria tecnológica global, el 100% de disponibilidad es una trampa técnica y financiera. Para pasar del 99.82% actual al 100% tendríamos que duplicar completamente cada cable, enlace, transformador y contratar triples enlaces satelitales, lo que multiplicaría el presupuesto por diez sin aportar valor al negocio. Además, un 100% teórico impediría aplicar actualizaciones de seguridad de Windows y parches de ciberseguridad. Nuestro objetivo del 99.50% es el punto óptimo de ingeniería donde la empresa opera sin riesgo y el presupuesto se mantiene eficiente."</em>
      </div>
    </div>

    <div class="qa-box">
      <div class="qa-question">P2. "El jefe de obra de San Juan me comentó que 'a veces internet anda lento'. ¿Cómo sé que este 99.64% es real?"</div>
      <div class="qa-answer">
        <strong>Respuesta del Gerente:</strong> <em>"Entiendo perfectamente esa percepción y por eso implementamos este monitoreo. La telemetría de Zabbix mide cada minuto el enrutador central de San Juan y los túneles VPN hacia Rosario. El 99.64% refleja que los servicios de obra (Presea, correos, partes de equipos y telefonía) estuvieron operativos y conectados. En faenas cordilleranas pueden existir tormentas de nieve o microinterrupciones de 30 segundos en la antena satelital que un usuario percibe como lentitud momentánea, pero la infraestructura se reconecta de inmediato y nunca dejó de operar la faena."</em>
      </div>
    </div>

    <div class="qa-box">
      <div class="qa-question">P3. "¿No podemos esperar a fin de año o al próximo ejercicio fiscal para ampliar los discos de Presea?"</div>
      <div class="qa-answer">
        <strong>Respuesta del Gerente:</strong> <em>"Matemáticamente es imposible sin detener la empresa. El volumen D: tiene 2.07 TB y está al 89.2% de capacidad. Con la tasa de generación de comprobantes, remitos y compras actuales, se consumen 14.2 Gigabytes netos por día. Si no actuamos, en el día 23 el motor SQL Server detendrá automáticamente sus transacciones por falta de espacio para los archivos de log. El costo de tener el ERP caído durante un día de cierre supera con creces el costo del almacenamiento que estamos solicitando hoy."</em>
      </div>
    </div>

    <div class="qa-box">
      <div class="qa-question">P4. "¿Quién me garantiza que este informe no fue 'retocado' a mano para que los números den bien?"</div>
      <div class="qa-answer">
        <strong>Respuesta del Gerente:</strong> <em>"Este dashboard no es una planilla Excel manual donde alguien carga datos. Es una conexión API directa y auditada entre nuestro servidor central Zabbix 7.0 LTS en Linux y Grafana 11 Enterprise. Cada indicador de Uptime y cada incidente proviene de tablas históricas inalterables del servidor con sello de tiempo (timestamp). Cualquier auditor externo o miembro del Directorio puede acceder directamente al sistema en <code>http://172.27.210.154:3005</code> y verificar la telemetría en vivo segundo a segundo."</em>
      </div>
    </div>

    <div class="qa-box">
      <div class="qa-question">P5. "¿Qué beneficio concreto le trae a Milicic adoptar esta metodología de Error Budget?"</div>
      <div class="qa-answer">
        <strong>Respuesta del Gerente:</strong> <em>"Nos da previsibilidad y disciplina. El Error Budget nos dice exactamente cuánto riesgo podemos asumir. Si cerramos el mes con un 64% de presupuesto a favor como hoy, la Gerencia de IT puede programar migraciones de software y mejoras sin temor a afectar la operación. Si en algún mes consumimos más del 80% del presupuesto, automáticamente congelamos cambios para priorizar la estabilidad de las obras. Es la herramienta que nos permite innovar de forma segura."</em>
      </div>
    </div>
  </div>

  <!-- ==================== PÁGINA 10: FIRMAS Y HOJA DE RUTA ==================== -->
  <div class="page">
    <div class="content-header">
      <div>
        <h2 class="content-title">9. Hoja de Ruta, Auditoría y Aprobaciones</h2>
        <p class="content-subtitle">Compromiso de Gestión Mensual y Validación Formal de la Dirección</p>
      </div>
      <div class="content-tag">Cierre Institucional</div>
    </div>

    <h3>9.1 Plan de Acción y Próximos Pasos para el Ciclo Operativo</h3>
    <table class="milicic-table">
      <thead>
        <tr>
          <th style="width: 25%;">Acción Estratégica</th>
          <th style="width: 20%;">Responsable</th>
          <th style="width: 20%;">Plazo Límite</th>
          <th style="width: 35%;">Resultado Esperado y Medición</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Adquisición y Expansión Storage SQL</strong><br>Aprobación orden de compra LUN SAN</td>
          <td>Gerencia de TI / Compras</td>
          <td>15 Días Hábiles</td>
          <td>Llevar la saturación proyectada de <code>SRO-SQL01</code> a más de 365 días libres.</td>
        </tr>
        <tr>
          <td><strong>Revisión de Cronograma Backups</strong><br>Auditoría de ventanas Veeam / SQL</td>
          <td>Jefatura de Infraestructura</td>
          <td>Inmediato (7 Días)</td>
          <td>Garantizar cero colisiones de I/O nocturnas en Datacenter Rosario.</td>
        </tr>
        <tr>
          <td><strong>Balanceo de Enlaces San Juan</strong><br>Optimización de políticas de QoS SD-WAN</td>
          <td>Especialista en Redes & Comunicaciones</td>
          <td>30 Días</td>
          <td>Priorizar tráfico de Presea y VoIP sobre enlaces Starlink en alta montaña.</td>
        </tr>
        <tr>
          <td><strong>Cierre de Snapshot Mensual</strong><br>Generación de reporte <code>milicic-exec-2026-10</code></td>
          <td>Automatización Zabbix / Grafana</td>
          <td>Cierre de Mes (Día 30)</td>
          <td>Publicación del registro inmutable para auditoría del Directorio.</td>
        </tr>
      </tbody>
    </table>

    <div class="callout callout-blue">
      <div class="callout-title">Declaración de Conformidad Técnica</div>
      La infraestructura tecnológica de Milicic S.A. ha operado durante el periodo auditado bajo los estándares corporativos de gobernanza de TI, alcanzando un <strong>Uptime Ponderado del 99.82%</strong> y un cumplimiento estricto de las directivas de ciberseguridad, respaldo energético y continuidad en campamentos mineros.
    </div>

    <div class="signatures-grid">
      <div class="signature-card">
        <strong>Ing. Matías Larenti</strong>
        Líder de Infraestructura & Ciberseguridad<br>
        Milicic S.A.
      </div>
      <div class="signature-card">
        <strong>Gerencia de TI & Comunicaciones</strong>
        Dirección de Tecnología de la Información<br>
        Milicic S.A.
      </div>
      <div class="signature-card">
        <strong>Directorio / Gerencia General</strong>
        Aprobación de Gestión & Inversiones CAPEX<br>
        Milicic S.A.
      </div>
    </div>
  </div>

</body>
</html>
`;

const outputHtmlGerencia = path.resolve(__dirname, './manual_ejecutivo_dashboard_milicic.html');
const outputHtmlScratch = path.resolve(__dirname, '../scratch/manual_ejecutivo_dashboard_milicic.html');
const outputPdfGerencia = path.resolve(__dirname, './Manual_Ejecutivo_Dashboard_SLA_Milicic.pdf');
const outputPdfDocs = path.resolve(__dirname, '../docs/Manual_Ejecutivo_Dashboard_SLA_Milicic.pdf');
const outputPdfReports = path.resolve(__dirname, '../reports/Manual_Ejecutivo_Dashboard_SLA_Milicic.pdf');

fs.mkdirSync(path.dirname(outputHtmlScratch), { recursive: true });
fs.mkdirSync(path.dirname(outputPdfDocs), { recursive: true });
fs.mkdirSync(path.dirname(outputPdfReports), { recursive: true });

fs.writeFileSync(outputHtmlGerencia, htmlContent, 'utf-8');
fs.writeFileSync(outputHtmlScratch, htmlContent, 'utf-8');
console.log(`[build-manual] ✅ Archivo HTML generado exitosamente en Gerencia/ y scratch/ (${htmlContent.length} bytes)`);

// Ejecutar generador CDP
const pdfScriptPath = path.resolve(__dirname, '../.agents/skills/milicic-corporate-docs/scripts/generate-pdf.js');

console.log('[build-manual] Iniciando compilación de PDF institucional vía CDP...');
const cp = spawn('node', [
  pdfScriptPath,
  outputHtmlGerencia,
  outputPdfGerencia,
  '--title',
  'MILICIC S.A. | Gerencia de TI & Infraestructura'
], { stdio: 'inherit' });

cp.on('close', (code) => {
  if (code === 0) {
    fs.copyFileSync(outputPdfGerencia, outputPdfDocs);
    fs.copyFileSync(outputPdfGerencia, outputPdfReports);
    console.log(`[build-manual] ✅ PDF compilado y copiado a:`);
    console.log(`  - ${outputPdfGerencia}`);
    console.log(`  - ${outputPdfDocs}`);
    console.log(`  - ${outputPdfReports}`);
  } else {
    console.error(`[build-manual] ❌ Error al compilar PDF (código ${code})`);
    process.exit(code);
  }
});

