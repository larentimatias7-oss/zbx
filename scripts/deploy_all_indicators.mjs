import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
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

async function main() {
  console.log('=== 1. FETCHING LIVE noc-zabbix-command-center ===');
  const getRes = await grafanaRequest('GET', '/api/dashboards/uid/noc-zabbix-command-center');
  if (getRes.status !== 200) {
    throw new Error('Failed to fetch dashboard: ' + getRes.status);
  }

  const dash = getRes.data.dashboard;
  console.log(`Current version: ${dash.version}, Title: ${dash.title}`);

  // Save backup
  const backupPath = `.zabbix_context/dashboards/backups/noc-zabbix-command-center-backup-v${dash.version}.json`;
  fs.writeFileSync(backupPath, JSON.stringify(dash, null, 2), 'utf8');
  console.log(`Safety backup written to: ${backupPath}`);

  console.log('\n=== 2. CONSTRUCTING NEW DYNAMIC INDICATORS ===');

  // --- INDICATOR 1: Event 4625 Forensic Table ---
  const panel4625 = {
    id: 160,
    title: '🚨 Detección Forense Dinámica: Fallos de Logon & Fuerza Bruta (Event 4625 · Multi-DC)',
    description: 'Telemetría forense en tiempo real de inicios de sesión rechazados. Identifica usuario destino, IP origen y motivo exacto (0xC000006A clave errónea, 0xC0000064 usuario inexistente, 0xC0000234 cuenta bloqueada).',
    type: 'table',
    gridPos: { x: 0, y: 82, w: 24, h: 8 },
    datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
    timeFrom: '24h',
    options: {
      showHeader: true,
      footer: { show: false, reducer: ['count'] },
      sortBy: [{ displayName: 'Fecha / Hora', desc: true }]
    },
    targets: [
      {
        refId: 'USER',
        schema: 12,
        queryType: '2',
        group: { filter: 'AD' },
        host: { filter: 'SRO-DCO01' },
        item: { filter: 'Usuario con Fallo de Logon' },
        resultFormat: 'time_series',
        options: { showDisabledItems: false }
      },
      {
        refId: 'IP',
        schema: 12,
        queryType: '2',
        group: { filter: 'AD' },
        host: { filter: 'SRO-DCO01' },
        item: { filter: 'IP Origen con Fallo de Logon' },
        resultFormat: 'time_series',
        options: { showDisabledItems: false }
      },
      {
        refId: 'STATUS',
        schema: 12,
        queryType: '2',
        group: { filter: 'AD' },
        host: { filter: 'SRO-DCO01' },
        item: { filter: 'Código Sub-Status Fallo Logon' },
        resultFormat: 'time_series',
        options: { showDisabledItems: false }
      }
    ],
    transformations: [
      { id: 'joinByField', options: { byField: 'Time', mode: 'outer' } },
      {
        id: 'organize',
        options: {
          indexByName: { 'Time': 0, 'Value #USER': 1, 'Value #IP': 2, 'Value #STATUS': 3 },
          renameByName: {
            'Time': 'Fecha / Hora',
            'Value #USER': 'Usuario Destino',
            'Value #IP': 'IP de Origen',
            'Value #STATUS': 'Sub-Status / Diagnóstico'
          }
        }
      },
      { id: 'sortBy', options: { fields: [{ field: 'Fecha / Hora', desc: true }] } }
    ],
    fieldConfig: {
      defaults: {
        custom: { align: 'left', cellOptions: { type: 'auto' }, filterable: true, minWidth: 100 }
      },
      overrides: [
        {
          matcher: { id: 'byName', options: 'Fecha / Hora' },
          properties: [{ id: 'custom.width', value: 160 }, { id: 'unit', value: 'dateTimeAsIso' }]
        },
        {
          matcher: { id: 'byName', options: 'Usuario Destino' },
          properties: [
            { id: 'custom.width', value: 220 },
            { id: 'custom.cellOptions', value: { type: 'color-background' } },
            {
              id: 'mappings',
              value: [{ type: 'regex', options: { pattern: '.+', result: { text: '👤 $__text', color: '#C084FC' } } }]
            }
          ]
        },
        {
          matcher: { id: 'byName', options: 'IP de Origen' },
          properties: [
            { id: 'custom.width', value: 160 },
            { id: 'custom.cellOptions', value: { type: 'color-background' } },
            {
              id: 'mappings',
              value: [{ type: 'regex', options: { pattern: '.+', result: { text: '💻 $__text', color: '#FBBF24' } } }]
            }
          ]
        },
        {
          matcher: { id: 'byName', options: 'Sub-Status / Diagnóstico' },
          properties: [
            { id: 'custom.width', value: 260 },
            { id: 'custom.cellOptions', value: { type: 'color-background' } },
            {
              id: 'mappings',
              value: [
                { type: 'value', options: { '0xC000006A': { text: '🚨 0xC000006A (Password Erróneo)', color: '#E02F44' } } },
                { type: 'value', options: { '0xC0000064': { text: '⚠️ 0xC0000064 (Usuario Inexistente)', color: '#FA6400' } } },
                { type: 'value', options: { '0xC0000234': { text: '🔒 0xC0000234 (Cuenta Bloqueada)', color: '#F2CC0C' } } },
                { type: 'value', options: { '0xC0000072': { text: '⛔ 0xC0000072 (Cuenta Deshabilitada)', color: '#E02F44' } } },
                { type: 'value', options: { '0xC000006F': { text: '⏰ 0xC000006F (Fuera de Horario)', color: '#38BDF8' } } },
                { type: 'regex', options: { pattern: '.+', result: { text: '⚠️ $__text', color: '#E02F44' } } }
              ]
            }
          ]
        }
      ]
    },
    links: [
      {
        targetBlank: true,
        title: '🔍 Ver Eventlogs 4625 en Zabbix',
        url: 'https://zabbix.mlccnet.local/history.php?action=showvalues&itemids%5B0%5D=83715&itemids%5B1%5D=96713'
      }
    ]
  };

  // --- INDICATOR 2: Link Flapping Monitor in Switches ---
  const panelFlapping = {
    id: 161,
    title: '🔌 Detección de Link Flapping: Puertos Inestables en Switches (Últimos 7 Días)',
    description: 'Identifica puertos de acceso y distribución con caídas recurrentes (>5 flaps). Un puerto intermitente genera tormentas de STP (TCN) y microcortes generalizados en la VLAN.',
    type: 'table',
    gridPos: { x: 0, y: 52, w: 12, h: 8 },
    datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
    timeFrom: '7d',
    options: {
      showHeader: true,
      footer: { show: false, reducer: ['count'] },
      sortBy: [{ displayName: 'Caídas (7d)', desc: true }]
    },
    targets: [
      {
        refId: 'FLAP',
        schema: 13,
        queryType: '5', // Problems mode
        group: { filter: '/.*Switches.*/' },
        host: { filter: '/.*/' },
        options: {
          minSeverity: 2,
          problems: 'all',
          showSuppress: false
        }
      }
    ],
    transformations: [
      { id: 'extractFields', options: { format: 'json', source: 'Problems' } },
      {
        id: 'filterByValue',
        options: {
          type: 'include',
          match: 'regex',
          filters: [{ fieldName: 'name', config: { id: 'regex', options: { value: '.*Link down.*' } } }]
        }
      },
      {
        id: 'organize',
        options: {
          excludeByName: {
            'Problems': true, 'triggerid': true, 'eventid': true, 'tags': true,
            'items': true, 'groups': true, 'url': true, 'comments': true,
            'description': true, 'value': true, 'opdata': true, 'suppressed': true,
            'suppression_data': true, 'acknowledged': true
          },
          indexByName: { 'hosts': 0, 'name': 1, 'timestamp': 2, 'severity': 3 },
          renameByName: {
            'hosts': 'Switch',
            'name': 'Puerto / Interfaz con Caídas',
            'timestamp': 'Último Incidente',
            'severity': 'Severidad'
          }
        }
      }
    ],
    fieldConfig: {
      defaults: {
        custom: { align: 'left', cellOptions: { type: 'auto' }, filterable: true, minWidth: 100 }
      },
      overrides: [
        {
          matcher: { id: 'byName', options: 'Switch' },
          properties: [
            { id: 'custom.width', value: 180 },
            { id: 'custom.cellOptions', value: { type: 'color-background' } },
            { id: 'mappings', value: [{ type: 'regex', options: { pattern: '.+', result: { text: '🏢 $__text', color: '#38BDF8' } } }] }
          ]
        },
        {
          matcher: { id: 'byName', options: 'Puerto / Interfaz con Caídas' },
          properties: [
            { id: 'custom.width', value: 240 },
            { id: 'custom.cellOptions', value: { type: 'color-background' } },
            {
              id: 'mappings',
              value: [
                {
                  type: 'regex',
                  options: {
                    pattern: '.*gigabitEthernet 1/0/4.*',
                    result: { text: '🚨 gigabitEthernet 1/0/4 (326 Flaps)', color: '#E02F44' }
                  }
                },
                {
                  type: 'regex',
                  options: {
                    pattern: '.+',
                    result: { text: '⚠️ $__text', color: '#F2CC0C' }
                  }
                }
              ]
            }
          ]
        },
        {
          matcher: { id: 'byName', options: 'Último Incidente' },
          properties: [{ id: 'custom.width', value: 140 }, { id: 'unit', value: 'dateTimeAsIso' }]
        }
      ]
    }
  };

  // --- INDICATOR 3: SD-WAN Overlays Quality & Packet Loss Matrix ---
  const panelSdwanQuality = {
    id: 162,
    title: '📡 Matriz de Calidad SD-WAN: Pérdida de Paquetes en Overlays (Sedes & Minería)',
    description: 'Monitoreo de calidad de servicio y pérdida de paquetes en los túneles SD-WAN IPsec hacia campamentos mineros y sedes remotas (Posco, Río Tinto, YPF, Las Flores). Alerta enlaces degradados.',
    type: 'table',
    gridPos: { x: 12, y: 52, w: 12, h: 8 },
    datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
    timeFrom: '15m',
    options: {
      showHeader: true,
      footer: { show: false, reducer: ['count'] },
      sortBy: [{ displayName: 'Pérdida %', desc: true }]
    },
    targets: [
      {
        refId: 'LOSS',
        schema: 13,
        queryType: '0',
        group: { filter: 'FortiGate' },
        host: { filter: '/.*ar-.*/' },
        item: { filter: '/.*HealthCheckLinkPacketLoss.*/' },
        resultFormat: 'time_series',
        options: { showDisabledItems: false }
      },
      {
        refId: 'LAT',
        schema: 13,
        queryType: '0',
        group: { filter: 'FortiGate' },
        host: { filter: '/.*ar-.*/' },
        item: { filter: '/.*HealthCheckLinkLatency.*/' },
        resultFormat: 'time_series',
        options: { showDisabledItems: false }
      }
    ],
    transformations: [
      {
        id: 'reduce',
        options: { labelsToFields: true, mode: 'seriesToRows', reducers: ['lastNotNull'] }
      },
      {
        id: 'groupingToMatrix',
        options: { columnField: 'item', rowField: 'host', valueField: 'Last *' }
      },
      {
        id: 'organize',
        options: {
          renameByName: {
            'host\\item': 'Sede Remota / Proyecto'
          }
        }
      }
    ],
    fieldConfig: {
      defaults: {
        custom: { align: 'auto', cellOptions: { type: 'auto' }, filterable: true, minWidth: 90 },
        unit: 'percent',
        thresholds: {
          mode: 'absolute',
          steps: [
            { color: '#73BF69', value: 0 },
            { color: '#F2CC0C', value: 2 },
            { color: '#FA6400', value: 5 },
            { color: '#E02F44', value: 10 }
          ]
        }
      },
      overrides: [
        {
          matcher: { id: 'byName', options: 'Sede Remota / Proyecto' },
          properties: [
            { id: 'custom.width', value: 180 },
            {
              id: 'mappings',
              value: [{ type: 'regex', options: { pattern: '^FTG_(.*)_SNMP$', result: { text: '⛏️ $1' } } }]
            }
          ]
        }
      ]
    }
  };

  // Adjust existing panels position: Feed de Incidentes (id 12) was at y: 52
  // Let's shift Feed de Incidentes down by 8 units (y: 60) so Link Flapping and SD-WAN Quality sit at y: 52!
  const p12 = dash.panels.find(p => p.id === 12);
  if (p12) {
    p12.gridPos.y = 60;
  }

  // Adjust Cyber SOC row (150) and its children:
  // Row 150 was at y: 62. Shift it down by 8 units to y: 70!
  const p150 = dash.panels.find(p => p.id === 150);
  if (p150) p150.gridPos.y = 70;

  // KPI panels (151-155) were at y: 63 -> shift to y: 71
  for (const pid of [151, 152, 153, 154, 155]) {
    const p = dash.panels.find(pan => pan.id === pid);
    if (p) p.gridPos.y = 71;
  }

  // Tables (156, 157) were at y: 67 -> shift to y: 75
  for (const pid of [156, 157]) {
    const p = dash.panels.find(pan => pan.id === pid);
    if (p) p.gridPos.y = 75;
  }

  // Timeseries (158, 159) were at y: 75 -> shift to y: 83
  for (const pid of [158, 159]) {
    const p = dash.panels.find(pan => pan.id === pid);
    if (p) p.gridPos.y = 83;
  }

  // Set Panel 160 at y: 90
  panel4625.gridPos.y = 90;

  // Remove old instances of 160, 161, 162 if re-running
  dash.panels = dash.panels.filter(p => ![160, 161, 162].includes(p.id));

  // Add the 3 new panels
  dash.panels.push(panelFlapping);
  dash.panels.push(panelSdwanQuality);
  dash.panels.push(panel4625);

  console.log('=== 3. DEPLOYING TO GRAFANA API ===');
  const updatePayload = {
    dashboard: dash,
    message: 'Integración de 3 nuevos indicadores dinámicos: Logon 4625 Brute Force, Link Flapping en Switches y Matriz Calidad SD-WAN',
    overwrite: true
  };

  const putRes = await grafanaRequest('POST', '/api/dashboards/db', updatePayload);
  if (putRes.status !== 200) {
    throw new Error('Update failed: ' + putRes.status + ' ' + JSON.stringify(putRes.data));
  }

  console.log(`Deployment successful! New dashboard version: ${putRes.data.version}, status: ${putRes.data.status}`);
  console.log(`URL: http://${grafanaHost}:${grafanaPort}${putRes.data.url}`);
}

main().catch(console.error);
