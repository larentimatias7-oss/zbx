import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

function api(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: '172.27.210.154',
      port: 3005,
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

async function run() {
  console.log('Fetching live dashboard from Grafana...');
  const res = await api('/api/dashboards/uid/noc-zabbix-command-center');
  if (res.status !== 200) {
    console.error('Failed to fetch dashboard:', res);
    return;
  }

  const dash = res.data.dashboard;
  console.log(`Current version: ${dash.version}, Panels: ${dash.panels.length}`);

  // Find max ID currently used
  let maxId = 0;
  dash.panels.forEach(p => {
    if (p.id > maxId) maxId = p.id;
  });

  // 1. Adjust Header Row (y: 0, h: 3)
  // Panel 1: Banner text -> width 12
  const p1 = dash.panels.find(p => p.id === 1);
  if (p1) {
    p1.gridPos = { h: 3, w: 12, x: 0, y: 0 };
  }

  // Panel 24: Teletrabajo - Usuarios VPN SSL Activos (x: 12, w: 4, h: 3)
  let pVpn = dash.panels.find(p => p._customTag === 'vpn-users');
  if (!pVpn) {
    pVpn = {
      id: ++maxId,
      _customTag: 'vpn-users',
      title: 'Teletrabajo (VPN SSL Activas)',
      type: 'stat',
      gridPos: { h: 3, w: 4, x: 12, y: 0 },
      datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
      targets: [
        {
          refId: 'A',
          schema: 13,
          queryType: '0',
          group: { filter: 'FortiGate' },
          host: { filter: '/milicic_border1/' },
          item: { filter: 'Active SSL VPN users' },
          resultFormat: 'time_series',
          datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
          options: { showDisabledItems: false }
        }
      ],
      transformations: [
        {
          id: 'renameByRegex',
          options: { regex: '.*', renamePattern: 'Usuarios Conectados' }
        }
      ],
      fieldConfig: {
        defaults: {
          color: { mode: 'thresholds' },
          thresholds: {
            mode: 'absolute',
            steps: [
              { color: '#5794F2', value: 0 },
              { color: '#73BF69', value: 10 },
              { color: '#FADE2A', value: 60 }
            ]
          },
          unit: 'none'
        }
      },
      options: {
        colorMode: 'background',
        graphMode: 'area',
        justifyMode: 'center',
        orientation: 'auto',
        reduceOptions: { calcs: ['lastNotNull'], fields: '', values: false },
        textMode: 'auto'
      }
    };
    dash.panels.push(pVpn);
  } else {
    pVpn.gridPos = { h: 3, w: 4, x: 12, y: 0 };
  }

  // Panel 16: Último dato recibido -> x: 16, w: 4, h: 3
  const p16 = dash.panels.find(p => p.id === 16);
  if (p16) {
    p16.gridPos = { h: 3, w: 4, x: 16, y: 0 };
  }

  // Panel 11: Facilities & Energía -> x: 20, w: 4, h: 3
  const p11 = dash.panels.find(p => p.id === 11);
  if (p11) {
    p11.gridPos = { h: 3, w: 4, x: 20, y: 0 };
  }

  // 2. Fila 5 (y: 35, h: 9): MATRICES CRUZADAS DE CONECTIVIDAD Y SERVIDORES
  dash.panels = dash.panels.filter(p => p._customTag !== 'wan-matrix-table' && p._customTag !== 'server-matrix-table');
  // Panel 25: Matriz de Telecomunicaciones & Sedes WAN (w: 12, x: 0, y: 35, h: 9)
  let pWanTable = {
    id: 25,
    _customTag: 'wan-matrix-table',
    title: 'Matriz WAN de Sedes & Enlaces Remotos (Estado, Latencia, Pérdida y Sesiones)',
    type: 'table',
    gridPos: { h: 9, w: 12, x: 0, y: 35 },
      datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
      targets: [
        {
          refId: 'A',
          schema: 13,
          queryType: '0',
          group: { filter: 'FortiGate' },
          host: { filter: '/${sede:raw}/' },
          item: { filter: 'ICMP ping' },
          resultFormat: 'time_series',
          datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
          options: { showDisabledItems: false }
        },
        {
          refId: 'B',
          schema: 13,
          queryType: '0',
          group: { filter: 'FortiGate' },
          host: { filter: '/${sede:raw}/' },
          item: { filter: 'ICMP response time' },
          resultFormat: 'time_series',
          datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
          options: { showDisabledItems: false }
        },
        {
          refId: 'C',
          schema: 13,
          queryType: '0',
          group: { filter: 'FortiGate' },
          host: { filter: '/${sede:raw}/' },
          item: { filter: 'ICMP loss' },
          resultFormat: 'time_series',
          datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
          options: { showDisabledItems: false }
        },
        {
          refId: 'D',
          schema: 13,
          queryType: '0',
          group: { filter: 'FortiGate' },
          host: { filter: '/${sede:raw}/' },
          item: { filter: '/IPv4 Active sessions/' },
          resultFormat: 'time_series',
          datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
          options: { showDisabledItems: false }
        }
      ],
      transformations: [
        {
          id: 'reduce',
          options: {
            labelsToFields: true,
            mode: 'seriesToRows',
            reducers: ['lastNotNull']
          }
        },
        {
          id: 'groupingToMatrix',
          options: {
            columnField: 'item',
            rowField: 'host',
            valueField: 'Last *'
          }
        },
        {
          id: 'organize',
          options: {
            excludeByName: {},
            indexByName: {
              'host\\item': 0,
              'ICMP ping': 1,
              'ICMP response time': 2,
              'ICMP loss': 3,
              'IPv4 Active sessions': 4
            },
            renameByName: {
              'host\\item': 'Sede / Obra',
              'ICMP ping': 'Disponibilidad',
              'ICMP response time': 'Latencia',
              'ICMP loss': 'Pérdida %',
              'IPv4 Active sessions': 'Sesiones Activas'
            }
          }
        },
        {
          id: 'sortBy',
          options: {
            fields: {},
            sort: [{ desc: false, field: 'Disponibilidad' }]
          }
        }
      ],
      fieldConfig: {
        defaults: {
          custom: {
            align: 'auto',
            cellOptions: { type: 'auto' },
            inspect: false
          }
        },
        overrides: [
          {
            matcher: { id: 'byName', options: 'Estado' },
            properties: [
              {
                id: 'mappings',
                value: [
                  { type: 'value', options: { '1': { text: 'ONLINE', color: '#73BF69', index: 0 } } },
                  { type: 'value', options: { '0': { text: 'OFFLINE', color: '#E02F44', index: 1 } } }
                ]
              },
              { id: 'custom.cellOptions', value: { type: 'color-background', mode: 'basic' } }
            ]
          },
          {
            matcher: { id: 'byName', options: 'Latencia' },
            properties: [
              { id: 'unit', value: 's' },
              { id: 'decimals', value: 1 },
              {
                id: 'thresholds',
                value: {
                  mode: 'absolute',
                  steps: [
                    { color: '#73BF69', value: 0 },
                    { color: '#FADE2A', value: 0.05 },
                    { color: '#E02F44', value: 0.10 }
                  ]
                }
              },
              { id: 'custom.cellOptions', value: { type: 'color-text' } }
            ]
          },
          {
            matcher: { id: 'byName', options: 'Pérdida %' },
            properties: [
              { id: 'unit', value: 'percent' },
              { id: 'decimals', value: 0 },
              {
                id: 'thresholds',
                value: {
                  mode: 'absolute',
                  steps: [
                    { color: '#73BF69', value: 0 },
                    { color: '#FADE2A', value: 1 },
                    { color: '#E02F44', value: 5 }
                  ]
                }
              },
              { id: 'custom.cellOptions', value: { type: 'color-background', mode: 'basic' } }
            ]
          },
          {
            matcher: { id: 'byName', options: 'Sesiones' },
            properties: [
              { id: 'unit', value: 'none' },
              { id: 'custom.cellOptions', value: { type: 'gauge', mode: 'gradient' } },
              { id: 'max', value: 15000 },
              { id: 'min', value: 0 },
              {
                id: 'thresholds',
                value: {
                  mode: 'absolute',
                  steps: [
                    { color: '#73BF69', value: 0 },
                    { color: '#FADE2A', value: 8000 },
                    { color: '#E02F44', value: 12000 }
                  ]
                }
              }
            ]
          }
        ]
      }
    };
    dash.panels.push(pWanTable);

    // Panel 26: Matriz de Servidores & Roles Críticos (w: 12, x: 12, y: 35, h: 9)
    let pSrvTable = {
      id: 26,
      _customTag: 'server-matrix-table',
      title: 'Matriz de Servidores & Roles Críticos (Salud, CPU, RAM y Disco C:)',
      type: 'table',
      gridPos: { h: 9, w: 12, x: 12, y: 35 },
      datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
      targets: [
        {
          refId: 'A',
          schema: 13,
          queryType: '0',
          group: { filter: '/(Windows_Server|Linux servers|AD|Backup_Server|Storage_Server|Virtual machines)/' },
          host: { filter: '/${sede:raw}/' },
          item: { filter: 'ICMP ping' },
          resultFormat: 'time_series',
          datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
          options: { showDisabledItems: false }
        },
        {
          refId: 'B',
          schema: 13,
          queryType: '0',
          group: { filter: '/(Windows_Server|Linux servers|AD|Backup_Server|Storage_Server|Virtual machines)/' },
          host: { filter: '/${sede:raw}/' },
          item: { filter: '/^CPU utilization$/' },
          resultFormat: 'time_series',
          datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
          options: { showDisabledItems: false }
        },
        {
          refId: 'C',
          schema: 13,
          queryType: '0',
          group: { filter: '/(Windows_Server|Linux servers|AD|Backup_Server|Storage_Server|Virtual machines)/' },
          host: { filter: '/${sede:raw}/' },
          item: { filter: 'Memory utilization' },
          resultFormat: 'time_series',
          datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
          options: { showDisabledItems: false }
        },
        {
          refId: 'D',
          schema: 13,
          queryType: '0',
          group: { filter: '/(Windows_Server|Linux servers|AD|Backup_Server|Storage_Server|Virtual machines)/' },
          host: { filter: '/${sede:raw}/' },
          item: { filter: '/FS \\[.*(\\(C:\\)|\\/$)\\].*Space: Used, in %/' },
          resultFormat: 'time_series',
          datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
          options: { showDisabledItems: false }
        }
      ],
      transformations: [
        {
          id: 'reduce',
          options: {
            labelsToFields: true,
            mode: 'seriesToRows',
            reducers: ['lastNotNull']
          }
        },
        {
          id: 'groupingToMatrix',
          options: {
            columnField: 'item',
            rowField: 'host',
            valueField: 'Last *'
          }
        },
        {
          id: 'organize',
          options: {
            excludeByName: {},
            indexByName: {
              'host\\item': 0,
              'ICMP ping': 1,
              'CPU utilization': 2,
              'Memory utilization': 3,
              'FS [(C:)]: Space: Used, in %': 4
            },
            renameByName: {
              'host\\item': 'Servidor',
              'ICMP ping': 'Estado',
              'CPU utilization': 'CPU %',
              'Memory utilization': 'RAM %',
              'FS [(C:)]: Space: Used, in %': 'Disco C: %'
            }
          }
        },
        {
          id: 'sortBy',
          options: {
            fields: {},
            sort: [{ desc: false, field: 'Estado' }]
          }
        }
      ],
      fieldConfig: {
        defaults: {
          custom: {
            align: 'auto',
            cellOptions: { type: 'auto' },
            inspect: false
          }
        },
        overrides: [
          {
            matcher: { id: 'byName', options: 'Estado' },
            properties: [
              {
                id: 'mappings',
                value: [
                  { type: 'value', options: { '1': { text: 'OK', color: '#73BF69', index: 0 } } },
                  { type: 'value', options: { '0': { text: 'DOWN', color: '#E02F44', index: 1 } } }
                ]
              },
              { id: 'custom.cellOptions', value: { type: 'color-background', mode: 'basic' } }
            ]
          },
          {
            matcher: { id: 'byName', options: 'CPU %' },
            properties: [
              { id: 'unit', value: 'percent' },
              { id: 'decimals', value: 1 },
              { id: 'custom.cellOptions', value: { type: 'gauge', mode: 'gradient' } },
              { id: 'max', value: 100 },
              { id: 'min', value: 0 },
              {
                id: 'thresholds',
                value: {
                  mode: 'absolute',
                  steps: [
                    { color: '#73BF69', value: 0 },
                    { color: '#FADE2A', value: 75 },
                    { color: '#E02F44', value: 90 }
                  ]
                }
              }
            ]
          },
          {
            matcher: { id: 'byName', options: 'RAM %' },
            properties: [
              { id: 'unit', value: 'percent' },
              { id: 'decimals', value: 1 },
              { id: 'custom.cellOptions', value: { type: 'gauge', mode: 'gradient' } },
              { id: 'max', value: 100 },
              { id: 'min', value: 0 },
              {
                id: 'thresholds',
                value: {
                  mode: 'absolute',
                  steps: [
                    { color: '#73BF69', value: 0 },
                    { color: '#FADE2A', value: 75 },
                    { color: '#E02F44', value: 90 }
                  ]
                }
              }
            ]
          },
          {
            matcher: { id: 'byName', options: 'Disco C: %' },
            properties: [
              { id: 'unit', value: 'percent' },
              { id: 'decimals', value: 1 },
              { id: 'custom.cellOptions', value: { type: 'gauge', mode: 'gradient' } },
              { id: 'max', value: 100 },
              { id: 'min', value: 0 },
              {
                id: 'thresholds',
                value: {
                  mode: 'absolute',
                  steps: [
                    { color: '#73BF69', value: 0 },
                    { color: '#FADE2A', value: 80 },
                    { color: '#E02F44', value: 90 }
                  ]
                }
              }
            ]
          }
        ]
      }
    };
    dash.panels.push(pSrvTable);

  // 3. Fila 6 (y: 44, h: 8): TENDENCIA COMPARATIVA DE TRÁFICO WAN POR SEDES / PROYECTOS
  let pWanTrend = dash.panels.find(p => p._customTag === 'wan-trend-timeseries');
  if (!pWanTrend) {
    pWanTrend = {
      id: ++maxId,
      _customTag: 'wan-trend-timeseries',
      title: 'Tendencia Comparativa de Tráfico WAN por Sede / Proyecto (Mbps)',
      type: 'timeseries',
      gridPos: { h: 8, w: 24, x: 0, y: 44 },
      datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
      targets: [
        {
          refId: 'A',
          schema: 13,
          queryType: '0',
          group: { filter: 'FortiGate' },
          host: { filter: '/${sede:raw}/' },
          item: { filter: '/Interface (port14|port15|wan1|wan).*: Bits received/' },
          resultFormat: 'time_series',
          datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
          options: { showDisabledItems: false }
        }
      ],
      transformations: [
        {
          id: 'renameByRegex',
          options: {
            regex: '^(?:FTG_)?(.*?)(?:_SNMP)?: Interface (.*?):.*',
            renamePattern: '$1 - $2'
          }
        }
      ],
      fieldConfig: {
        defaults: {
          custom: {
            drawStyle: 'line',
            lineInterpolation: 'smooth',
            lineWidth: 2,
            fillOpacity: 10,
            gradientMode: 'opacity',
            showPoints: 'never',
            spanNulls: true
          },
          unit: 'bps'
        }
      },
      options: {
        legend: {
          calcs: ['mean', 'max', 'lastNotNull'],
          displayMode: 'table',
          placement: 'bottom',
          showLegend: true
        },
        tooltip: { mode: 'multi', sort: 'desc' }
      }
    };
    dash.panels.push(pWanTrend);
  } else {
    pWanTrend.gridPos = { h: 8, w: 24, x: 0, y: 44 };
  }

  // 4. Fila 7 (y: 52, h: 10): FEED DE INCIDENTES ACTIVOS EN TIEMPO REAL
  const p12 = dash.panels.find(p => p.id === 12);
  if (p12) {
    p12.gridPos = { h: 10, w: 24, x: 0, y: 52 };
  }

  // Deploy to Grafana
  console.log(`Sending updated dashboard (version ${dash.version + 1}) to Grafana...`);
  const updateRes = await api('/api/dashboards/db', 'POST', {
    dashboard: dash,
    overwrite: true,
    message: 'NOC Command Center: Integración de matrices cruzadas de telecomunicaciones, servidores y tráfico WAN'
  });

  if (updateRes.status === 200) {
    console.log('Successfully deployed! Version:', updateRes.data.version);
    fs.writeFileSync('./dashboards/noc-zabbix-command-center.json', JSON.stringify(dash, null, 2));
    console.log('Updated dashboards/noc-zabbix-command-center.json');
  } else {
    console.error('Deployment error:', updateRes);
  }
}

run().catch(console.error);
