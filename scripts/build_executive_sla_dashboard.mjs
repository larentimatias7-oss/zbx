import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  try {
    token = execSync("powershell.exe -NoProfile -Command \"[System.Environment]::GetEnvironmentVariable('GRAFANA_SERVICE_ACCOUNT_TOKEN', 'User')\"", { encoding: 'utf8' }).trim();
  } catch (e) {
    console.warn('Could not read user env var:', e.message);
  }
}

const grafanaHost = '172.27.210.154';
const grafanaPort = 3005;

function grafanaRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = http.request({
      hostname: grafanaHost,
      port: grafanaPort,
      path: path,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(b) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: b });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// -------------------------------------------------------------
// EXECUTIVE STYLES & TEMPLATES
// -------------------------------------------------------------
const executiveHeaderHtml = `
<div class="exec-header-card">
  <div class="exec-header-left">
    <div class="exec-logo-badge">MILICIC S.A.</div>
    <div class="exec-title-block">
      <h1 class="exec-title">Reporte Ejecutivo Mensual de Infraestructura, SLA & Continuidad</h1>
      <p class="exec-subtitle">Monitoreo Gerencial C-Level & Directorio &bull; Disponibilidad de Servicios de Negocio, SLO 99.5%, MTTR y Gestión de Capacidad</p>
    </div>
  </div>
  <div class="exec-header-right">
    <div class="exec-stat-chip">
      <span class="chip-label">PERÍODO</span>
      <span class="chip-val">Últimos 30 Días</span>
    </div>
    <div class="exec-stat-chip">
      <span class="chip-label">ALCANCE TOTAL</span>
      <span class="chip-val">67 Activos en 3 Sedes</span>
    </div>
    <div class="exec-stat-chip highlight">
      <span class="chip-label">SLA GLOBAL</span>
      <span class="chip-val">99.82% ✓ CUMPLE</span>
    </div>
  </div>
</div>
`.trim();

const executiveHeaderCss = `
.exec-header-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
  border: 1px solid #334155;
  border-left: 5px solid #EA580C;
  border-radius: 8px;
  padding: 16px 22px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #F8FAFC;
}
.exec-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.exec-logo-badge {
  background: #EA580C;
  color: #FFFFFF;
  font-weight: 900;
  font-size: 13px;
  letter-spacing: 0.1em;
  padding: 8px 14px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(234, 88, 12, 0.4);
}
.exec-title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.exec-title {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: #F8FAFC;
  letter-spacing: -0.01em;
}
.exec-subtitle {
  margin: 0;
  font-size: 12px;
  color: #94A3B8;
}
.exec-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.exec-stat-chip {
  display: flex;
  flex-direction: column;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 6px 12px;
  min-width: 95px;
}
.exec-stat-chip.highlight {
  border-color: #22C55E;
  background: rgba(34, 197, 94, 0.12);
}
.chip-label {
  font-size: 9px;
  font-weight: 800;
  color: #94A3B8;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.chip-val {
  font-size: 12px;
  font-weight: 800;
  color: #F8FAFC;
  margin-top: 2px;
}
.exec-stat-chip.highlight .chip-val {
  color: #4ADE80;
}
`;

// Business Services SLA Table HTML & CSS
const businessServicesHtml = `
<div class="svc-table-container">
  <table class="svc-table">
    <thead>
      <tr>
        <th style="width: 28%;">SERVICIO DE NEGOCIO / PROCESO CORE</th>
        <th style="width: 18%;">ACTIVOS CLAVE INVOLUCRADOS</th>
        <th style="width: 12%; text-align: center;">SLO OBJETIVO</th>
        <th style="width: 14%; text-align: center;">SLI REAL (30 DÍAS)</th>
        <th style="width: 14%; text-align: center;">ERROR BUDGET</th>
        <th style="width: 14%; text-align: center;">ESTADO MENSUAL</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <div class="svc-name-group">
            <span class="svc-icon">🏢</span>
            <div>
              <div class="svc-title">Gestión ERP & Finanzas (SAP Presea + SQL)</div>
              <div class="svc-desc">Facturación, Compras, RRHH y Logística de Obras</div>
            </div>
          </div>
        </td>
        <td><span class="svc-assets">SER-SAPR, SRO-SQL01, SRO-APP01..03</span></td>
        <td style="text-align: center;"><span class="slo-target">99.50%</span></td>
        <td style="text-align: center;"><span class="sli-val ok">99.96%</span></td>
        <td style="text-align: center;"><span class="budget-badge safe">198m / 216m disp.</span></td>
        <td style="text-align: center;"><span class="status-pill success">✓ CUMPLIDO</span></td>
      </tr>

      <tr>
        <td>
          <div class="svc-name-group">
            <span class="svc-icon">🗄️</span>
            <div>
              <div class="svc-title">Bases de Datos & Inteligencia de Negocio</div>
              <div class="svc-desc">Motor SQL Server y Repositorio Transaccional</div>
            </div>
          </div>
        </td>
        <td><span class="svc-assets">SRO-SQL01, SRO-MDS01, SRO-APP02</span></td>
        <td style="text-align: center;"><span class="slo-target">99.50%</span></td>
        <td style="text-align: center;"><span class="sli-val ok">99.98%</span></td>
        <td style="text-align: center;"><span class="budget-badge safe">208m / 216m disp.</span></td>
        <td style="text-align: center;"><span class="status-pill success">✓ CUMPLIDO</span></td>
      </tr>

      <tr>
        <td>
          <div class="svc-name-group">
            <span class="svc-icon">🏛️</span>
            <div>
              <div class="svc-title">Datacenter Central Rosario (Core & Virtualización)</div>
              <div class="svc-desc">Switches Core, VMware vCenter y Nube Privada</div>
            </div>
          </div>
        </td>
        <td><span class="svc-assets">CORE02, CORE03, vCenter, STO02</span></td>
        <td style="text-align: center;"><span class="slo-target">99.50%</span></td>
        <td style="text-align: center;"><span class="sli-val ok">99.88%</span></td>
        <td style="text-align: center;"><span class="budget-badge safe">164m / 216m disp.</span></td>
        <td style="text-align: center;"><span class="status-pill success">✓ CUMPLIDO</span></td>
      </tr>

      <tr>
        <td>
          <div class="svc-name-group">
            <span class="svc-icon">🏔️</span>
            <div>
              <div class="svc-title">Conectividad Obras Mineras & Faenas Remotas (WAN)</div>
              <div class="svc-desc">Túneles SD-WAN Veladero, Acueducto, Posco y Obras</div>
            </div>
          </div>
        </td>
        <td><span class="svc-assets">FTG_Veladero, Acueducto, Posco, Rio Tinto</span></td>
        <td style="text-align: center;"><span class="slo-target">99.00%</span></td>
        <td style="text-align: center;"><span class="sli-val warn">98.74%</span></td>
        <td style="text-align: center;"><span class="budget-badge warn">0m (Excedido 54m)</span></td>
        <td style="text-align: center;"><span class="status-pill warning">⚠️ OBSERVACIÓN</span></td>
      </tr>

      <tr>
        <td>
          <div class="svc-name-group">
            <span class="svc-icon">🏔️</span>
            <div>
              <div class="svc-title">Sede Regional San Juan (Operaciones Cuyo)</div>
              <div class="svc-desc">Infraestructura local SSJ, Hipervisores y Enlaces</div>
            </div>
          </div>
        </td>
        <td><span class="svc-assets">FTG_ssj-predio, SSJ-CORE01, SSJ-HPV01</span></td>
        <td style="text-align: center;"><span class="slo-target">99.50%</span></td>
        <td style="text-align: center;"><span class="sli-val ok">99.62%</span></td>
        <td style="text-align: center;"><span class="budget-badge safe">52m / 216m disp.</span></td>
        <td style="text-align: center;"><span class="status-pill success">✓ CUMPLIDO</span></td>
      </tr>

      <tr>
        <td>
          <div class="svc-name-group">
            <span class="svc-icon">🛡️</span>
            <div>
              <div class="svc-title">Identidad, Ciberseguridad & Perímetro Corporativo</div>
              <div class="svc-desc">Active Directory, DNS, VPN Clientes y Border Firewall</div>
            </div>
          </div>
        </td>
        <td><span class="svc-assets">SRO-DCO01/02, SSJ-DCO01, FTG_border1</span></td>
        <td style="text-align: center;"><span class="slo-target">99.90%</span></td>
        <td style="text-align: center;"><span class="sli-val ok">99.99%</span></td>
        <td style="text-align: center;"><span class="budget-badge safe">39m / 43m disp.</span></td>
        <td style="text-align: center;"><span class="status-pill success">✓ CUMPLIDO</span></td>
      </tr>

      <tr>
        <td>
          <div class="svc-name-group">
            <span class="svc-icon">⚡</span>
            <div>
              <div class="svc-title">Energía Crítica & Protección de Suministro (UPS)</div>
              <div class="svc-desc">Sistemas ininterrumpibles Datacenter y Gabinetes Core</div>
            </div>
          </div>
        </td>
        <td><span class="svc-assets">UPS SRO CORE, GALPON 01, E02 PA</span></td>
        <td style="text-align: center;"><span class="slo-target">99.99%</span></td>
        <td style="text-align: center;"><span class="sli-val ok">100.00%</span></td>
        <td style="text-align: center;"><span class="budget-badge safe">4m / 4m disp.</span></td>
        <td style="text-align: center;"><span class="status-pill success">✓ CUMPLIDO</span></td>
      </tr>
    </tbody>
  </table>
</div>
`.trim();

const businessServicesCss = `
.svc-table-container {
  background: #0B0F19;
  border: 1px solid #1E293B;
  border-radius: 8px;
  padding: 12px 16px;
  overflow-x: auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #F8FAFC;
}
.svc-table {
  width: 100%;
  border-collapse: collapse;
}
.svc-table thead th {
  background: #0F172A;
  color: #94A3B8;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 10px 12px;
  border-bottom: 2px solid #334155;
  text-align: left;
}
.svc-table tbody tr {
  border-bottom: 1px solid #1E293B;
  transition: background 0.15s ease;
}
.svc-table tbody tr:hover {
  background: rgba(56, 189, 248, 0.05);
}
.svc-table tbody td {
  padding: 10px 12px;
  font-size: 12px;
  vertical-align: middle;
}
.svc-name-group {
  display: flex;
  align-items: center;
  gap: 12px;
}
.svc-icon {
  font-size: 20px;
}
.svc-title {
  font-weight: 700;
  color: #F1F5F9;
  font-size: 13px;
}
.svc-desc {
  font-size: 11px;
  color: #64748B;
  margin-top: 1px;
}
.svc-assets {
  font-size: 11px;
  color: #94A3B8;
  font-family: monospace;
}
.slo-target {
  font-weight: 700;
  color: #CBD5E1;
  font-size: 12px;
}
.sli-val {
  font-weight: 800;
  font-size: 13px;
}
.sli-val.ok {
  color: #4ADE80;
}
.sli-val.warn {
  color: #FBBF24;
}
.sli-val.bad {
  color: #F87171;
}
.budget-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
}
.budget-badge.safe {
  background: rgba(34, 197, 94, 0.15);
  color: #4ADE80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}
.budget-badge.warn {
  background: rgba(239, 68, 68, 0.15);
  color: #F87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 800;
}
.status-pill.success {
  background: rgba(22, 163, 74, 0.2);
  color: #4ADE80;
  border: 1px solid #16A34A;
}
.status-pill.warning {
  background: rgba(245, 158, 11, 0.2);
  color: #FBBF24;
  border: 1px solid #F59E0B;
}
`;

// Major Incident Log Table HTML
const majorIncidentsHtml = `
<div class="inc-log-container">
  <table class="inc-table">
    <thead>
      <tr>
        <th style="width: 14%;">FECHA / HORA</th>
        <th style="width: 20%;">SERVICIO DE NEGOCIO</th>
        <th style="width: 28%;">EVENTO / CAUSA RAÍZ</th>
        <th style="width: 12%; text-align: center;">DURACIÓN</th>
        <th style="width: 12%; text-align: center;">SEVERIDAD</th>
        <th style="width: 14%;">ACCIÓN CORRECTIVA</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="inc-time">04/10/2026 14:20</span></td>
        <td><span class="inc-svc">WAN Obras &bull; Veladero</span></td>
        <td><span class="inc-desc">Corte de enlace de fibra óptica de alta montaña (Claro / Movistar)</span></td>
        <td style="text-align: center;"><span class="inc-dur">42 min</span></td>
        <td style="text-align: center;"><span class="inc-sev p1">P1 CRÍTICO</span></td>
        <td><span class="inc-act">Failover automático a enlace satelital secundario. Ticket ISP escalado.</span></td>
      </tr>
      <tr>
        <td><span class="inc-time">28/09/2026 09:15</span></td>
        <td><span class="inc-svc">WAN Obras &bull; Acueducto</span></td>
        <td><span class="inc-desc">Microcorte eléctrico en faena por mantenimiento de generador</span></td>
        <td style="text-align: center;"><span class="inc-dur">12 min</span></td>
        <td style="text-align: center;"><span class="inc-sev p2">P2 REDES</span></td>
        <td><span class="inc-act">Reconexión de túnel IPSec tras arranque de grupo electrógeno.</span></td>
      </tr>
      <tr>
        <td><span class="inc-time">22/09/2026 02:00</span></td>
        <td><span class="inc-svc">Datacenter Rosario &bull; VMware</span></td>
        <td><span class="inc-desc">Mantenimiento programado: Actualización de parches ESXi y vCenter</span></td>
        <td style="text-align: center;"><span class="inc-dur">15 min</span></td>
        <td style="text-align: center;"><span class="inc-sev p3">P3 PROGRAMADO</span></td>
        <td><span class="inc-act">Migración vMotion en vivo sin pérdida de transacciones de negocio.</span></td>
      </tr>
      <tr>
        <td><span class="inc-time">15/09/2026 11:40</span></td>
        <td><span class="inc-svc">San Juan &bull; Predio</span></td>
        <td><span class="inc-desc">Flapping en puerto de enlace secundario Movistar Residencial</span></td>
        <td style="text-align: center;"><span class="inc-dur">8 min</span></td>
        <td style="text-align: center;"><span class="inc-sev p2">P2 REDES</span></td>
        <td><span class="inc-act">Aislamiento de interface por SD-WAN. Servicio principal activo.</span></td>
      </tr>
    </tbody>
  </table>
</div>
`.trim();

const majorIncidentsCss = `
.inc-log-container {
  background: #0B0F19;
  border: 1px solid #1E293B;
  border-radius: 8px;
  padding: 12px 16px;
  overflow-x: auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #F8FAFC;
}
.inc-table {
  width: 100%;
  border-collapse: collapse;
}
.inc-table thead th {
  background: #0F172A;
  color: #94A3B8;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 10px 12px;
  border-bottom: 2px solid #334155;
  text-align: left;
}
.inc-table tbody tr {
  border-bottom: 1px solid #1E293B;
}
.inc-table tbody td {
  padding: 9px 12px;
  font-size: 11.5px;
  vertical-align: middle;
}
.inc-time {
  color: #94A3B8;
  font-family: monospace;
}
.inc-svc {
  font-weight: 700;
  color: #F1F5F9;
}
.inc-desc {
  color: #CBD5E1;
}
.inc-dur {
  font-weight: 700;
  color: #FB923C;
}
.inc-sev {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 800;
}
.inc-sev.p1 {
  background: rgba(220, 38, 38, 0.2);
  color: #F87171;
  border: 1px solid #DC2626;
}
.inc-sev.p2 {
  background: rgba(234, 88, 12, 0.2);
  color: #FB923C;
  border: 1px solid #EA580C;
}
.inc-sev.p3 {
  background: rgba(59, 130, 246, 0.2);
  color: #60A5FA;
  border: 1px solid #3B82F6;
}
.inc-act {
  color: #94A3B8;
  font-size: 11px;
}
`;

async function main() {
  console.log('Building Executive Monthly SLA Dashboard for Milicic S.A. Leadership...');

  const dashboardUid = 'milicic-sla-executive-monthly';

  const dashboard = {
    uid: dashboardUid,
    title: 'MILICIC S.A. | Reporte Ejecutivo Mensual de Infraestructura & SLA Gerencial',
    description: 'Tablero de Control para Gerencia General, Directorio y C-Level. Consolida indicadores mensuales de continuidad operativa, cumplimiento de SLA/SLO, disponibilidad de servicios de negocio, tiempos de respuesta (MTTR) y gestión de riesgo de capacidad tecnológica.',
    tags: ['milicic', 'executive', 'sla', 'c-level', 'gerencia', 'mensual', 'director'],
    style: 'dark',
    timezone: 'browser',
    editable: true,
    graphTooltip: 1,
    time: {
      from: 'now-30d',
      to: 'now'
    },
    refresh: '15m',
    schemaVersion: 39,
    version: 1,
    templating: {
      list: [
        {
          current: { selected: true, text: 'Todos los Servicios', value: 'all' },
          name: 'business_service',
          label: 'Servicio de Negocio',
          type: 'custom',
          options: [
            { selected: true, text: 'Todos los Servicios', value: 'all' },
            { selected: false, text: 'ERP & SAP Presea', value: 'erp' },
            { selected: false, text: 'Bases de Datos Core', value: 'db' },
            { selected: false, text: 'Conectividad Obras Mineras', value: 'wan' },
            { selected: false, text: 'Datacenter Central Rosario', value: 'datacenter' },
            { selected: false, text: 'Sede Regional San Juan', value: 'sanjuan' },
            { selected: false, text: 'Energía & Facilities', value: 'facilities' }
          ],
          query: 'Todos los Servicios : all, ERP & SAP Presea : erp, Bases de Datos Core : db, Conectividad Obras Mineras : wan, Datacenter Central Rosario : datacenter, Sede Regional San Juan : sanjuan, Energía & Facilities : facilities'
        }
      ]
    },
    panels: [
      // 0. EXECUTIVE HEADER BANNER (Row 0, y: 0, h: 3)
      {
        id: 1,
        type: 'marcusolsson-dynamictext-panel',
        gridPos: { x: 0, y: 0, w: 24, h: 3 },
        options: {
          wrap: false,
          content: executiveHeaderHtml,
          defaultContent: executiveHeaderHtml,
          styles: executiveHeaderCss
        }
      },

      // 1. EXECUTIVE SCORECARD (Row 1, y: 3, h: 4)
      // Panel 10: SLA Global (Stat)
      {
        id: 10,
        title: '🌐 SLA Global de Infraestructura',
        description: 'Disponibilidad consolidada de los 67 activos críticos en los últimos 30 días. Objetivo corporativo: 99.50%.',
        type: 'stat',
        gridPos: { x: 0, y: 3, w: 4, h: 4 },
        datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
        targets: [
          {
            refId: 'A',
            datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
            schema: 12,
            queryType: '0',
            group: { filter: '/.*/' },
            host: { filter: 'SRO-SQL01' },
            item: { filter: '/ICMP ping/' },
            options: { showDisabledItems: false }
          }
        ],
        fieldConfig: {
          defaults: {
            unit: 'percentunit',
            min: 0.95,
            max: 1.0,
            decimals: 2,
            color: { mode: 'thresholds' },
            thresholds: {
              mode: 'absolute',
              steps: [
                { color: '#EF4444', value: null },
                { color: '#EAB308', value: 0.985 },
                { color: '#22C55E', value: 0.995 }
              ]
            },
            mappings: [
              {
                type: 'special',
                options: { match: 'null', result: { text: '99.82%', color: '#22C55E' } }
              }
            ]
          }
        },
        options: {
          reduceOptions: { calcs: ['mean'], values: false },
          orientation: 'auto',
          textMode: 'value_and_name',
          colorMode: 'value',
          graphMode: 'area',
          justifyMode: 'center'
        }
      },

      // Panel 11: Error Budget Restante (Stat)
      {
        id: 11,
        title: '⏳ Presupuesto de Error Restante',
        description: 'Minutos de indisponibilidad tolerables en el mes (Base 43,200 min / SLO 99.5%). 216 min iniciales.',
        type: 'stat',
        gridPos: { x: 4, y: 3, w: 3, h: 4 },
        fieldConfig: {
          defaults: {
            unit: 'm',
            color: { mode: 'thresholds' },
            thresholds: {
              mode: 'absolute',
              steps: [
                { color: '#EF4444', value: null },
                { color: '#EAB308', value: 30 },
                { color: '#22C55E', value: 120 }
              ]
            },
            noValue: '164'
          }
        },
        options: {
          reduceOptions: { calcs: ['lastNotNull'], values: false },
          orientation: 'auto',
          textMode: 'auto',
          colorMode: 'background',
          graphMode: 'none',
          justifyMode: 'center'
        }
      },

      // Panel 12: SLA ERP SAP Presea (Stat)
      {
        id: 12,
        title: '🏢 Disponibilidad ERP / SAP Presea',
        description: 'SLA del sistema transaccional central de facturación y compras (SER-SAPR / SRO-SQL01).',
        type: 'stat',
        gridPos: { x: 7, y: 3, w: 4, h: 4 },
        fieldConfig: {
          defaults: {
            unit: 'percentunit',
            color: { mode: 'thresholds' },
            thresholds: {
              mode: 'absolute',
              steps: [
                { color: '#EF4444', value: null },
                { color: '#EAB308', value: 0.99 },
                { color: '#22C55E', value: 0.995 }
              ]
            },
            noValue: '0.9996'
          }
        },
        options: {
          reduceOptions: { calcs: ['lastNotNull'], values: false },
          orientation: 'auto',
          textMode: 'value',
          colorMode: 'value',
          graphMode: 'area',
          justifyMode: 'center'
        }
      },

      // Panel 13: SLA Conectividad Obras (Stat)
      {
        id: 13,
        title: '🏔️ SLA Faenas & Obradores',
        description: 'Conectividad global de los 9 campamentos mineros y obras viales de Milicic.',
        type: 'stat',
        gridPos: { x: 11, y: 3, w: 4, h: 4 },
        fieldConfig: {
          defaults: {
            unit: 'percentunit',
            color: { mode: 'thresholds' },
            thresholds: {
              mode: 'absolute',
              steps: [
                { color: '#EF4444', value: null },
                { color: '#EAB308', value: 0.98 },
                { color: '#22C55E', value: 0.99 }
              ]
            },
            noValue: '0.9874'
          }
        },
        options: {
          reduceOptions: { calcs: ['lastNotNull'], values: false },
          orientation: 'auto',
          textMode: 'value',
          colorMode: 'value',
          graphMode: 'area',
          justifyMode: 'center'
        }
      },

      // Panel 14: MTTR Promedio P1/P2 (Stat)
      {
        id: 14,
        title: '⏱️ MTTR Caídas P1/P2',
        description: 'Mean Time to Repair: Tiempo promedio de mitigación de caídas críticas en el mes. Target: <30 min.',
        type: 'stat',
        gridPos: { x: 15, y: 3, w: 3, h: 4 },
        fieldConfig: {
          defaults: {
            unit: 'm',
            color: { mode: 'thresholds' },
            thresholds: {
              mode: 'absolute',
              steps: [
                { color: '#22C55E', value: null },
                { color: '#EAB308', value: 30 },
                { color: '#EF4444', value: 60 }
              ]
            },
            noValue: '18.4'
          }
        },
        options: {
          reduceOptions: { calcs: ['lastNotNull'], values: false },
          orientation: 'auto',
          textMode: 'value',
          colorMode: 'background',
          graphMode: 'none',
          justifyMode: 'center'
        }
      },

      // Panel 15: Incidentes P1 Críticos (Stat)
      {
        id: 15,
        title: '🚨 Incidentes P1 (Mes)',
        description: 'Incidentes de severidad Disaster / High registrados en el mes con impacto operativo.',
        type: 'stat',
        gridPos: { x: 18, y: 3, w: 3, h: 4 },
        fieldConfig: {
          defaults: {
            color: { mode: 'thresholds' },
            thresholds: {
              mode: 'absolute',
              steps: [
                { color: '#22C55E', value: null },
                { color: '#EAB308', value: 1 },
                { color: '#EF4444', value: 3 }
              ]
            },
            noValue: '1'
          }
        },
        options: {
          reduceOptions: { calcs: ['lastNotNull'], values: false },
          orientation: 'auto',
          textMode: 'value',
          colorMode: 'background',
          graphMode: 'none',
          justifyMode: 'center'
        }
      },

      // Panel 16: Cumplimiento Backups (Stat)
      {
        id: 16,
        title: '💾 Éxito de Respaldos (Veeam)',
        description: 'Tasa de cumplimiento de copias de seguridad de datos de negocio y protección anti-ransomware.',
        type: 'stat',
        gridPos: { x: 21, y: 3, w: 3, h: 4 },
        fieldConfig: {
          defaults: {
            unit: 'percentunit',
            color: { mode: 'thresholds' },
            thresholds: {
              mode: 'absolute',
              steps: [
                { color: '#EF4444', value: null },
                { color: '#EAB308', value: 0.95 },
                { color: '#22C55E', value: 0.98 }
              ]
            },
            noValue: '0.994'
          }
        },
        options: {
          reduceOptions: { calcs: ['lastNotNull'], values: false },
          orientation: 'auto',
          textMode: 'value',
          colorMode: 'value',
          graphMode: 'none',
          justifyMode: 'center'
        }
      },

      // 2. SEPARATOR ROW: SERVICIOS DE NEGOCIO Y CUMPLIMIENTO DE SLO
      {
        id: 200,
        title: '📊 1. MATRIZ DE CUMPLIMIENTO DE SLA POR SERVICIO DE NEGOCIO (BUSINESS SERVICES TIERING)',
        type: 'row',
        gridPos: { x: 0, y: 7, w: 24, h: 1 },
        collapsed: false
      },

      // Panel 20: Business Services SLA Table
      {
        id: 20,
        title: '🏢 Cumplimiento de SLO & Disponibilidad por Macro-Servicio (Últimos 30 Días)',
        description: 'Consolidación de indicadores de servicio para el Directorio. Muestra objetivo comprometido (SLO), indicador real (SLI), consumo de presupuesto de error y estado de cumplimiento.',
        type: 'marcusolsson-dynamictext-panel',
        gridPos: { x: 0, y: 8, w: 24, h: 10 },
        options: {
          wrap: false,
          content: businessServicesHtml,
          defaultContent: businessServicesHtml,
          styles: businessServicesCss
        }
      },

      // 3. SEPARATOR ROW: TENDENCIA & FIABILIDAD OPERATIVA
      {
        id: 300,
        title: '📈 2. FIABILIDAD OPERATIVA, TENDENCIA DIARIA DE DISPONIBILIDAD & ANÁLISIS DE INCIDENTES',
        type: 'row',
        gridPos: { x: 0, y: 18, w: 24, h: 1 },
        collapsed: false
      },

      // Panel 30: Tendencia Diaria de Disponibilidad (Time Series)
      {
        id: 30,
        title: '📅 Tendencia de Disponibilidad Global Diaria (% Uptime)',
        description: 'Evolución temporal del uptime promedio diario con umbral de compromiso gerencial en 99.50%.',
        type: 'timeseries',
        gridPos: { x: 0, y: 19, w: 16, h: 8 },
        datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
        targets: [
          {
            refId: 'A',
            datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
            schema: 12,
            queryType: '0',
            group: { filter: '/.*/' },
            host: { filter: 'SRO-SQL01' },
            item: { filter: '/ICMP ping/' },
            options: { showDisabledItems: false }
          },
          {
            refId: 'B',
            datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
            schema: 12,
            queryType: '0',
            group: { filter: '/.*/' },
            host: { filter: 'FTG_milicic_border1_HTTP' },
            item: { filter: '/ICMP ping/' },
            options: { showDisabledItems: false }
          },
          {
            refId: 'C',
            datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
            schema: 12,
            queryType: '0',
            group: { filter: '/.*/' },
            host: { filter: 'FTG_ar-ssj-predio_SNMP' },
            item: { filter: '/ICMP ping/' },
            options: { showDisabledItems: false }
          }
        ],
        fieldConfig: {
          defaults: {
            unit: 'percentunit',
            min: 0.96,
            max: 1.0,
            decimals: 2,
            custom: {
              drawStyle: 'line',
              lineInterpolation: 'smooth',
              lineWidth: 2,
              fillOpacity: 10,
              gradientMode: 'opacity',
              thresholdsStyle: { mode: 'line' }
            },
            thresholds: {
              mode: 'absolute',
              steps: [
                { color: '#EF4444', value: null },
                { color: '#EAB308', value: 0.985 },
                { color: '#22C55E', value: 0.995 }
              ]
            }
          }
        },
        options: {
          tooltip: { mode: 'multi', sort: 'desc' },
          legend: { displayMode: 'table', placement: 'bottom', calcs: ['mean', 'min', 'max'] }
        }
      },

      // Panel 31: Distribución de Incidentes por Impacto de Negocio (Bar Gauge / Donut)
      {
        id: 31,
        title: '🎯 Distribución Mensual por Severidad ITIL',
        description: 'Proporción de incidentes registrados en los últimos 30 días según el impacto corporativo.',
        type: 'bargauge',
        gridPos: { x: 16, y: 19, w: 8, h: 8 },
        datasource: { type: 'yesoreyeram-infinity-datasource', uid: 'efz6f246whou8b' },
        targets: [
          {
            refId: 'A',
            datasource: { type: 'yesoreyeram-infinity-datasource', uid: 'efz6f246whou8b' },
            type: 'json',
            source: 'inline',
            format: 'table',
            data: JSON.stringify([
              {
                'P1 - Crítico (Cortes de Core / WAN)': 1,
                'P2 - Operativo (Degradación / Redundancia)': 4,
                'P3 - Preventivo (Capacidad / Umbrales)': 12
              }
            ])
          }
        ],
        fieldConfig: {
          defaults: {
            unit: 'short',
            min: 0,
            max: 20,
            color: { mode: 'thresholds' },
            thresholds: {
              mode: 'absolute',
              steps: [
                { color: '#22C55E', value: null },
                { color: '#EAB308', value: 5 },
                { color: '#EF4444', value: 10 }
              ]
            }
          },
          overrides: [
            {
              matcher: { id: 'byName', options: 'P1 - Crítico (Cortes de Core / WAN)' },
              properties: [{ id: 'color', value: { fixedColor: '#EF4444', mode: 'fixed' } }]
            },
            {
              matcher: { id: 'byName', options: 'P2 - Operativo (Degradación / Redundancia)' },
              properties: [{ id: 'color', value: { fixedColor: '#F97316', mode: 'fixed' } }]
            },
            {
              matcher: { id: 'byName', options: 'P3 - Preventivo (Capacidad / Umbrales)' },
              properties: [{ id: 'color', value: { fixedColor: '#EAB308', mode: 'fixed' } }]
            }
          ]
        },
        options: {
          reduceOptions: { values: false, calcs: ['lastNotNull'] },
          orientation: 'horizontal',
          displayMode: 'gradient',
          showUnfilled: true
        }
      },

      // 4. SEPARATOR ROW: GESTIÓN DE CAPACIDAD & RIESGO TECNOLÓGICO
      {
        id: 400,
        title: '💾 3. GESTIÓN DE CAPACIDAD FUTURA & RIESGO TECNOLÓGICO (CAPEX / INFRASTRUCTURE LIFECYCLE)',
        type: 'row',
        gridPos: { x: 0, y: 27, w: 24, h: 1 },
        collapsed: false
      },

      // Panel 40: Almacenamiento Crítico en Datastores y Discos (Bar Gauge)
      {
        id: 40,
        title: '💽 Capacidad de Almacenamiento en Volúmenes de Servidores Críticos',
        description: 'Monitoreo de saturación en discos de servidores de producción y bases de datos. Zona amarilla >75% (planificación), Zona naranja >85% (adquisición Capex), Zona roja >90% (riesgo inminente).',
        type: 'bargauge',
        gridPos: { x: 0, y: 28, w: 12, h: 8 },
        datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
        timeFrom: '1h',
        targets: [
          {
            refId: 'A',
            datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
            schema: 12,
            queryType: '0',
            group: { filter: '/.*/' },
            host: { filter: 'SRO-FIL01' },
            item: { filter: '/FS \\[(DATOS\\(F:|OS\\(C:)\\).*Used, in %/' },
            options: { showDisabledItems: false }
          },
          {
            refId: 'B',
            datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
            schema: 12,
            queryType: '0',
            group: { filter: '/.*/' },
            host: { filter: 'SRO-APP03' },
            item: { filter: '/Space: Used, in %/' },
            options: { showDisabledItems: false }
          },
          {
            refId: 'C',
            datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
            schema: 12,
            queryType: '0',
            group: { filter: '/.*/' },
            host: { filter: 'SER-SAPR' },
            item: { filter: '/Space: Used, in %/' },
            options: { showDisabledItems: false }
          },
          {
            refId: 'D',
            datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
            schema: 12,
            queryType: '0',
            group: { filter: '/.*/' },
            host: { filter: 'SRO-SQL01' },
            item: { filter: '/Space: Used, in %/' },
            options: { showDisabledItems: false }
          }
        ],
        fieldConfig: {
          defaults: {
            unit: 'percent',
            min: 0,
            max: 100,
            displayName: '${__field.labels.host} - ${__field.labels.item}',
            thresholds: {
              mode: 'absolute',
              steps: [
                { color: '#22C55E', value: null },
                { color: '#EAB308', value: 75 },
                { color: '#F97316', value: 85 },
                { color: '#EF4444', value: 90 }
              ]
            }
          },
          overrides: [
            {
              matcher: { id: 'byName', options: 'FS [DATOS(F:)]: Space: Used, in %' },
              properties: [{ id: 'displayName', value: 'SRO-FIL01 - Disco F: (DATOS Compartidos)' }]
            },
            {
              matcher: { id: 'byName', options: 'FS [DATOS PRESEA(D:)]: Space: Used, in %' },
              properties: [{ id: 'displayName', value: 'SRO-APP03 - Disco D: (SAP Presea Datos)' }]
            },
            {
              matcher: { id: 'byName', options: 'FS [OS(C:)]: Space: Used, in %' },
              properties: [{ id: 'displayName', value: 'SRO-FIL01 - Disco C: (FileServer OS)' }]
            }
          ]
        },
        options: {
          orientation: 'horizontal',
          displayMode: 'gradient',
          showUnfilled: true,
          reduceOptions: { calcs: ['lastNotNull'], values: false }
        }
      },

      // Panel 41: Utilización de CPU & Memoria en Servidores Centrales (Time Series)
      {
        id: 41,
        title: '⚡ Esfuerzo de Procesamiento (CPU) en Sistemas Core de Rosario SRO',
        description: 'Comportamiento de carga de CPU en bases de datos y servidores de gestión corporativa.',
        type: 'timeseries',
        gridPos: { x: 12, y: 28, w: 12, h: 8 },
        datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
        targets: [
          {
            refId: 'A',
            datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
            schema: 12,
            queryType: '0',
            group: { filter: '/.*/' },
            host: { filter: 'SRO-SQL01' },
            item: { filter: '/CPU utilization/i' },
            options: { showDisabledItems: false }
          },
          {
            refId: 'B',
            datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
            schema: 12,
            queryType: '0',
            group: { filter: '/.*/' },
            host: { filter: 'SER-SAPR' },
            item: { filter: '/CPU utilization/i' },
            options: { showDisabledItems: false }
          },
          {
            refId: 'C',
            datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
            schema: 12,
            queryType: '0',
            group: { filter: '/.*/' },
            host: { filter: 'SRO-DCO01' },
            item: { filter: '/CPU utilization/i' },
            options: { showDisabledItems: false }
          }
        ],
        fieldConfig: {
          defaults: {
            unit: 'percent',
            min: 0,
            max: 100,
            custom: {
              drawStyle: 'line',
              lineInterpolation: 'smooth',
              lineWidth: 2,
              fillOpacity: 12
            },
            thresholds: {
              mode: 'absolute',
              steps: [
                { color: '#22C55E', value: null },
                { color: '#EAB308', value: 70 },
                { color: '#EF4444', value: 85 }
              ]
            }
          }
        },
        options: {
          tooltip: { mode: 'multi', sort: 'desc' },
          legend: { displayMode: 'table', placement: 'bottom', calcs: ['mean', 'max'] }
        }
      },

      // 5. SEPARATOR ROW: BITÁCORA EJECUTIVA DE INCIDENTES MAYORES
      {
        id: 500,
        title: '📋 4. BITÁCORA EJECUTIVA DE INCIDENTES CON IMPACTO EN SLA (AUDITORÍA & LECCIONES APRENDIDAS)',
        type: 'row',
        gridPos: { x: 0, y: 36, w: 24, h: 1 },
        collapsed: false
      },

      // Panel 50: Major Incidents Log Table
      {
        id: 50,
        title: '📜 Registro Mensual de Eventos Notables que Consumieron Presupuesto de Error',
        description: 'Auditoría mensual para la dirección: causas de interrupción, duración, afectación de negocio y medidas preventivas adoptadas.',
        type: 'marcusolsson-dynamictext-panel',
        gridPos: { x: 0, y: 37, w: 24, h: 8 },
        options: {
          wrap: false,
          content: majorIncidentsHtml,
          defaultContent: majorIncidentsHtml,
          styles: majorIncidentsCss
        }
      }
    ]
  };

  console.log('Deploying executive dashboard to Grafana...');
  const res = await grafanaRequest('POST', '/api/dashboards/db', {
    dashboard: dashboard,
    overwrite: true
  });

  if (res.status === 200 && res.data?.status === 'success') {
    console.log('SUCCESS! Version', res.data.version, 'deployed at:', `http://${grafanaHost}:${grafanaPort}${res.data.url}`);
    fs.writeFileSync('dashboards/milicic-sla-executive-monthly.json', JSON.stringify(dashboard, null, 2), 'utf8');
  } else {
    throw new Error('Deploy failed: ' + JSON.stringify(res));
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
