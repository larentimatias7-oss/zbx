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

function parseToolOutput(path) {
  const content = fs.readFileSync(path, 'utf8');
  const lines = content.split('\n');
  const startIdx = lines.findIndex(l => l.trim() === '[');
  return JSON.parse(lines.slice(startIdx).join('\n'));
}

const rawHosts = parseToolOutput('C:/Users/matias.larenti/.gemini/antigravity-ide/brain/cc9dd136-6a4b-4468-890d-48b93061f177/.system_generated/steps/984/output.txt');
const rawTriggers = parseToolOutput('C:/Users/matias.larenti/.gemini/antigravity-ide/brain/cc9dd136-6a4b-4468-890d-48b93061f177/.system_generated/steps/998/output.txt');

const enabledHosts = rawHosts.filter(h => h.status === '0');

// Group triggers by hostid
const hostTriggers = {};
rawTriggers.forEach(t => {
  const h = t.hosts?.[0];
  if (!h) return;
  if (!hostTriggers[h.hostid]) hostTriggers[h.hostid] = [];
  hostTriggers[h.hostid].push(t);
});

function detectSede(h) {
  const name = (h.name || h.host || '').toUpperCase();
  const ip = h.interfaces?.[0]?.ip || '';
  if (name.includes('SSJ') || name.includes('SAN JUAN') || ip.startsWith('172.29.')) return 'SSJ';
  if (name.startsWith('FTG_AR-') || name.includes('OBRADOR') || name.includes('MINERA') || name.includes('CAMPAMENTO') || name.includes('VELADERO') || name.includes('JOSEMARIA') || name.includes('GUACOLDA') || name.includes('ACUEDUCTO') || name.includes('SAL DE VIDA') || name.includes('ALUMBRERA')) return 'OBRADOR';
  return 'SRO';
}

function detectTier(h) {
  const name = (h.name || h.host || '').toUpperCase();
  if (name.includes('CORE') || name.includes('BORDER')) return 'Core';
  if (name.startsWith('FTG_')) return 'Perimeter';
  if (name.includes('DIS')) return 'Distribution';
  if (name.includes('ACC') || name.includes('SW') || name.startsWith('AP ') || name.includes('P2P') || name.includes('D03')) return 'Access';
  if (name.includes('STO') || name.includes('NAS')) return 'Storage';
  if (name.includes('SQL') || name.includes('SAPR')) return 'Database';
  if (name.includes('VCENTER') || name.includes('HPV')) return 'Virtualization';
  if (name.includes('UPS')) return 'Facilities';
  return 'Service';
}

function detectDeviceType(h) {
  const name = (h.name || h.host || '').toUpperCase();
  if (name.startsWith('FTG_')) return 'firewall';
  if (name.startsWith('AP ')) return 'wifi';
  if (name.startsWith('UPS ')) return 'ups';
  if (name.includes('CORE') || name.includes('DIS01') || name.includes('ACC') || name.includes('SW ') || name.includes('SWADM') || name.includes('P2P') || name.includes('D03')) return 'switch';
  if (name.includes('STO02') || name.includes('NAS01') || name.includes('VCENTER') || name.includes('HPV01') || name.startsWith('172.30.70.')) return 'storage';
  if (name.includes('SQL') || name.includes('SAPR') || name.includes('APP01') || name.includes('APP02') || name.includes('APP03') || name.includes('SLI-APP')) return 'database';
  return 'server';
}

const typeMeta = {
  firewall: { label: 'Firewalls / WAN', icon: '🔥', short: 'Firewall', cls: 'type-firewall' },
  switch: { label: 'Switches / Red', icon: '🌐', short: 'Switch', cls: 'type-switch' },
  wifi: { label: 'Wi-Fi / APs', icon: '📶', short: 'Wi-Fi AP', cls: 'type-wifi' },
  server: { label: 'Servidores / AD', icon: '🖥️', short: 'Servidor', cls: 'type-server' },
  storage: { label: 'Storage & Virt', icon: '💾', short: 'Storage/Virt', cls: 'type-storage' },
  database: { label: 'Bases de Datos', icon: '📊', short: 'BD/SAP', cls: 'type-database' },
  ups: { label: 'Energía / UPS', icon: '⚡', short: 'UPS', cls: 'type-ups' }
};

const categories = ['web', 'api', 'cpu', 'memory', 'disk', 'network', 'dns', 'cert', 'vpn', 'mail', 'backup', 'replication'];

// CLASSIC TRAFFIC LIGHT STATUS MAP (ROJO, AMARILLO, VERDE)
const statusMap = {
  ok: { cls: 'ok', icon: '✓', name: 'OK', sev: 0 },
  empty: { cls: 'empty', icon: '', name: 'Sin Control', sev: -1 },
  info: { cls: 'info', icon: 'i', name: 'Information', sev: 1 },
  warning: { cls: 'warning', icon: '▲', name: 'Warning', sev: 2 },
  average: { cls: 'average', icon: '▲', name: 'Average', sev: 3 },
  high: { cls: 'high', icon: '!', name: 'High', sev: 4 },
  disaster: { cls: 'disaster', icon: '✕', name: 'Disaster', sev: 5 }
};

function escapeHtmlAttr(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r?\n/g, ' &#10; ');
}

function categorizeTrigger(desc) {
  const d = desc.toLowerCase();
  if (d.includes('unavailable by icmp') || d.includes('ping') || d.includes('host is unavailable') || d.includes('http service')) return 'web';
  if (d.includes('zabbix agent') || d.includes('service') || d.includes('process')) return 'api';
  if (d.includes('cpu') || d.includes('processor')) return 'cpu';
  if (d.includes('memory') || d.includes('swap') || d.includes('ram')) return 'memory';
  if (d.includes('disk') || d.includes('space') || d.includes('datastore') || d.includes('fs [') || d.includes('filesystem')) return 'disk';
  if (d.includes('vpn') || d.includes('tunnel') || d.includes('sd-wan') || d.includes('packet') || d.includes('packets loss')) return 'vpn';
  if (d.includes('interface') || d.includes('link') || d.includes('ethernet') || d.includes('flapping') || d.includes('speed') || d.includes('duplex') || d.includes('bandwidth')) return 'network';
  if (d.includes('time') || d.includes('ntp') || d.includes('dns') || d.includes('sync')) return 'dns';
  if (d.includes('temperature') || d.includes('tpm') || d.includes('snmp data collection') || d.includes('sin monitoreo snmp') || d.includes('certificate') || d.includes('cert')) return 'cert';
  if (d.includes('mail') || d.includes('smtp') || d.includes('exchange')) return 'mail';
  if (d.includes('backup')) return 'backup';
  if (d.includes('ha') || d.includes('replication') || d.includes('cluster')) return 'replication';
  return 'network';
}

function priorityToSevName(pri) {
  if (pri >= 5) return 'disaster';
  if (pri === 4) return 'high';
  if (pri === 3) return 'average';
  if (pri === 2) return 'warning';
  if (pri === 1) return 'info';
  return 'ok';
}

function determinePLevel(pri) {
  if (pri >= 4) return '🚨 P1 Crítico (0m Inmediato)';
  if (pri === 3) return '⚠️ P2 Redes/Plataforma (10m delay)';
  if (pri === 2) return '📋 P3 Preventivo (30m delay)';
  return 'ℹ️ P3 Informativo';
}

function determineTg(pri) {
  if (pri >= 4) return '🚨 Alertas P1 CRITICAS (-1004383937012)';
  return '📋 Alertas General (-1004396424523)';
}

const allHostsList = enabledHosts.map(h => {
  const hostid = h.hostid;
  const name = h.name || h.host;
  const sede = detectSede(h);
  const tier = detectTier(h);
  const type = detectDeviceType(h);
  const trs = hostTriggers[hostid] || [];

  const isNet = tier === 'Access' || tier === 'Core' || tier === 'Distribution' || tier === 'Perimeter' || tier === 'Facilities';
  const isStorage = tier === 'Storage';
  const isSrv = !isNet && !isStorage;

  const cells = {
    web: 'ok',
    api: isSrv ? 'ok' : 'empty',
    cpu: isNet && tier === 'Access' ? 'empty' : 'ok',
    memory: isNet && tier === 'Access' ? 'empty' : 'ok',
    disk: isNet ? 'empty' : 'ok',
    network: 'ok',
    dns: isSrv || tier === 'Core' || tier === 'Perimeter' ? 'ok' : 'empty',
    cert: isSrv || tier === 'Perimeter' || tier === 'Facilities' ? 'ok' : 'empty',
    vpn: tier === 'Perimeter' || tier === 'Core' ? 'ok' : 'empty',
    mail: isSrv ? 'empty' : 'empty',
    backup: isSrv || isStorage ? 'ok' : 'empty',
    replication: isStorage || tier === 'Virtualization' || tier === 'Database' ? 'ok' : 'empty'
  };

  const details = {};

  trs.forEach(t => {
    const pri = parseInt(t.priority);
    const cat = categorizeTrigger(t.description);
    const sev = priorityToSevName(pri);
    const p_level = determinePLevel(pri);
    const tg = determineTg(pri);

    const sevPriority = { disaster: 5, high: 4, average: 3, warning: 2, info: 1, ok: 0, empty: -1 };
    if (!cells[cat] || sevPriority[sev] > (sevPriority[cells[cat]] || 0)) {
      cells[cat] = sev;
      details[cat] = {
        sev: pri,
        text: `${sev.toUpperCase()}: ${t.description}`,
        p_level,
        tg
      };
    }
  });

  return {
    name,
    hostid,
    sede,
    tier,
    type,
    maint: false,
    cells,
    details
  };
});

// Sort hosts: SRO first, then SSJ, then OBRADOR; within each, by type order, then by name
const sedeOrder = { SRO: 1, SSJ: 2, OBRADOR: 3 };
const typeOrder = { firewall: 1, switch: 2, server: 3, database: 4, storage: 5, wifi: 6, ups: 7 };

allHostsList.sort((a, b) => {
  if (sedeOrder[a.sede] !== sedeOrder[b.sede]) return sedeOrder[a.sede] - sedeOrder[b.sede];
  if (typeOrder[a.type] !== typeOrder[b.type]) return typeOrder[a.type] - typeOrder[b.type];
  return a.name.localeCompare(b.name);
});

// Counts calculation
const counts = {
  total: allHostsList.length,
  sro: allHostsList.filter(h => h.sede === 'SRO').length,
  ssj: allHostsList.filter(h => h.sede === 'SSJ').length,
  obrador: allHostsList.filter(h => h.sede === 'OBRADOR').length,
  degraded: allHostsList.filter(h => Object.keys(h.details || {}).length > 0).length,
  types: {
    firewall: allHostsList.filter(h => h.type === 'firewall').length,
    switch: allHostsList.filter(h => h.type === 'switch').length,
    wifi: allHostsList.filter(h => h.type === 'wifi').length,
    server: allHostsList.filter(h => h.type === 'server').length,
    storage: allHostsList.filter(h => h.type === 'storage').length,
    database: allHostsList.filter(h => h.type === 'database').length,
    ups: allHostsList.filter(h => h.type === 'ups').length
  }
};

// Column statistics across ALL 67 hosts for the PRO systemic summary row
const colStats = {};
categories.forEach(c => {
  colStats[c] = { total: 0, maxSev: 0 };
  allHostsList.forEach(h => {
    const d = h.details && h.details[c];
    if (d && d.sev > 0) {
      colStats[c].total++;
      if (d.sev > colStats[c].maxSev) colStats[c].maxSev = d.sev;
    }
  });
});

// ==========================================
// BUILD PANEL 10 (ORIGINAL / ESTÁNDAR)
// ==========================================
function buildPanel10Html(hosts) {
  let tableHtml = '<table class="matrixmax-table" id="matrixmax-main-table"><thead><tr>';
  tableHtml += '<th class="th-host-corner"><span class="th-corner-text">HOST / DISPOSITIVO (' + hosts.length + ')</span></th>';
  categories.forEach(c => {
    tableHtml += '<th class="th-col-rotated"><div class="th-rot-wrapper"><span class="th-rot-text">' + c + '</span></div></th>';
  });
  tableHtml += '</tr></thead><tbody>';

  hosts.forEach(h => {
    const hostUrl = 'https://zabbix.mlccnet.local/zabbix.php?action=problem.view&hostids[]=' + h.hostid;
    tableHtml += '<tr class="matrixmax-row" data-name="' + escapeHtmlAttr(h.name.toLowerCase()) + '">';
    tableHtml += '<td style="vertical-align: middle;">';
    tableHtml += '<a class="td-host-link" href="' + hostUrl + '" target="_blank" rel="noopener noreferrer" data-host="' + escapeHtmlAttr(h.name) + '" title="Abrir en Zabbix">';
    tableHtml += '<span class="host-name-txt">' + escapeHtmlAttr(h.name) + '</span>';
    tableHtml += ' <span style="font-size:10px; color:#64748B;">(' + h.sede + ')</span>';
    tableHtml += '</a></td>';

    categories.forEach(cat => {
      const stateKey = (h.cells && h.cells[cat]) ? h.cells[cat] : 'empty';
      const st = statusMap[stateKey] || statusMap.empty;
      const d = (h.details && h.details[cat]) ? h.details[cat] : null;

      let title = 'Host: ' + h.name + ' | Check: ' + cat + ' | Estado: ' + st.name;
      if (d) {
        title = 'Host: ' + h.name + ' | Check: ' + cat + '\n' + d.text;
      }

      let targetUrl = '';
      if (st.sev > 0) {
        targetUrl = 'https://zabbix.mlccnet.local/zabbix.php?action=problem.view&hostids[]=' + h.hostid;
      } else {
        targetUrl = 'https://zabbix.mlccnet.local/zabbix.php?action=latest.view&hostids[]=' + h.hostid;
      }

      tableHtml += '<td class="td-cell-container">';
      tableHtml += '<a class="cell-tile ' + st.cls + '" href="' + targetUrl + '" target="_blank" rel="noopener noreferrer" data-host="' + escapeHtmlAttr(h.name) + '" data-tag="' + cat + '" title="' + escapeHtmlAttr(title) + '">';
      tableHtml += st.icon;
      tableHtml += '</a></td>';
    });

    tableHtml += '</tr>';
  });

  tableHtml += '</tbody></table>';

  const fullHtml = `
<div class="matrixmax-outer-container">
  <div class="matrixmax-toolbar">
    <div class="matrixmax-brand">
      <span class="matrixmax-title-logo">🎯 matrixMAX <small style="font-size: 11px; color: #94A3B8; font-weight: normal;">(Original / Estándar)</small></span>
      <span class="matrixmax-subtitle">Matriz de Salud de Infraestructura Completa (${hosts.length} Hosts) · Milicic S.A.</span>
    </div>
    <div class="matrixmax-actions">
      <input type="text" id="matrixmax-search-box" class="matrixmax-search" placeholder="🔍 Filtrar host o check..." />
      <button type="button" id="matrixmax-btn-sort-sev" class="matrixmax-btn" title="Ordenar por mayor severidad">Severidad ↓</button>
      <button type="button" id="matrixmax-btn-sort-name" class="matrixmax-btn" title="Ordenar alfabéticamente">A-Z</button>
    </div>
  </div>

  <div id="matrixmax-table-mount" class="matrixmax-scroll-pane">
${tableHtml}
  </div>

  <div class="matrixmax-footer-legend">
    <div class="legend-left">
      <span class="legend-item"><span class="cell-tile-mini ok">✓</span> OK (Verde)</span>
      <span class="legend-item"><span class="cell-tile-mini warning">▲</span> Warning (Amarillo)</span>
      <span class="legend-item"><span class="cell-tile-mini average">▲</span> Average (Ámbar)</span>
      <span class="legend-item"><span class="cell-tile-mini high">!</span> High (Rojo)</span>
      <span class="legend-item"><span class="cell-tile-mini disaster">✕</span> Disaster (Rojo Crítico)</span>
      <span class="legend-item"><span class="cell-tile-mini info">i</span> Info (Azul)</span>
      <span class="legend-item"><span class="cell-tile-mini empty"></span> Sin Control</span>
    </div>
    <div class="legend-right">
      <span class="legend-tip">Clic en celda o host abre vista en Zabbix Web</span>
    </div>
  </div>
</div>
`.split('\n').map(l => l.trim()).filter(Boolean).join('\n');

  return fullHtml;
}

// ==========================================
// BUILD PANEL 15 (MATRIXMAX PRO SECTORIZADO)
// ==========================================
function buildPanel15Html(hosts) {
  let tableHtml = '<table class="matrixpro-table" id="matrixpro-main-table"><thead><tr>';
  tableHtml += '<th class="thpro-host-corner"><span class="thpro-corner-text">HOST / DISPOSITIVO &bull; SEDE &bull; TIPO</span></th>';
  categories.forEach(c => {
    tableHtml += '<th class="thpro-col-rotated"><div class="thpro-rot-wrapper"><span class="thpro-rot-text">' + c + '</span></div></th>';
  });
  tableHtml += '</tr></thead><tbody>';

  hosts.forEach(h => {
    const hasAlarm = Object.keys(h.details || {}).length > 0;
    const hostUrl = 'https://zabbix.mlccnet.local/zabbix.php?action=problem.view&hostids[]=' + h.hostid;
    const tMeta = typeMeta[h.type] || { short: h.type, cls: 'type-server' };

    tableHtml += '<tr class="matrixpro-row" data-name="' + escapeHtmlAttr(h.name.toLowerCase()) + '" data-sede="' + h.sede + '" data-type="' + h.type + '" data-hasalarm="' + hasAlarm + '">';
    tableHtml += '<td style="vertical-align: middle;">';
    tableHtml += '<a class="tdpro-host" href="' + hostUrl + '" target="_blank" rel="noopener noreferrer" data-host="' + escapeHtmlAttr(h.name) + '" title="' + escapeHtmlAttr('Abrir ' + h.name + ' en Zabbix (Clic abre nueva pestaña)') + '">';
    tableHtml += '<span class="host-name-txt">' + escapeHtmlAttr(h.name) + '</span>';
    if (h.maint) {
      tableHtml += ' <span class="maint-wrench" title="Mantenimiento programado activo">🔧</span>';
    }
    tableHtml += '<div class="host-meta-badges">';
    tableHtml += '<span class="badge-sede ' + h.sede.toLowerCase() + '">' + h.sede + '</span>';
    tableHtml += '<span class="badge-type ' + tMeta.cls + '" title="Sector: ' + tMeta.label + '">' + tMeta.short + '</span>';
    tableHtml += '<span class="badge-tier">' + h.tier + '</span>';
    tableHtml += '</div>';
    tableHtml += '</a></td>';

    categories.forEach(cat => {
      const stateKey = (h.cells && h.cells[cat]) ? h.cells[cat] : 'empty';
      const st = statusMap[stateKey] || statusMap.empty;
      const d = (h.details && h.details[cat]) ? h.details[cat] : null;

      let title = 'Host: ' + h.name + ' (' + h.sede + ') | Check: ' + cat + ' | Estado: ' + st.name;
      if (d) {
        title = 'Host: ' + h.name + ' (' + h.sede + ') | Check: ' + cat + '\n' +
                'Falla: ' + d.text + '\n' +
                'Canal: ' + d.p_level + '\n' +
                'Telegram: ' + d.tg + ' (Clic para ver en Zabbix)';
      }

      let targetUrl = '';
      if (st.sev > 0) {
        targetUrl = 'https://zabbix.mlccnet.local/zabbix.php?action=problem.view&hostids[]=' + h.hostid;
      } else {
        targetUrl = 'https://zabbix.mlccnet.local/zabbix.php?action=latest.view&hostids[]=' + h.hostid;
      }

      tableHtml += '<td class="tdpro-cell-container">';
      tableHtml += '<a class="cell-tile ' + st.cls + '" href="' + targetUrl + '" target="_blank" rel="noopener noreferrer" data-host="' + escapeHtmlAttr(h.name) + '" data-tag="' + cat + '" data-sev="' + st.sev + '" data-hostid="' + h.hostid + '" title="' + escapeHtmlAttr(title) + '">';
      tableHtml += st.icon;
      tableHtml += '</a></td>';
    });
    tableHtml += '</tr>';
  });

  tableHtml += '</tbody>';

  // TFOOT: IMPACTO SISTÉMICO / RESUMEN TRANSVERSAL
  tableHtml += '<tfoot>';
  tableHtml += '<tr class="matrixpro-summary-row">';
  tableHtml += '<td class="tdpro-summary-label">';
  tableHtml += '<div class="summary-label-content">';
  tableHtml += '<span class="summary-title">🚨 IMPACTO SISTÉMICO (NODOS AFECTADOS)</span>';
  tableHtml += '<span class="summary-sub">Detección O(1) de fallas transversales de servicio</span>';
  tableHtml += '</div></td>';

  categories.forEach(c => {
    const stat = colStats[c];
    let badgeClass = 'summary-ok';
    let icon = '✓';
    let badgeText = '0';

    if (stat.total > 0) {
      badgeText = String(stat.total);
      if (stat.maxSev >= 4) {
        badgeClass = 'summary-disaster';
        icon = '✕';
      } else if (stat.maxSev === 3) {
        badgeClass = 'summary-avg';
        icon = '▲';
      } else {
        badgeClass = 'summary-warn';
        icon = '▲';
      }
    }

    const colTitle = 'Categoría: ' + c + '\nTotal nodos degradados: ' + stat.total + (stat.total > 0 ? ' (ALERTA TRANSVERSAL)' : ' (ESTADO NORMAL)');

    tableHtml += '<td class="tdpro-summary-cell" title="' + escapeHtmlAttr(colTitle) + '">';
    tableHtml += '<div class="summary-pill ' + badgeClass + '">';
    tableHtml += '<span class="summary-count">' + badgeText + '</span>';
    tableHtml += '<span class="summary-icon">' + icon + '</span>';
    tableHtml += '</div></td>';
  });

  tableHtml += '</tr></tfoot></table>';

  const fullHtml = `
<div class="matrixpro-outer-container">
  <div class="matrixpro-toolbar">
    <div class="matrixpro-brand">
      <div class="brand-title-wrap">
        <span class="matrixpro-title-logo">🔥 matrixMAX PRO</span>
        <span class="matrixpro-version-badge">v2.2 TRAFFIC LIGHT NOC</span>
      </div>
      <span class="matrixpro-subtitle">Matriz de Salud Integral con Segmentación por Sede & Tipo de Dispositivo (${counts.total} Hosts) · Milicic S.A.</span>
    </div>

    <div class="matrixpro-actions">
      <!-- Triage Filter Button -->
      <button type="button" id="btn-triage-toggle" class="matrixpro-btn triage-btn" title="Alternar entre ver todos los hosts o solo los degradados">
        <span class="btn-icon">🚨</span> <span id="triage-btn-text">Solo Alarmas (${counts.degraded})</span>
      </button>

      <!-- Sede Filter Pills -->
      <div class="matrixpro-filter-group" id="filter-sede-group" title="Filtro de Sedes Milicic">
        <button type="button" class="sede-pill active" data-sede="all">Todas (${counts.total})</button>
        <button type="button" class="sede-pill" data-sede="SRO">Rosario (${counts.sro})</button>
        <button type="button" class="sede-pill" data-sede="SSJ">San Juan (${counts.ssj})</button>
        <button type="button" class="sede-pill" data-sede="OBRADOR">Obradores (${counts.obrador})</button>
      </div>

      <!-- Search -->
      <input type="text" id="matrixpro-search-box" class="matrixpro-search" placeholder="🔍 Filtrar host, tipo o check..." />

      <!-- Sort -->
      <button type="button" id="matrixpro-btn-sort-sev" class="matrixpro-btn" title="Ordenar por mayor severidad">Severidad ↓</button>
      <button type="button" id="matrixpro-btn-sort-name" class="matrixpro-btn" title="Ordenar alfabéticamente">A-Z</button>
    </div>
  </div>

  <!-- SECONDARY TOOLBAR: DEVICE TYPE SECTORIZATION -->
  <div class="matrixpro-sector-bar">
    <span class="sector-label">🏷️ SECTOR / TIPO:</span>
    <div class="matrixpro-type-group" id="filter-type-group">
      <button type="button" class="type-pill active" data-type="all">Todos (${counts.total})</button>
      <button type="button" class="type-pill" data-type="firewall">🔥 Firewalls (${counts.types.firewall})</button>
      <button type="button" class="type-pill" data-type="switch">🌐 Switches (${counts.types.switch})</button>
      <button type="button" class="type-pill" data-type="wifi">📶 Wi-Fi APs (${counts.types.wifi})</button>
      <button type="button" class="type-pill" data-type="server">🖥️ Servidores (${counts.types.server})</button>
      <button type="button" class="type-pill" data-type="storage">💾 Storage/Virt (${counts.types.storage})</button>
      <button type="button" class="type-pill" data-type="database">📊 BD/SAP (${counts.types.database})</button>
      <button type="button" class="type-pill" data-type="ups">⚡ UPS (${counts.types.ups})</button>
    </div>
  </div>

  <div id="matrixpro-table-mount" class="matrixpro-scroll-pane">
${tableHtml}
  </div>

  <div class="matrixpro-footer-legend">
    <div class="legend-left">
      <span class="legend-item"><span class="cell-tile-mini ok">✓</span> OK (Verde)</span>
      <span class="legend-item"><span class="cell-tile-mini warning">▲</span> Warning (Amarillo)</span>
      <span class="legend-item"><span class="cell-tile-mini average">▲</span> Average (Ámbar)</span>
      <span class="legend-item"><span class="cell-tile-mini high">!</span> High (Rojo)</span>
      <span class="legend-item"><span class="cell-tile-mini disaster">✕</span> Disaster (Rojo Crítico)</span>
      <span class="legend-item"><span class="cell-tile-mini info">i</span> Info (Azul)</span>
      <span class="legend-item"><span class="cell-tile-mini empty"></span> Sin Control</span>
      <span class="legend-item"><span style="font-size: 13px;">🔧</span> Mantenimiento</span>
    </div>
    <div class="legend-right">
      <span class="legend-tip">💡 <b>NOC TIP:</b> Código de semáforo: Verde = Normal | Amarillo/Ámbar = Alerta Preventiva | Rojo = Incidente Crítico.</span>
    </div>
  </div>
</div>
`.split('\n').map(l => l.trim()).filter(Boolean).join('\n');

  return fullHtml;
}

// CSS for Panel 10 with enhanced Traffic Light icons
const matrix10Css = `
.matrixmax-outer-container {
  background: #0B0F19;
  border: 1px solid #1E293B;
  border-radius: 8px;
  padding: 16px 20px 18px 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #F8FAFC;
  width: 100%;
  box-sizing: border-box;
}
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
.matrixmax-brand { display: flex; flex-direction: column; gap: 3px; }
.matrixmax-title-logo { font-size: 18px; font-weight: 700; color: #38BDF8; letter-spacing: -0.02em; }
.matrixmax-subtitle { font-size: 11px; color: #94A3B8; }
.matrixmax-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.matrixmax-search {
  background: #06090E; border: 1px solid #334155; border-radius: 4px;
  color: #F8FAFC; padding: 6px 12px; font-size: 12px; outline: none; width: 220px;
}
.matrixmax-search:focus { border-color: #38BDF8; }
.matrixmax-btn {
  background: #1E293B; border: 1px solid #334155; border-radius: 4px;
  color: #E2E8F0; padding: 6px 10px; font-size: 11px; font-weight: 600; cursor: pointer;
}
.matrixmax-btn:hover { background: #334155; color: #FFF; }
.matrixmax-scroll-pane {
  overflow-x: auto; overflow-y: auto; max-height: 480px; width: 100%;
  border-radius: 6px; border: 1px solid #1E293B; background: #070B13;
}
.matrixmax-table {
  width: 100% !important; min-width: 820px; border-collapse: collapse; table-layout: fixed !important;
}
.matrixmax-table thead th {
  background: #0B0F19; position: sticky; top: 0; z-index: 10; border-bottom: 1px solid #1E293B;
}
.th-host-corner {
  height: 85px; vertical-align: bottom; padding: 8px 12px 10px 12px;
  text-align: left; width: 28% !important; border-right: 1px solid #1E293B;
}
.th-corner-text {
  font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.08em;
}
.th-col-rotated {
  height: 85px; position: relative; vertical-align: bottom; padding: 0;
  width: 6% !important; text-align: center; border-right: 1px solid #1E293B;
}
.th-rot-wrapper {
  position: absolute; bottom: 10px; left: 50%; width: 20px; height: 60px;
  transform: rotate(-45deg); transform-origin: 0 100%; white-space: nowrap; pointer-events: none;
}
.th-rot-text {
  font-size: 11px; font-weight: 700; color: #CBD5E1; text-transform: uppercase; letter-spacing: 0.04em;
}
.matrixmax-row { border-bottom: 1px solid #131B2A; transition: background 0.15s ease; }
.matrixmax-row:hover { background: rgba(56, 189, 248, 0.06); }
.matrixmax-row:nth-child(even) { background: rgba(15, 23, 42, 0.35); }
.matrixmax-row:nth-child(even):hover { background: rgba(56, 189, 248, 0.08); }
.td-host-link {
  display: block; padding: 7px 12px; text-decoration: none; border-right: 1px solid #1E293B;
}
.host-name-txt { font-size: 12px; font-weight: 600; color: #F1F5F9; }
.td-host-link:hover .host-name-txt { color: #38BDF8; text-decoration: underline; }
.td-cell-container {
  padding: 5px 3px; text-align: center; vertical-align: middle;
  border-right: 1px solid #131B2A; width: 6% !important;
}

/* ENHANCED TRAFFIC LIGHT CELL TILES */
.cell-tile {
  display: inline-flex; align-items: center; justify-content: center;
  width: 27px; height: 27px; border-radius: 6px; font-size: 13px; font-weight: 800;
  text-decoration: none; cursor: pointer; transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}
.cell-tile:hover { transform: scale(1.22); z-index: 5; filter: brightness(1.25); }

/* VERDE - OK */
.cell-tile.ok {
  background: #16A34A; color: #FFFFFF; border: 1px solid #22C55E;
  box-shadow: 0 2px 6px rgba(22, 163, 74, 0.35);
}

/* AMARILLO - WARNING */
.cell-tile.warning {
  background: #EAB308; color: #1C1917; border: 1px solid #FDE047; font-weight: 900;
  box-shadow: 0 2px 8px rgba(234, 179, 8, 0.5);
}

/* ÁMBAR / NARANJA - AVERAGE */
.cell-tile.average {
  background: #F97316; color: #1C1917; border: 1px solid #FDBA74; font-weight: 900;
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.5);
}

/* ROJO - HIGH */
.cell-tile.high {
  background: #EF4444; color: #FFFFFF; border: 1px solid #F87171; font-weight: 900;
  box-shadow: 0 2px 10px rgba(239, 68, 68, 0.6);
}

/* ROJO CRÍTICO - DISASTER */
.cell-tile.disaster {
  background: #DC2626; color: #FFFFFF; border: 1px solid #FCA5A5; font-weight: 900;
  box-shadow: 0 0 12px rgba(220, 38, 38, 0.75);
}

/* AZUL - INFO */
.cell-tile.info {
  background: #0284C7; color: #FFFFFF; border: 1px solid #38BDF8;
  box-shadow: 0 2px 6px rgba(2, 132, 199, 0.35);
}

/* VACÍO - SIN CONTROL */
.cell-tile.empty {
  background: rgba(15, 23, 42, 0.5); color: transparent; border: 1px dashed rgba(51, 65, 85, 0.35);
}

.matrixmax-footer-legend {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 14px; padding-top: 12px; border-top: 1px solid #1E293B;
  flex-wrap: wrap; gap: 8px; font-size: 11px; color: #94A3B8;
}
.legend-left { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.legend-item { display: inline-flex; align-items: center; gap: 6px; }
.cell-tile-mini {
  display: inline-flex; align-items: center; justify-content: center;
  width: 18px; height: 18px; border-radius: 4px; font-size: 10px; font-weight: bold;
}
.cell-tile-mini.ok { background: #16A34A; color: #FFF; border: 1px solid #22C55E; }
.cell-tile-mini.warning { background: #EAB308; color: #1C1917; border: 1px solid #FDE047; font-weight: 900; }
.cell-tile-mini.average { background: #F97316; color: #1C1917; border: 1px solid #FDBA74; font-weight: 900; }
.cell-tile-mini.high { background: #EF4444; color: #FFF; border: 1px solid #F87171; font-weight: 900; }
.cell-tile-mini.disaster { background: #DC2626; color: #FFF; border: 1px solid #FCA5A5; font-weight: 900; }
.cell-tile-mini.info { background: #0284C7; color: #FFF; border: 1px solid #38BDF8; }
.cell-tile-mini.empty { background: rgba(15, 23, 42, 0.5); border: 1px dashed rgba(51, 65, 85, 0.4); }
`;

const matrix10AfterRender = `
setTimeout(function() {
  const el = (typeof context !== 'undefined' && context && context.element) ? context.element : (typeof element !== 'undefined' ? element : document.querySelector('.matrixmax-outer-container'));
  if (!el) return;

  const sBox = el.querySelector('#matrixmax-search-box');
  const rows = el.querySelectorAll('.matrixmax-row');

  if (sBox) {
    sBox.addEventListener('input', function(e) {
      const q = (e.target.value || '').trim().toLowerCase();
      rows.forEach(function(r) {
        const name = r.getAttribute('data-name') || '';
        if (!q || name.indexOf(q) !== -1) {
          r.style.display = '';
        } else {
          r.style.display = 'none';
        }
      });
    });
  }

  const sortNameBtn = el.querySelector('#matrixmax-btn-sort-name');
  if (sortNameBtn) {
    sortNameBtn.addEventListener('click', function() {
      const tbody = el.querySelector('#matrixmax-main-table tbody');
      if (!tbody) return;
      const rowArr = Array.from(rows);
      rowArr.sort(function(a, b) {
        return (a.getAttribute('data-name') || '').localeCompare(b.getAttribute('data-name') || '');
      });
      rowArr.forEach(function(r) { tbody.appendChild(r); });
    });
  }
}, 100);
`;

// CSS for Panel 15 (PRO) with enhanced Traffic Light icons & Sector Bar
const matrixProCss = `
.matrixpro-outer-container {
  background: #0B0F19;
  border: 1px solid #1E293B;
  border-top: 3px solid #38BDF8;
  border-radius: 8px;
  padding: 16px 20px 18px 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #F8FAFC;
  width: 100%;
  box-sizing: border-box;
}
.matrixpro-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #1E293B;
}
.matrixpro-brand { display: flex; flex-direction: column; gap: 3px; }
.brand-title-wrap { display: flex; align-items: center; gap: 8px; }
.matrixpro-title-logo { font-size: 18px; font-weight: 700; color: #38BDF8; letter-spacing: -0.02em; }
.matrixpro-version-badge {
  background: rgba(56, 189, 248, 0.15); border: 1px solid #38BDF8; color: #38BDF8;
  padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase;
}
.matrixpro-subtitle { font-size: 11px; color: #94A3B8; }
.matrixpro-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.matrixpro-btn {
  background: #1E293B; border: 1px solid #334155; border-radius: 4px;
  color: #E2E8F0; padding: 6px 10px; font-size: 11px; font-weight: 600; cursor: pointer;
  transition: all 0.15s ease;
}
.matrixpro-btn:hover { background: #334155; color: #FFF; }
.triage-btn {
  background: rgba(220, 38, 38, 0.15); border: 1px solid #DC2626; color: #FCA5A5; font-weight: 700;
}
.triage-btn:hover, .triage-btn.active {
  background: #DC2626; color: #FFFFFF; border-color: #EF4444; box-shadow: 0 0 10px rgba(220, 38, 38, 0.5);
}
.matrixpro-filter-group {
  display: inline-flex; background: #06090E; border: 1px solid #334155; border-radius: 4px; padding: 2px;
}
.sede-pill {
  background: transparent; border: none; color: #94A3B8; padding: 4px 10px;
  font-size: 11px; font-weight: 600; border-radius: 3px; cursor: pointer; transition: all 0.15s ease;
}
.sede-pill:hover { color: #F8FAFC; background: rgba(51, 65, 85, 0.5); }
.sede-pill.active { background: #0284C7; color: #FFFFFF; }

/* SECTOR BAR */
.matrixpro-sector-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
  padding: 6px 10px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid #1E293B;
  border-radius: 6px;
}
.sector-label {
  font-size: 10px;
  font-weight: 800;
  color: #94A3B8;
  letter-spacing: 0.05em;
  white-space: nowrap;
}
.matrixpro-type-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}
.type-pill {
  background: transparent;
  border: 1px solid transparent;
  color: #94A3B8;
  padding: 3px 8px;
  font-size: 10.5px;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.type-pill:hover {
  background: rgba(51, 65, 85, 0.4);
  color: #F8FAFC;
}
.type-pill.active {
  background: #1E293B;
  border-color: #38BDF8;
  color: #38BDF8;
  font-weight: 700;
  box-shadow: 0 0 6px rgba(56, 189, 248, 0.2);
}

.matrixpro-search {
  background: #06090E; border: 1px solid #334155; border-radius: 4px;
  color: #F8FAFC; padding: 6px 12px; font-size: 12px; outline: none; width: 190px;
}
.matrixpro-search:focus { border-color: #38BDF8; }
.matrixpro-scroll-pane {
  overflow-x: auto; overflow-y: auto; max-height: 520px; width: 100%;
  border-radius: 6px; border: 1px solid #1E293B; background: #070B13;
}
.matrixpro-table {
  width: 100% !important; min-width: 820px; border-collapse: collapse; table-layout: fixed !important;
}
.matrixpro-table thead th {
  background: #0B0F19; position: sticky; top: 0; z-index: 10; border-bottom: 1px solid #1E293B;
}
.thpro-host-corner {
  height: 85px; vertical-align: bottom; padding: 8px 12px 10px 12px;
  text-align: left; width: 28% !important; border-right: 1px solid #1E293B;
}
.thpro-corner-text {
  font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.08em;
}
.thpro-col-rotated {
  height: 85px; position: relative; vertical-align: bottom; padding: 0;
  width: 6% !important; text-align: center; border-right: 1px solid #1E293B;
}
.thpro-rot-wrapper {
  position: absolute; bottom: 10px; left: 50%; width: 20px; height: 60px;
  transform: rotate(-45deg); transform-origin: 0 100%; white-space: nowrap; pointer-events: none;
}
.thpro-rot-text {
  font-size: 11px; font-weight: 700; color: #CBD5E1; text-transform: uppercase; letter-spacing: 0.04em;
}
.matrixpro-row { border-bottom: 1px solid #131B2A; transition: background 0.15s ease; }
.matrixpro-row:hover { background: rgba(56, 189, 248, 0.06); }
.matrixpro-row:nth-child(even) { background: rgba(15, 23, 42, 0.35); }
.matrixpro-row:nth-child(even):hover { background: rgba(56, 189, 248, 0.08); }
.tdpro-host {
  display: block; padding: 6px 12px; text-decoration: none; border-right: 1px solid #1E293B;
}
.host-meta-badges { display: flex; align-items: center; gap: 4px; margin-top: 3px; flex-wrap: wrap; }
.badge-sede {
  font-size: 9px; font-weight: 700; padding: 1px 4px; border-radius: 3px; text-transform: uppercase;
}
.badge-sede.sro { background: rgba(56, 189, 248, 0.15); color: #38BDF8; border: 1px solid rgba(56, 189, 248, 0.3); }
.badge-sede.ssj { background: rgba(168, 85, 247, 0.15); color: #C084FC; border: 1px solid rgba(168, 85, 247, 0.3); }
.badge-sede.obrador { background: rgba(245, 158, 11, 0.15); color: #FBBF24; border: 1px solid rgba(245, 158, 11, 0.3); }

.badge-type {
  font-size: 9px; font-weight: 700; padding: 1px 4px; border-radius: 3px;
}
.badge-type.type-firewall { background: rgba(239, 68, 68, 0.15); color: #F87171; border: 1px solid rgba(239, 68, 68, 0.3); }
.badge-type.type-switch { background: rgba(59, 130, 246, 0.15); color: #60A5FA; border: 1px solid rgba(59, 130, 246, 0.3); }
.badge-type.type-wifi { background: rgba(16, 185, 129, 0.15); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.3); }
.badge-type.type-server { background: rgba(99, 102, 241, 0.15); color: #818CF8; border: 1px solid rgba(99, 102, 241, 0.3); }
.badge-type.type-storage { background: rgba(236, 72, 153, 0.15); color: #F472B6; border: 1px solid rgba(236, 72, 153, 0.3); }
.badge-type.type-database { background: rgba(245, 158, 11, 0.15); color: #FBBF24; border: 1px solid rgba(245, 158, 11, 0.3); }
.badge-type.type-ups { background: rgba(234, 179, 8, 0.15); color: #FDE047; border: 1px solid rgba(234, 179, 8, 0.3); }

.badge-tier {
  font-size: 9px; font-weight: 600; padding: 1px 4px; border-radius: 3px;
  background: rgba(100, 116, 139, 0.2); color: #94A3B8;
}
.tdpro-cell-container {
  padding: 5px 3px; text-align: center; vertical-align: middle;
  border-right: 1px solid #131B2A; width: 6% !important;
}

/* ENHANCED TRAFFIC LIGHT CELL TILES */
.cell-tile {
  display: inline-flex; align-items: center; justify-content: center;
  width: 27px; height: 27px; border-radius: 6px; font-size: 13px; font-weight: 800;
  text-decoration: none; cursor: pointer; transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}
.cell-tile:hover { transform: scale(1.22); z-index: 5; filter: brightness(1.25); }

/* VERDE - OK */
.cell-tile.ok {
  background: #16A34A; color: #FFFFFF; border: 1px solid #22C55E;
  box-shadow: 0 2px 6px rgba(22, 163, 74, 0.35);
}

/* AMARILLO - WARNING */
.cell-tile.warning {
  background: #EAB308; color: #1C1917; border: 1px solid #FDE047; font-weight: 900;
  box-shadow: 0 2px 8px rgba(234, 179, 8, 0.5);
}

/* ÁMBAR / NARANJA - AVERAGE */
.cell-tile.average {
  background: #F97316; color: #1C1917; border: 1px solid #FDBA74; font-weight: 900;
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.5);
}

/* ROJO - HIGH */
.cell-tile.high {
  background: #EF4444; color: #FFFFFF; border: 1px solid #F87171; font-weight: 900;
  box-shadow: 0 2px 10px rgba(239, 68, 68, 0.6);
}

/* ROJO CRÍTICO - DISASTER */
.cell-tile.disaster {
  background: #DC2626; color: #FFFFFF; border: 1px solid #FCA5A5; font-weight: 900;
  box-shadow: 0 0 12px rgba(220, 38, 38, 0.75);
}

/* AZUL - INFO */
.cell-tile.info {
  background: #0284C7; color: #FFFFFF; border: 1px solid #38BDF8;
  box-shadow: 0 2px 6px rgba(2, 132, 199, 0.35);
}

/* VACÍO - SIN CONTROL */
.cell-tile.empty {
  background: rgba(15, 23, 42, 0.5); color: transparent; border: 1px dashed rgba(51, 65, 85, 0.35);
}

.matrixpro-summary-row {
  background: #080D1A; position: sticky; bottom: 0; z-index: 10;
  border-top: 2px solid #38BDF8; box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.5);
}
.tdpro-summary-label {
  padding: 8px 12px; border-right: 1px solid #1E293B; vertical-align: middle; width: 28% !important;
}
.summary-label-content { display: flex; flex-direction: column; gap: 2px; }
.summary-title { font-size: 11px; font-weight: 800; color: #F8FAFC; letter-spacing: 0.02em; }
.summary-sub { font-size: 9px; color: #38BDF8; font-weight: 600; }
.tdpro-summary-cell {
  padding: 5px 3px; text-align: center; vertical-align: middle;
  border-right: 1px solid #1E293B; width: 6% !important;
}
.summary-pill {
  display: inline-flex; align-items: center; justify-content: center; gap: 3px;
  padding: 4px 8px; border-radius: 5px; font-size: 12px; font-weight: 800; min-width: 26px;
}
.summary-pill.summary-ok {
  background: rgba(22, 163, 74, 0.25); color: #4ADE80; border: 1px solid #22C55E;
}
.summary-pill.summary-warn {
  background: rgba(234, 179, 8, 0.25); color: #FACC15; border: 1px solid #EAB308;
}
.summary-pill.summary-avg {
  background: rgba(249, 115, 22, 0.25); color: #FB923C; border: 1px solid #F97316;
}
.summary-pill.summary-disaster {
  background: rgba(239, 68, 68, 0.25); color: #F87171; border: 1px solid #EF4444;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
}
.matrixpro-footer-legend {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 14px; padding-top: 12px; border-top: 1px solid #1E293B;
  flex-wrap: wrap; gap: 8px; font-size: 11px; color: #94A3B8;
}
.legend-tip { color: #CBD5E1; }
`;

const matrixProAfterRender = `
setTimeout(function() {
  const el = (typeof context !== 'undefined' && context && context.element) ? context.element : (typeof element !== 'undefined' ? element : document.querySelector('.matrixpro-outer-container'));
  if (!el) return;

  const triageBtn = el.querySelector('#btn-triage-toggle');
  const triageText = el.querySelector('#triage-btn-text');
  const sedeBtns = el.querySelectorAll('.sede-pill');
  const typeBtns = el.querySelectorAll('.type-pill');
  const sBox = el.querySelector('#matrixpro-search-box');
  const rows = el.querySelectorAll('.matrixpro-row');

  let currentSede = 'all';
  let currentType = 'all';
  let onlyAlarms = false;

  function applyFilters() {
    const q = sBox ? (sBox.value || '').trim().toLowerCase() : '';
    rows.forEach(function(r) {
      const name = r.getAttribute('data-name') || '';
      const sede = r.getAttribute('data-sede') || '';
      const type = r.getAttribute('data-type') || '';
      const hasAlarm = r.getAttribute('data-hasalarm') === 'true';

      let visible = true;
      if (currentSede !== 'all' && sede !== currentSede) visible = false;
      if (currentType !== 'all' && type !== currentType) visible = false;
      if (onlyAlarms && !hasAlarm) visible = false;
      if (q && name.indexOf(q) === -1 && sede.toLowerCase().indexOf(q) === -1 && type.indexOf(q) === -1) visible = false;

      r.style.display = visible ? '' : 'none';
    });
  }

  if (triageBtn) {
    triageBtn.addEventListener('click', function() {
      onlyAlarms = !onlyAlarms;
      triageBtn.classList.toggle('active', onlyAlarms);
      if (triageText) {
        triageText.textContent = onlyAlarms ? 'Ver Todos (${counts.total})' : 'Solo Alarmas (${counts.degraded})';
      }
      applyFilters();
    });
  }

  sedeBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      sedeBtns.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentSede = btn.getAttribute('data-sede');
      applyFilters();
    });
  });

  typeBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      typeBtns.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentType = btn.getAttribute('data-type');
      applyFilters();
    });
  });

  if (sBox) {
    sBox.addEventListener('input', applyFilters);
  }

  const sortNameBtn = el.querySelector('#matrixpro-btn-sort-name');
  if (sortNameBtn) {
    sortNameBtn.addEventListener('click', function() {
      const tbody = el.querySelector('#matrixpro-main-table tbody');
      if (!tbody) return;
      const rowArr = Array.from(rows);
      rowArr.sort(function(a, b) {
        return (a.getAttribute('data-name') || '').localeCompare(b.getAttribute('data-name') || '');
      });
      rowArr.forEach(function(r) { tbody.appendChild(r); });
    });
  }

  const sortSevBtn = el.querySelector('#matrixpro-btn-sort-sev');
  if (sortSevBtn) {
    sortSevBtn.addEventListener('click', function() {
      const tbody = el.querySelector('#matrixpro-main-table tbody');
      if (!tbody) return;
      const rowArr = Array.from(rows);
      rowArr.sort(function(a, b) {
        const aAlarm = a.getAttribute('data-hasalarm') === 'true' ? 1 : 0;
        const bAlarm = b.getAttribute('data-hasalarm') === 'true' ? 1 : 0;
        return bAlarm - aAlarm;
      });
      rowArr.forEach(function(r) { tbody.appendChild(r); });
    });
  }
}, 100);
`;

async function main() {
  console.log('Fetching dashboard from Grafana...');
  const currentRes = await grafanaRequest('GET', '/api/dashboards/uid/zabbix-matrixmax-overview');
  if (currentRes.status !== 200 || !currentRes.data?.dashboard) {
    throw new Error('Failed to fetch dashboard: ' + JSON.stringify(currentRes));
  }

  const dashboard = currentRes.data.dashboard;
  console.log('Current Dashboard Version:', dashboard.version);

  const panel10Html = buildPanel10Html(allHostsList);
  const panel15Html = buildPanel15Html(allHostsList);

  // Update Panel 10 with enhanced Traffic Light styling
  const panel10 = dashboard.panels.find(p => p.id === 10);
  if (panel10) {
    panel10.title = '🎯 matrixMAX (Original / Estándar) · Control Matricial de Salud (' + counts.total + ' Hosts)';
    panel10.gridPos = { x: 0, y: 5, w: 24, h: 16 };
    panel10.options.content = panel10Html;
    panel10.options.defaultContent = panel10Html;
    panel10.options.styles = matrix10Css;
    panel10.options.afterRender = matrix10AfterRender;
  }

  // Row 150
  let row150 = dashboard.panels.find(p => p.id === 150);
  if (!row150) {
    row150 = {
      id: 150,
      title: '🚀 MATRIXMAX PRO (AVANZADO CON MEJORAS NOC): SALUD SISTÉMICA, TRIAGE & SECTORIZACIÓN',
      type: 'row',
      gridPos: { x: 0, y: 21, w: 24, h: 1 },
      collapsed: false
    };
  } else {
    row150.gridPos = { x: 0, y: 21, w: 24, h: 1 };
  }

  // Panel 15 (PRO) with Traffic Light styling & Sectorization
  let panel15 = dashboard.panels.find(p => p.id === 15);
  if (!panel15) {
    panel15 = {
      id: 15,
      title: '🔥 matrixMAX PRO (Optimizado) · Salud Sistémica, Triage NOC & Sectorización por Tipo (' + counts.total + ' Hosts)',
      description: 'Versión profesional con fila inferior de impacto sistémico, triage rápido, segmentación por sedes, sectorización por tipos de dispositivos e iconos semafóricos de alto impacto visual (Rojo, Amarillo, Verde).',
      type: 'marcusolsson-dynamictext-panel',
      gridPos: { x: 0, y: 22, w: 24, h: 19 },
      options: {
        wrap: false,
        content: panel15Html,
        defaultContent: panel15Html,
        styles: matrixProCss,
        afterRender: matrixProAfterRender
      }
    };
  } else {
    panel15.title = '🔥 matrixMAX PRO (Optimizado) · Salud Sistémica, Triage NOC & Sectorización por Tipo (' + counts.total + ' Hosts)';
    panel15.gridPos = { x: 0, y: 22, w: 24, h: 19 };
    panel15.options.content = panel15Html;
    panel15.options.defaultContent = panel15Html;
    panel15.options.styles = matrixProCss;
    panel15.options.afterRender = matrixProAfterRender;
  }

  // Shift following panels down:
  const row200 = dashboard.panels.find(p => p.id === 200);
  if (row200) row200.gridPos = { x: 0, y: 41, w: 24, h: 1 };

  const panel20 = dashboard.panels.find(p => p.id === 20);
  if (panel20) panel20.gridPos = { x: 0, y: 42, w: 14, h: 11 };

  const panel21 = dashboard.panels.find(p => p.id === 21);
  if (panel21) panel21.gridPos = { x: 14, y: 42, w: 10, h: 11 };

  const row300 = dashboard.panels.find(p => p.id === 300);
  if (row300) row300.gridPos = { x: 0, y: 53, w: 24, h: 1 };

  const panel30 = dashboard.panels.find(p => p.id === 30);
  if (panel30) panel30.gridPos = { x: 0, y: 54, w: 24, h: 10 };

  const existingOtherPanels = dashboard.panels.filter(p => ![150, 15].includes(p.id));
  const idx10 = existingOtherPanels.findIndex(p => p.id === 10);
  if (idx10 !== -1) {
    existingOtherPanels.splice(idx10 + 1, 0, row150, panel15);
  } else {
    existingOtherPanels.push(row150, panel15);
  }

  dashboard.panels = existingOtherPanels;

  console.log('Deploying Traffic Light Matrix (Red, Yellow, Green) to Grafana...');
  const res = await grafanaRequest('POST', '/api/dashboards/db', {
    dashboard: dashboard,
    overwrite: true
  });

  if (res.status === 200 && res.data?.status === 'success') {
    console.log('SUCCESS! Version', res.data.version, 'deployed at:', `http://${grafanaHost}:${grafanaPort}${res.data.url}`);
    fs.writeFileSync('dashboards/zabbix-matrixmax.json', JSON.stringify(dashboard, null, 2), 'utf8');
    fs.copyFileSync('scratch/deploy_traffic_light_matrix.mjs', 'scripts/build_matrixmax_dashboard.mjs');
    console.log('Synchronized scripts/build_matrixmax_dashboard.mjs and dashboards/zabbix-matrixmax.json');
  } else {
    throw new Error('Deploy failed: ' + JSON.stringify(res));
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
