import fs from 'fs';
import { buildTableHtml } from './generate_table_html.mjs';

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

let content = fs.readFileSync('scripts/build_matrixmax_dashboard.mjs', 'utf8');

// Replace the placeholder inside rawMatrixContentHtml
const oldMount = `<div id="matrix-table-mount" class="matrixmax-scroll-pane">
    <div style="padding: 30px; text-align: center; color: #64748B;">Cargando matriz interactiva...</div>
  </div>`;

const newMount = `<div id="matrix-table-mount" class="matrixmax-scroll-pane">
\${preRenderedTable}
  </div>`;

if (content.includes(oldMount)) {
  content = content.replace(oldMount, newMount);
  // Add preRenderedTable definition before rawMatrixContentHtml
  const tableGenCode = `const preRenderedTable = \`${preRenderedTable}\`;\n\n`;
  content = content.replace('// 2. MATRIXMAX EXACT COMMERCIAL REPLICA', tableGenCode + '// 2. MATRIXMAX EXACT COMMERCIAL REPLICA');
  
  // Also fix afterRender in scripts/build_matrixmax_dashboard.mjs
  content = content.replace("const mount = element.querySelector('#matrix-table-mount');", `const el = (typeof context !== 'undefined' && context && context.element) ? context.element : (typeof element !== 'undefined' ? element : document.querySelector('.matrixmax-outer-container'));
  if (!el) return;
  const mount = el.querySelector('#matrix-table-mount');`);

  content = content.replaceAll("element.querySelector", "el.querySelector");

  fs.writeFileSync('scripts/build_matrixmax_dashboard.mjs', content, 'utf8');
  console.log('Successfully synchronized scripts/build_matrixmax_dashboard.mjs!');
} else {
  console.log('Could not find oldMount pattern');
}
