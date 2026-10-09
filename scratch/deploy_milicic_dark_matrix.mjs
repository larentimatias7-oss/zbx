import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  try {
    token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
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

const categories = ['web', 'api', 'cpu', 'memory', 'disk', 'network', 'dns', 'cert', 'vpn', 'mail', 'backup', 'replication'];

const statusMap = {
  ok: { cls: 'ok', icon: '✓', name: 'OK', sev: 0 },
  empty: { cls: 'empty', icon: '', name: 'Sin Control', sev: -1 },
  info: { cls: 'info', icon: 'i', name: 'Information', sev: 1 },
  warning: { cls: 'warning', icon: '▲', name: 'Warning', sev: 2 },
  average: { cls: 'average', icon: '↑', name: 'Average', sev: 3 },
  high: { cls: 'high', icon: '!', name: 'High', sev: 4 },
  disaster: { cls: 'disaster', icon: '✕', name: 'Disaster', sev: 5 }
};

const milicicHosts = [
  {
    name: 'AP PAÑOL', maint: false,
    cells: { web: 'disaster', api: 'empty', cpu: 'empty', memory: 'empty', disk: 'empty', network: 'high', dns: 'ok', cert: 'empty', vpn: 'empty', mail: 'empty', backup: 'empty', replication: 'empty' },
    details: { web: 'Disaster: Host is unavailable by ICMP ping', network: 'High: Aruba AP uplink down' }
  },
  {
    name: 'FTG_ar-368-acueducto', maint: false,
    cells: { web: 'disaster', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'high', dns: 'ok', cert: 'empty', vpn: 'high', mail: 'empty', backup: 'empty', replication: 'empty' },
    details: { web: 'Disaster: Host is unavailable by ICMP ping', network: 'High: Obradores link down', vpn: 'High: IPSec tunnel disconnected' }
  },
  {
    name: 'FTG_ar-376-veladero', maint: false,
    cells: { web: 'disaster', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'high', dns: 'ok', cert: 'empty', vpn: 'high', mail: 'empty', backup: 'empty', replication: 'empty' },
    details: { web: 'Disaster: Host is unavailable by ICMP ping', network: 'High: Minera Veladero uplink down', vpn: 'High: IPSec tunnel disconnected' }
  },
  {
    name: 'vCenter', maint: false,
    cells: { web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'high', network: 'ok', dns: 'ok', cert: 'ok', vpn: 'empty', mail: 'empty', backup: 'ok', replication: 'ok' },
    details: { disk: 'High: VMware Datastore free space < 10%' }
  },
  {
    name: 'SRO-MDS01', maint: false,
    cells: { web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'ok', dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'average', backup: 'ok', replication: 'ok' },
    details: { mail: 'Average: Zabbix agent unreachable / Service halted' }
  },
  {
    name: 'FTG_ar-ssj-predio', maint: false,
    cells: { web: 'ok', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'average', dns: 'ok', cert: 'ok', vpn: 'average', mail: 'empty', backup: 'empty', replication: 'empty' },
    details: { network: 'Average: Tunnel ALL_TRAFFIC Down', vpn: 'Average: IPSec San Juan degraded' }
  },
  {
    name: 'FTG_milicic_border1', maint: false,
    cells: { web: 'ok', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'average', dns: 'warning', cert: 'average', vpn: 'ok', mail: 'empty', backup: 'empty', replication: 'empty' },
    details: { network: 'Average: Interface wan1 link down', dns: 'Warning: Public DNS resolver response slow', cert: 'Average: Fortinet appliance cert check' }
  },
  {
    name: 'FTG_ar-377-YPF', maint: false,
    cells: { web: 'empty', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'average', dns: 'ok', cert: 'empty', vpn: 'ok', mail: 'empty', backup: 'empty', replication: 'empty' },
    details: { network: 'Average: Interface lan1 link down' }
  },
  {
    name: 'FTG_ar-372-posco', maint: false,
    cells: { web: 'empty', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'average', dns: 'ok', cert: 'empty', vpn: 'ok', mail: 'empty', backup: 'empty', replication: 'empty' },
    details: { network: 'Average: Interface lan2/lan3 link down' }
  },
  {
    name: 'TP-LINK (SRO-G01-ACC01)', maint: false,
    cells: { web: 'ok', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'warning', dns: 'empty', cert: 'empty', vpn: 'empty', mail: 'empty', backup: 'empty', replication: 'empty' },
    details: { network: 'Warning: Link flapping (>6 cambios/h)' }
  },
  {
    name: 'SRO-E02-ACC01 (HP PB)', maint: false,
    cells: { web: 'ok', api: 'empty', cpu: 'warning', memory: 'ok', disk: 'empty', network: 'ok', dns: 'empty', cert: 'empty', vpn: 'empty', mail: 'empty', backup: 'empty', replication: 'empty' },
    details: { cpu: 'Warning: Switch temperature > 50°C' }
  },
  {
    name: 'SW Ed Gris PB', maint: false,
    cells: { web: 'ok', api: 'empty', cpu: 'warning', memory: 'ok', disk: 'empty', network: 'warning', dns: 'empty', cert: 'empty', vpn: 'empty', mail: 'empty', backup: 'empty', replication: 'empty' },
    details: { cpu: 'Warning: Module temperature > 50°C', network: 'Warning: High collision count' }
  },
  {
    name: 'SRO-G01-DIS01', maint: false,
    cells: { web: 'ok', api: 'empty', cpu: 'warning', memory: 'ok', disk: 'empty', network: 'ok', dns: 'empty', cert: 'empty', vpn: 'empty', mail: 'empty', backup: 'empty', replication: 'empty' },
    details: { cpu: 'Warning: Module temperature > 50°C' }
  },
  {
    name: 'SRO-SQL01', maint: false,
    cells: { web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'ok', dns: 'ok', cert: 'ok', vpn: 'empty', mail: 'empty', backup: 'ok', replication: 'average' },
    details: { replication: 'Average: MSSQL Launchpad service is not running' }
  },
  {
    name: 'SRO-SIP01', maint: false,
    cells: { web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'warning', network: 'ok', dns: 'ok', cert: 'ok', vpn: 'empty', mail: 'empty', backup: 'ok', replication: 'average' },
    details: { disk: 'Warning: C: drive space < 15%', replication: 'Average: LocalKdc Kerberos service stopped' }
  },
  {
    name: 'SRO-FIL01', maint: false,
    cells: { web: 'empty', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'average', network: 'ok', dns: 'ok', cert: 'empty', vpn: 'empty', mail: 'empty', backup: 'ok', replication: 'ok' },
    details: { disk: 'Average: Volume DATOS (F:) usage > 90%' }
  },
  {
    name: 'SRO-APP02', maint: false,
    cells: { web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'warning', network: 'ok', dns: 'ok', cert: 'ok', vpn: 'empty', mail: 'empty', backup: 'ok', replication: 'ok' },
    details: { disk: 'Warning: Disk C: free space < 18%' }
  },
  {
    name: 'SRO-APP03', maint: false,
    cells: { web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'warning', network: 'ok', dns: 'ok', cert: 'ok', vpn: 'empty', mail: 'empty', backup: 'ok', replication: 'ok' },
    details: { disk: 'Warning: Disks C: & D: free space < 20%' }
  },
  {
    name: 'SRO-DCO01', maint: false,
    cells: { web: 'empty', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'ok', dns: 'ok', cert: 'warning', vpn: 'empty', mail: 'empty', backup: 'ok', replication: 'ok' },
    details: { cert: 'Warning: System time sync drift > 60s' }
  },
  {
    name: 'SRO-DCO02', maint: false,
    cells: { web: 'empty', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'ok', dns: 'ok', cert: 'warning', vpn: 'empty', mail: 'empty', backup: 'ok', replication: 'ok' },
    details: { cert: 'Warning: System time sync drift > 60s' }
  },
  {
    name: 'SRO-SVC01', maint: false,
    cells: { web: 'empty', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'ok', dns: 'ok', cert: 'warning', vpn: 'empty', mail: 'empty', backup: 'ok', replication: 'ok' },
    details: { cert: 'Warning: System time sync drift > 60s' }
  },
  {
    name: 'UPS E02 PA', maint: true,
    cells: { web: 'empty', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'warning', dns: 'empty', cert: 'empty', vpn: 'empty', mail: 'empty', backup: 'empty', replication: 'empty' },
    details: { network: 'Warning: SNMP monitoring unavailable (>10m)' }
  },
  {
    name: 'SRO-E02-CORE01', maint: false,
    cells: { web: 'ok', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'ok', dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'empty', replication: 'ok' },
    details: {}
  },
  {
    name: 'SRO-E02-CORE02', maint: false,
    cells: { web: 'ok', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'ok', dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'empty', replication: 'ok' },
    details: {}
  },
  {
    name: 'SSJ-HPV01', maint: false,
    cells: { web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'ok', dns: 'ok', cert: 'ok', vpn: 'empty', mail: 'empty', backup: 'ok', replication: 'ok' },
    details: {}
  },
  {
    name: 'SRO-UPS-DC01', maint: false,
    cells: { web: 'empty', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'ok', dns: 'empty', cert: 'empty', vpn: 'empty', mail: 'empty', backup: 'empty', replication: 'empty' },
    details: {}
  }
];

function buildMilicicTableHtml(hosts) {
  let html = '<table class="matrix-table" id="matrix-main-table"><thead><tr>';
  html += '<th class="th-host-corner"><span class="th-corner-text">HOST / DISPOSITIVO</span></th>';
  categories.forEach(c => {
    html += '<th class="th-col-rotated"><div class="th-rot-wrapper"><span class="th-rot-text">' + c + '</span></div></th>';
  });
  html += '</tr></thead><tbody>';

  hosts.forEach(h => {
    html += '<tr class="matrix-row" data-name="' + h.name.toLowerCase() + '">';
    html += '<td class="td-host" data-host="' + h.name + '" title="Haga clic para enfocar este host en el panel de detalle">' + h.name;
    if (h.maint) {
      html += ' <span class="maint-wrench" title="Host en mantenimiento programado">🔧</span>';
    }
    html += '</td>';

    categories.forEach(cat => {
      const stateKey = (h.cells && h.cells[cat]) ? h.cells[cat] : 'empty';
      const st = statusMap[stateKey] || statusMap.empty;
      const detail = (h.details && h.details[cat]) ? h.details[cat] : ('Estado: ' + st.name);
      const title = 'Host: ' + h.name + ' | Check: ' + cat + ' | ' + detail;

      html += '<td>';
      html += '<div class="cell-tile ' + st.cls + '" data-host="' + h.name + '" data-tag="' + cat + '" data-sev="' + st.sev + '" title="' + title + '">';
      html += st.icon;
      html += '</div></td>';
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  return html;
}

const tableHtml = buildMilicicTableHtml(milicicHosts);

const matrixHtml = `
<div class="matrixmax-outer-container">
  <div class="matrixmax-toolbar">
    <div class="matrixmax-brand">
      <span class="matrixmax-title-logo">matrixMAX</span>
      <span class="matrixmax-subtitle">Matriz de Salud de Infraestructura · Milicic S.A.</span>
    </div>
    <div class="matrixmax-actions">
      <input type="text" id="matrix-search-box" class="matrixmax-search" placeholder="🔍 Filtrar host..." />
      <button type="button" id="matrix-btn-sort-sev" class="matrixmax-btn" title="Ordenar por severidad">Severidad ↓</button>
      <button type="button" id="matrix-btn-sort-name" class="matrixmax-btn" title="Ordenar alfabéticamente">A-Z</button>
    </div>
  </div>
  <div id="matrix-table-mount" class="matrixmax-scroll-pane">
${tableHtml}
  </div>
  <div class="matrixmax-footer-legend">
    <span class="legend-item"><span class="cell-tile-mini ok">✓</span> OK</span>
    <span class="legend-item"><span class="cell-tile-mini info">i</span> Information</span>
    <span class="legend-item"><span class="cell-tile-mini warning">▲</span> Warning</span>
    <span class="legend-item"><span class="cell-tile-mini average">↑</span> Average</span>
    <span class="legend-item"><span class="cell-tile-mini high">!</span> High</span>
    <span class="legend-item"><span class="cell-tile-mini disaster">✕</span> Disaster</span>
    <span class="legend-item"><span class="cell-tile-mini empty"></span> Sin Control</span>
    <span class="legend-item"><span style="font-size: 13px;">🔧</span> Mantenimiento</span>
  </div>
</div>
`.split('\n').map(l => l.trim()).filter(Boolean).join('\n');

const matrixCss = `
/* Container harmonized with Grafana dark theme */
.matrixmax-outer-container {
  background: #0F172A;
  border: 1px solid #1E293B;
  border-radius: 8px;
  padding: 16px 20px 18px 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #F8FAFC;
}

/* Toolbar */
.matrixmax-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid #1E293B;
}

.matrixmax-brand {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.matrixmax-title-logo {
  font-size: 18px;
  font-weight: 800;
  color: #38BDF8;
  letter-spacing: -0.3px;
}

.matrixmax-subtitle {
  font-size: 11px;
  color: #94A3B8;
  font-weight: 500;
}

.matrixmax-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.matrixmax-search {
  background: #1E293B;
  border: 1px solid #334155;
  color: #F8FAFC;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 11px;
  outline: none;
  width: 180px;
  transition: all 0.15s ease;
}
.matrixmax-search:focus {
  border-color: #38BDF8;
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
}

.matrixmax-btn {
  background: #1E293B;
  border: 1px solid #334155;
  color: #CBD5E1;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.matrixmax-btn:hover {
  background: #334155;
  color: #FFFFFF;
  border-color: #38BDF8;
}

/* Scroll pane with sticky header support */
.matrixmax-scroll-pane {
  overflow-x: auto;
  overflow-y: auto;
  max-height: 540px;
  padding-bottom: 8px;
}

/* Hard reset table default styles from Grafana */
.matrixmax-outer-container table.matrix-table {
  border-collapse: separate !important;
  border-spacing: 6px 4px !important;
  margin: 0 !important;
  background: transparent !important;
  width: auto;
}

.matrixmax-outer-container table.matrix-table thead,
.matrixmax-outer-container table.matrix-table tbody,
.matrixmax-outer-container table.matrix-table tr,
.matrixmax-outer-container table.matrix-table th,
.matrixmax-outer-container table.matrix-table td {
  background: transparent !important;
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

/* Sticky Header */
.matrixmax-outer-container table.matrix-table thead {
  position: sticky;
  top: 0;
  z-index: 20;
  background: #0F172A !important;
}

.th-host-corner {
  width: 220px;
  min-width: 220px;
  max-width: 220px;
  vertical-align: bottom;
  padding: 0 8px 10px 4px !important;
  text-align: left;
}

.th-corner-text {
  font-size: 11px;
  font-weight: 700;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ROTATED COLUMN HEADERS */
.th-col-rotated {
  height: 80px;
  width: 32px;
  min-width: 32px;
  max-width: 32px;
  vertical-align: bottom;
  position: relative;
  padding: 0 !important;
  background: transparent !important;
}

.th-rot-wrapper {
  position: absolute;
  bottom: 8px;
  left: 12px;
  transform: rotate(-45deg);
  transform-origin: 0 100%;
  white-space: nowrap;
  width: 90px;
  text-align: left;
}

.th-rot-text {
  font-size: 11px;
  font-weight: 700;
  color: #94A3B8;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  display: inline-block;
}

/* Host Row Label */
.matrix-row:hover .td-host {
  color: #38BDF8;
}

.td-host {
  font-size: 12px;
  font-weight: 600;
  color: #E2E8F0;
  padding: 4px 8px !important;
  white-space: nowrap;
  text-align: left;
  cursor: pointer;
  user-select: none;
  transition: color 0.15s ease;
  border-radius: 4px;
}

.maint-wrench {
  color: #F97316;
  margin-left: 5px;
  font-size: 13px;
  display: inline-block;
}

/* Status Tile (26px x 26px) */
.cell-tile {
  width: 26px;
  height: 26px;
  min-width: 26px;
  min-height: 26px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  user-select: none;
  box-sizing: border-box;
  transition: transform 0.12s ease, filter 0.12s ease, box-shadow 0.12s ease;
  margin: 0 auto;
}

.cell-tile:hover {
  transform: scale(1.25);
  filter: brightness(1.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
  z-index: 10;
  position: relative;
}

/* Status Tile States */
.cell-tile.ok {
  background: #16A34A;
  color: #FFFFFF;
  box-shadow: 0 0 6px rgba(22, 163, 74, 0.25);
}
.cell-tile.empty {
  background: rgba(30, 41, 59, 0.4);
  border: 1.5px solid #334155;
  color: transparent;
}
.cell-tile.info {
  background: #2563EB;
  color: #FFFFFF;
  font-family: serif;
  font-style: italic;
}
.cell-tile.warning {
  background: #D97706;
  color: #FFFFFF;
}
.cell-tile.average {
  background: #EA580C;
  color: #FFFFFF;
}
.cell-tile.high {
  background: #DC2626;
  color: #FFFFFF;
}
.cell-tile.disaster {
  background: #991B1B;
  color: #FFFFFF;
  animation: pulseTile 2s infinite;
}

@keyframes pulseTile {
  0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
  70% { box-shadow: 0 0 0 6px rgba(220, 38, 38, 0); }
  100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
}

/* Footer Legend */
.matrixmax-footer-legend {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 11px;
  color: #94A3B8;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #1E293B;
  flex-wrap: wrap;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.cell-tile-mini {
  width: 16px;
  height: 16px;
  min-width: 16px;
  min-height: 16px;
  border-radius: 3px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
}
.cell-tile-mini.ok { background: #16A34A; color: #FFFFFF; }
.cell-tile-mini.empty { background: rgba(30, 41, 59, 0.4); border: 1.5px solid #334155; }
.cell-tile-mini.info { background: #2563EB; color: #FFFFFF; font-family: serif; font-style: italic; }
.cell-tile-mini.warning { background: #D97706; color: #FFFFFF; }
.cell-tile-mini.average { background: #EA580C; color: #FFFFFF; }
.cell-tile-mini.high { background: #DC2626; color: #FFFFFF; }
.cell-tile-mini.disaster { background: #991B1B; color: #FFFFFF; }
`;

const matrixAfterRender = `
try {
  const el = (typeof context !== 'undefined' && context && context.element) 
    ? context.element 
    : (typeof element !== 'undefined' ? element : document.querySelector('.matrixmax-outer-container'));
  if (!el) return;

  const mount = el.querySelector('#matrix-table-mount');
  if (!mount) return;

  // Bind tile click
  const tiles = mount.querySelectorAll('.cell-tile');
  tiles.forEach(tile => {
    tile.addEventListener('click', (e) => {
      e.stopPropagation();
      const host = tile.getAttribute('data-host') || '';
      const tag = tile.getAttribute('data-tag') || '';
      if (!host) return;

      const url = new URL(window.location.href);
      url.searchParams.set('var-selected_host', host);
      url.searchParams.set('var-selected_tag', tag);
      window.location.href = url.toString();
    });
  });

  // Bind host click
  const rowLabels = mount.querySelectorAll('.td-host');
  rowLabels.forEach(lbl => {
    lbl.addEventListener('click', () => {
      const host = lbl.getAttribute('data-host') || '';
      if (!host) return;

      const url = new URL(window.location.href);
      url.searchParams.set('var-selected_host', host);
      url.searchParams.set('var-selected_tag', '.*');
      window.location.href = url.toString();
    });
  });

  // Search filter
  const searchInput = el.querySelector('#matrix-search-box');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value.toLowerCase().trim();
      const trs = mount.querySelectorAll('.matrix-row');
      trs.forEach(tr => {
        const name = tr.getAttribute('data-name') || '';
        if (!val || name.includes(val)) {
          tr.style.display = '';
        } else {
          tr.style.display = 'none';
        }
      });
    });
  }

  // Sort by severity
  const btnSortSev = el.querySelector('#matrix-btn-sort-sev');
  if (btnSortSev) {
    btnSortSev.addEventListener('click', () => {
      const tbody = mount.querySelector('#matrix-main-table tbody');
      if (!tbody) return;
      const trs = Array.from(tbody.querySelectorAll('.matrix-row'));
      trs.sort((a, b) => {
        const getMaxSev = tr => {
          let max = -1;
          tr.querySelectorAll('.cell-tile').forEach(cell => {
            const sev = parseInt(cell.getAttribute('data-sev') || '-1', 10);
            if (sev > max) max = sev;
          });
          return max;
        };
        return getMaxSev(b) - getMaxSev(a);
      });
      trs.forEach(tr => tbody.appendChild(tr));
    });
  }

  // Sort alphabetically
  const btnSortName = el.querySelector('#matrix-btn-sort-name');
  if (btnSortName) {
    btnSortName.addEventListener('click', () => {
      const tbody = mount.querySelector('#matrix-main-table tbody');
      if (!tbody) return;
      const trs = Array.from(tbody.querySelectorAll('.matrix-row'));
      trs.sort((a, b) => {
        const nameA = a.getAttribute('data-name') || '';
        const nameB = b.getAttribute('data-name') || '';
        return nameA.localeCompare(nameB);
      });
      trs.forEach(tr => tbody.appendChild(tr));
    });
  }

} catch (err) {
  console.error('MatrixMAX Event Binding Error:', err);
}
`;

async function deploy() {
  console.log('Fetching dashboard from Grafana...');
  const currentRes = await grafanaRequest('GET', '/api/dashboards/uid/zabbix-matrixmax-overview');
  if (currentRes.status !== 200 || !currentRes.data?.dashboard) {
    throw new Error('Failed to fetch dashboard: ' + JSON.stringify(currentRes));
  }

  const dashboard = currentRes.data.dashboard;
  console.log('Current Dashboard Version:', dashboard.version);

  const panel10 = dashboard.panels.find(p => p.id === 10);
  if (!panel10) throw new Error('Panel 10 not found');

  panel10.title = '🎯 matrixMAX · Control Matricial de Salud (Infraestructura Milicic S.A.)';
  panel10.options.content = matrixHtml;
  panel10.options.defaultContent = matrixHtml;
  panel10.options.styles = matrixCss;
  panel10.options.afterRender = matrixAfterRender;

  console.log('Deploying harmonized dark matrixMAX to Grafana...');
  const res = await grafanaRequest('POST', '/api/dashboards/db', {
    dashboard: dashboard,
    overwrite: true
  });

  if (res.status === 200 && res.data?.status === 'success') {
    console.log('SUCCESS! Version', res.data.version, 'deployed at:', `http://${grafanaHost}:${grafanaPort}${res.data.url}`);
    fs.writeFileSync('dashboards/zabbix-matrixmax.json', JSON.stringify(dashboard, null, 2), 'utf8');
  } else {
    throw new Error('Deploy failed: ' + JSON.stringify(res));
  }
}

deploy().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
