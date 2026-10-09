import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';
import { buildTableHtml } from './generate_table_html.mjs';

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

async function updateDashboard() {
  console.log('Fetching current dashboard v8...');
  const currentRes = await grafanaRequest('GET', '/api/dashboards/uid/zabbix-matrixmax-overview');
  if (currentRes.status !== 200 || !currentRes.data?.dashboard) {
    throw new Error('Failed to fetch dashboard: ' + JSON.stringify(currentRes));
  }

  const dashboard = currentRes.data.dashboard;
  console.log('Current Dashboard Version:', dashboard.version);

  // Find Panel 10
  const panel10 = dashboard.panels.find(p => p.id === 10);
  if (!panel10) {
    throw new Error('Panel 10 not found!');
  }

  // Load the pre-rendered table
  const replicaHosts = [
    {
      name: 'backup-01', maint: false,
      cells: { web: 'ok', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'high', network: 'empty', dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'ok', backup: 'info', replication: 'ok' },
      details: { disk: 'High: Backup pool /mnt/bkp01 utilization > 92%', backup: 'Info: Incremental job snapshot finished with notices' }
    },
    {
      name: 'backup-02', maint: false,
      cells: { web: 'ok', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'ok', dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'ok', backup: 'high', replication: 'ok' },
      details: { backup: 'High: Cold storage replication sync timed out' }
    },
    {
      name: 'db-01', maint: false,
      cells: { web: 'ok', api: 'ok', cpu: 'high', memory: 'average', disk: 'ok', network: 'empty', dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'ok', replication: 'average' },
      details: { cpu: 'High: CPU load average 8.42 (> 80%)', memory: 'Average: SQL Buffer pool memory commit 88%', replication: 'Average: Standby replica lag > 120s' }
    },
    {
      name: 'db-02', maint: true,
      cells: { web: 'ok', api: 'ok', cpu: 'ok', memory: 'average', disk: 'ok', network: 'empty', dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'ok', replication: 'disaster' },
      details: { memory: 'Average: High target memory allocation', replication: 'Disaster: Replication sync broken / WAL corrupted' }
    },
    {
      name: 'db-03', maint: false,
      cells: { web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'ok', dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'ok', replication: 'average' },
      details: { replication: 'Average: Replication delay 45s' }
    },
    {
      name: 'fw-01', maint: false,
      cells: { web: 'ok', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'average', dns: 'warning', cert: 'average', vpn: 'ok', mail: 'empty', backup: 'ok', replication: 'ok' },
      details: { network: 'Average: Interface wan1 link state flapping', dns: 'Warning: DNS resolver latency > 85ms', cert: 'Average: Admin SSL portal certificate expires in 7 days' }
    },
    {
      name: 'fw-02', maint: false,
      cells: { web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'ok', dns: 'ok', cert: 'ok', vpn: 'warning', mail: 'ok', backup: 'empty', replication: 'ok' },
      details: { vpn: 'Warning: IPSec Phase 2 tunnel degraded (packet drops)' }
    },
    {
      name: 'lb-01', maint: false,
      cells: { web: 'ok', api: 'high', cpu: 'high', memory: 'ok', disk: 'ok', network: 'ok', dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'ok', replication: 'ok' },
      details: { api: 'High: Backend API upstream pool HTTP 502 Bad Gateway', cpu: 'High: Nginx worker CPU utilization 94%' }
    },
    {
      name: 'lb-02', maint: false,
      cells: { web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'info', dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'ok', replication: 'ok' },
      details: { network: 'Info: High inbound PPS on interface eth0' }
    },
    {
      name: 'mail-01', maint: false,
      cells: { web: 'ok', api: 'empty', cpu: 'ok', memory: 'info', disk: 'warning', network: 'empty', dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'high', backup: 'ok', replication: 'ok' },
      details: { memory: 'Info: In-memory mail cache tuning recommended', disk: 'Warning: Mail queue partition /var/spool/mail > 82%', mail: 'High: Outbound SMTP relay queue stalled (450 deferred)' }
    },
    {
      name: 'mail-02', maint: false,
      cells: { web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'ok', dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'average', backup: 'ok', replication: 'empty' },
      details: { mail: 'Average: Inbound spam protection threshold reached' }
    },
    {
      name: 'sw-core-01', maint: false,
      cells: { web: 'ok', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'average', dns: 'ok', cert: 'ok', vpn: 'high', mail: 'empty', backup: 'ok', replication: 'ok' },
      details: { network: 'Average: Port-Channel LAG 1 member down', vpn: 'High: Core VRF BGP neighbor down' }
    },
    {
      name: 'web-01', maint: false,
      cells: { web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'empty', dns: 'ok', cert: 'average', vpn: 'ok', mail: 'ok', backup: 'ok', replication: 'ok' },
      details: { cert: 'Average: Domain certificate expires in 14 days' }
    },
    {
      name: 'web-02', maint: false,
      cells: { web: 'disaster', api: 'average', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'empty', dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'ok', replication: 'ok' },
      details: { web: 'Disaster: Web service HTTP 500 / Service down', api: 'Average: Rest API latency > 1500ms' }
    },
    {
      name: 'web-03', maint: false,
      cells: { web: 'ok', api: 'ok', cpu: 'warning', memory: 'average', disk: 'ok', network: 'empty', dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'ok', replication: 'ok' },
      details: { cpu: 'Warning: CPU spikes detected > 75%', memory: 'Average: PHP-FPM memory pool consumed > 86%' }
    },
    {
      name: 'web-04', maint: false,
      cells: { web: 'average', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'empty', dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'ok', replication: 'ok' },
      details: { web: 'Average: TTFB response time > 800ms' }
    },
    {
      name: 'web-05', maint: false,
      cells: { web: 'ok', api: 'ok', cpu: 'warning', memory: 'ok', disk: 'ok', network: 'ok', dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'ok', replication: 'ok' },
      details: { cpu: 'Warning: CPU utilization > 72%' }
    }
  ];

  const preRenderedTable = buildTableHtml(replicaHosts);

  const rawHtml = `
<div class="matrixmax-outer-container">
  <div class="matrixmax-toolbar">
    <div class="matrixmax-brand">
      <span class="matrixmax-title-logo">matrixMAX</span>
      <span class="matrixmax-subtitle">Matriz de Alta Densidad · 12 Categorías</span>
    </div>
    <div class="matrixmax-actions">
      <div class="matrixmax-tabs">
        <button type="button" id="tab-btn-replica" class="matrixmax-tab-btn active">🎯 Vista Réplica (Screenshot)</button>
        <button type="button" id="tab-btn-milicic" class="matrixmax-tab-btn">🏢 Milicic Producción</button>
      </div>
      <input type="text" id="matrix-search-box" class="matrixmax-search" placeholder="🔍 Filtrar host..." />
      <button type="button" id="matrix-btn-sort-sev" class="matrixmax-btn" title="Ordenar por severidad">Severidad ↓</button>
      <button type="button" id="matrix-btn-sort-name" class="matrixmax-btn" title="Ordenar por nombre">A-Z</button>
      <button type="button" id="matrix-btn-theme" class="matrixmax-btn" title="Alternar Modo Claro / Oscuro">🌓 Tema</button>
    </div>
  </div>
  <div id="matrix-table-mount" class="matrixmax-scroll-pane">
${preRenderedTable}
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
`;

  panel10.options.content = rawHtml.split('\n').map(l => l.trim()).filter(Boolean).join('\n');
  panel10.options.defaultContent = panel10.options.content;

  // Fix afterRender to support context.element
  const fixedAfterRender = `
try {
  const el = (typeof context !== 'undefined' && context && context.element) 
    ? context.element 
    : (typeof element !== 'undefined' ? element : document.querySelector('.matrixmax-outer-container'));
  if (!el) return;

  const mount = el.querySelector('#matrix-table-mount');
  const container = el.classList.contains('matrixmax-outer-container') ? el : el.querySelector('.matrixmax-outer-container');
  if (!mount) return;

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

  const replicaHosts = [
    {
      name: 'backup-01', maint: false,
      cells: { web: 'ok', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'high', network: 'empty', dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'ok', backup: 'info', replication: 'ok' },
      details: { disk: 'High: Backup pool /mnt/bkp01 utilization > 92%', backup: 'Info: Incremental job snapshot finished with notices' }
    },
    {
      name: 'backup-02', maint: false,
      cells: { web: 'ok', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'ok', dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'ok', backup: 'high', replication: 'ok' },
      details: { backup: 'High: Cold storage replication sync timed out' }
    },
    {
      name: 'db-01', maint: false,
      cells: { web: 'ok', api: 'ok', cpu: 'high', memory: 'average', disk: 'ok', network: 'empty', dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'ok', replication: 'average' },
      details: { cpu: 'High: CPU load average 8.42 (> 80%)', memory: 'Average: SQL Buffer pool memory commit 88%', replication: 'Average: Standby replica lag > 120s' }
    },
    {
      name: 'db-02', maint: true,
      cells: { web: 'ok', api: 'ok', cpu: 'ok', memory: 'average', disk: 'ok', network: 'empty', dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'ok', replication: 'disaster' },
      details: { memory: 'Average: High target memory allocation', replication: 'Disaster: Replication sync broken / WAL corrupted' }
    },
    {
      name: 'db-03', maint: false,
      cells: { web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'ok', dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'ok', replication: 'average' },
      details: { replication: 'Average: Replication delay 45s' }
    },
    {
      name: 'fw-01', maint: false,
      cells: { web: 'ok', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'average', dns: 'warning', cert: 'average', vpn: 'ok', mail: 'empty', backup: 'ok', replication: 'ok' },
      details: { network: 'Average: Interface wan1 link state flapping', dns: 'Warning: DNS resolver latency > 85ms', cert: 'Average: Admin SSL portal certificate expires in 7 days' }
    },
    {
      name: 'fw-02', maint: false,
      cells: { web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'ok', dns: 'ok', cert: 'ok', vpn: 'warning', mail: 'ok', backup: 'empty', replication: 'ok' },
      details: { vpn: 'Warning: IPSec Phase 2 tunnel degraded (packet drops)' }
    },
    {
      name: 'lb-01', maint: false,
      cells: { web: 'ok', api: 'high', cpu: 'high', memory: 'ok', disk: 'ok', network: 'ok', dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'ok', replication: 'ok' },
      details: { api: 'High: Backend API upstream pool HTTP 502 Bad Gateway', cpu: 'High: Nginx worker CPU utilization 94%' }
    },
    {
      name: 'lb-02', maint: false,
      cells: { web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'info', dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'ok', replication: 'ok' },
      details: { network: 'Info: High inbound PPS on interface eth0' }
    },
    {
      name: 'mail-01', maint: false,
      cells: { web: 'ok', api: 'empty', cpu: 'ok', memory: 'info', disk: 'warning', network: 'empty', dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'high', backup: 'ok', replication: 'ok' },
      details: { memory: 'Info: In-memory mail cache tuning recommended', disk: 'Warning: Mail queue partition /var/spool/mail > 82%', mail: 'High: Outbound SMTP relay queue stalled (450 deferred)' }
    },
    {
      name: 'mail-02', maint: false,
      cells: { web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'ok', dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'average', backup: 'ok', replication: 'empty' },
      details: { mail: 'Average: Inbound spam protection threshold reached' }
    },
    {
      name: 'sw-core-01', maint: false,
      cells: { web: 'ok', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'average', dns: 'ok', cert: 'ok', vpn: 'high', mail: 'empty', backup: 'ok', replication: 'ok' },
      details: { network: 'Average: Port-Channel LAG 1 member down', vpn: 'High: Core VRF BGP neighbor down' }
    },
    {
      name: 'web-01', maint: false,
      cells: { web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'empty', dns: 'ok', cert: 'average', vpn: 'ok', mail: 'ok', backup: 'ok', replication: 'ok' },
      details: { cert: 'Average: Domain certificate expires in 14 days' }
    },
    {
      name: 'web-02', maint: false,
      cells: { web: 'disaster', api: 'average', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'empty', dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'ok', replication: 'ok' },
      details: { web: 'Disaster: Web service HTTP 500 / Service down', api: 'Average: Rest API latency > 1500ms' }
    },
    {
      name: 'web-03', maint: false,
      cells: { web: 'ok', api: 'ok', cpu: 'warning', memory: 'average', disk: 'ok', network: 'empty', dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'ok', replication: 'ok' },
      details: { cpu: 'Warning: CPU spikes detected > 75%', memory: 'Average: PHP-FPM memory pool consumed > 86%' }
    },
    {
      name: 'web-04', maint: false,
      cells: { web: 'average', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'empty', dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'ok', replication: 'ok' },
      details: { web: 'Average: TTFB response time > 800ms' }
    },
    {
      name: 'web-05', maint: false,
      cells: { web: 'ok', api: 'ok', cpu: 'warning', memory: 'ok', disk: 'ok', network: 'ok', dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'ok', replication: 'ok' },
      details: { cpu: 'Warning: CPU utilization > 72%' }
    }
  ];

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

  let currentDataset = replicaHosts;

  function renderTable(hosts) {
    let html = '<table class="matrix-table" id="matrix-main-table"><thead><tr><th class="th-host-corner"></th>';
    categories.forEach(c => {
      html += '<th class="th-col-rotated"><span class="th-col-text">' + c + '</span></th>';
    });
    html += '</tr></thead><tbody>';

    hosts.forEach(h => {
      html += '<tr class="matrix-row" data-name="' + h.name.toLowerCase() + '">';
      html += '<td class="td-host" data-host="' + h.name + '" title="Haga clic para enfocar este host en el panel de detalle">' + h.name;
      if (h.maint) {
        html += ' <span class="maint-wrench" title="Host en mantenimiento">🔧</span>';
      }
      html += '</td>';

      categories.forEach(cat => {
        const stateKey = (h.cells && h.cells[cat]) ? h.cells[cat] : 'empty';
        const st = statusMap[stateKey] || statusMap.empty;
        const detail = (h.details && h.details[cat]) ? h.details[cat] : ('Estado: ' + st.name);
        const title = 'Host: ' + h.name + ' | Check: ' + cat + ' | ' + detail;

        html += '<td style="padding: 0; text-align: center;">';
        html += '<div class="cell-tile ' + st.cls + '" data-host="' + h.name + '" data-tag="' + cat + '" data-sev="' + st.sev + '" title="' + title + '">';
        html += st.icon;
        html += '</div></td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    mount.innerHTML = html;
    bindTableEvents();
  }

  function bindTableEvents() {
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
  }

  // Bind initial events to the pre-rendered HTML
  bindTableEvents();

  // Tab switching
  const tabReplica = el.querySelector('#tab-btn-replica');
  const tabMilicic = el.querySelector('#tab-btn-milicic');

  if (tabReplica && tabMilicic) {
    tabReplica.addEventListener('click', () => {
      tabReplica.classList.add('active');
      tabMilicic.classList.remove('active');
      currentDataset = replicaHosts;
      renderTable(currentDataset);
    });

    tabMilicic.addEventListener('click', () => {
      tabMilicic.classList.add('active');
      tabReplica.classList.remove('active');
      currentDataset = milicicHosts;
      renderTable(currentDataset);
    });
  }

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

  // Theme toggle
  const btnTheme = el.querySelector('#matrix-btn-theme');
  if (btnTheme && container) {
    btnTheme.addEventListener('click', () => {
      container.classList.toggle('dark-theme');
    });
  }

} catch (err) {
  console.error('MatrixMAX Render Error:', err);
}
`;

  panel10.options.afterRender = fixedAfterRender;

  console.log('Sending V9 update to Grafana API...');
  const res = await grafanaRequest('POST', '/api/dashboards/db', {
    dashboard: dashboard,
    overwrite: true
  });
  console.log('Deploy Status:', res.status, res.data?.status);

  if (res.status === 200 && res.data?.status === 'success') {
    console.log('SUCCESS! Version', res.data.version, 'deployed at:', `http://${grafanaHost}:${grafanaPort}${res.data.url}`);
    fs.writeFileSync('dashboards/zabbix-matrixmax.json', JSON.stringify(dashboard, null, 2), 'utf8');
  } else {
    throw new Error('Update failed: ' + JSON.stringify(res));
  }
}

updateDashboard().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
