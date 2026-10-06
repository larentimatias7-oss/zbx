import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const GRAFANA_HOST = '172.27.210.154';
const GRAFANA_PORT = 3005;
const DASHBOARD_UID = 'noc-zabbix-command-center';

async function grafanaRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = http.request({
      hostname: GRAFANA_HOST,
      port: GRAFANA_PORT,
      path: path,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + token,
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(b));
        } catch (e) {
          resolve(b);
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  console.log(`Fetching dashboard ${DASHBOARD_UID}...`);
  const getRes = await grafanaRequest('GET', `/api/dashboards/uid/${DASHBOARD_UID}`);
  if (!getRes || !getRes.dashboard) {
    throw new Error('Failed to fetch dashboard: ' + JSON.stringify(getRes));
  }

  const dash = getRes.dashboard;

  // 1. Configure WAN Table Panel
  let pWan = dash.panels.find(p => p._customTag === 'wan-matrix-table' || p.id === 25 || p.title?.includes('Matriz WAN'));
  if (!pWan) {
    console.log('WAN panel not found by tag/id/title, creating it...');
    pWan = { id: 25, _customTag: 'wan-matrix-table' };
    dash.panels.push(pWan);
  }

  pWan._customTag = 'wan-matrix-table';
  pWan.title = 'Matriz WAN de Sedes & Enlaces Remotos (Estado, Latencia, Pérdida y Sesiones)';
  pWan.type = 'table';
  pWan.gridPos = { h: 9, w: 12, x: 0, y: 35 };
  pWan.datasource = { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' };
  pWan.targets = [
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
  ];

  pWan.transformations = [
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
        sort: [
          {
            desc: false,
            field: 'Disponibilidad'
          }
        ]
      }
    }
  ];

  pWan.fieldConfig = {
    defaults: {
      custom: {
        align: 'auto',
        cellOptions: { type: 'auto' },
        inspect: false
      }
    },
    overrides: [
      {
        matcher: { id: 'byName', options: 'Sede / Obra' },
        properties: [
          {
            id: 'mappings',
            value: [
              {
                type: 'regex',
                options: {
                  pattern: '^FTG_(.*)_SNMP$',
                  result: { text: '$1' }
                }
              }
            ]
          }
        ]
      },
      {
        matcher: { id: 'byName', options: 'Disponibilidad' },
        properties: [
          {
            id: 'mappings',
            value: [
              {
                type: 'value',
                options: {
                  '1': { color: '#73BF69', index: 0, text: 'ONLINE' },
                  '0': { color: '#E02F44', index: 1, text: 'OFFLINE' }
                }
              }
            ]
          },
          {
            id: 'custom.cellOptions',
            value: { mode: 'basic', type: 'color-background' }
          }
        ]
      },
      {
        matcher: { id: 'byName', options: 'Latencia' },
        properties: [
          { id: 'unit', value: 's' },
          { id: 'decimals', value: 2 },
          {
            id: 'thresholds',
            value: {
              mode: 'absolute',
              steps: [
                { color: '#73BF69', value: 0 },
                { color: '#FADE2A', value: 0.08 },
                { color: '#E02F44', value: 0.15 }
              ]
            }
          },
          {
            id: 'custom.cellOptions',
            value: { mode: 'gradient', type: 'color-text' }
          }
        ]
      },
      {
        matcher: { id: 'byName', options: 'Pérdida %' },
        properties: [
          { id: 'unit', value: 'percent' },
          { id: 'decimals', value: 1 },
          {
            id: 'thresholds',
            value: {
              mode: 'absolute',
              steps: [
                { color: '#73BF69', value: 0 },
                { color: '#FADE2A', value: 2 },
                { color: '#E02F44', value: 10 }
              ]
            }
          },
          {
            id: 'custom.cellOptions',
            value: { mode: 'basic', type: 'color-text' }
          }
        ]
      },
      {
        matcher: { id: 'byName', options: 'Sesiones Activas' },
        properties: [
          { id: 'unit', value: 'locale' },
          { id: 'decimals', value: 0 },
          {
            id: 'thresholds',
            value: {
              mode: 'absolute',
              steps: [
                { color: '#73BF69', value: 0 },
                { color: '#FADE2A', value: 8000 },
                { color: '#E02F44', value: 20000 }
              ]
            }
          },
          {
            id: 'custom.cellOptions',
            value: { mode: 'gradient', type: 'gauge' }
          },
          { id: 'min', value: 0 },
          { id: 'max', value: 25000 }
        ]
      }
    ]
  };

  // 2. Configure Server Table Panel
  let pSrv = dash.panels.find(p => p._customTag === 'server-matrix-table' || p.id === 26 || p.title?.includes('Matriz de Servidores'));
  if (!pSrv) {
    console.log('Server panel not found by tag/id/title, creating it...');
    pSrv = { id: 26, _customTag: 'server-matrix-table' };
    dash.panels.push(pSrv);
  }

  pSrv._customTag = 'server-matrix-table';
  pSrv.title = 'Matriz de Servidores & Roles Críticos (Salud, CPU, RAM y Disco C:)';
  pSrv.type = 'table';
  pSrv.gridPos = { h: 9, w: 12, x: 12, y: 35 };
  pSrv.datasource = { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' };
  pSrv.targets = [
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
      item: { filter: 'FS [(C:)]: Space: Used, in %' },
      resultFormat: 'time_series',
      datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
      options: { showDisabledItems: false }
    }
  ];

  pSrv.transformations = [
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
        sort: [
          {
            desc: false,
            field: 'Estado'
          }
        ]
      }
    }
  ];

  pSrv.fieldConfig = {
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
              {
                type: 'value',
                options: {
                  '1': { color: '#73BF69', index: 0, text: 'OK' },
                  '0': { color: '#E02F44', index: 1, text: 'DOWN' }
                }
              }
            ]
          },
          {
            id: 'custom.cellOptions',
            value: { mode: 'basic', type: 'color-background' }
          }
        ]
      },
      {
        matcher: { id: 'byName', options: 'CPU %' },
        properties: [
          { id: 'unit', value: 'percent' },
          { id: 'decimals', value: 1 },
          {
            id: 'custom.cellOptions',
            value: { mode: 'gradient', type: 'gauge' }
          },
          { id: 'min', value: 0 },
          { id: 'max', value: 100 },
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
          {
            id: 'custom.cellOptions',
            value: { mode: 'gradient', type: 'gauge' }
          },
          { id: 'min', value: 0 },
          { id: 'max', value: 100 },
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
          {
            id: 'custom.cellOptions',
            value: { mode: 'gradient', type: 'gauge' }
          },
          { id: 'min', value: 0 },
          { id: 'max', value: 100 },
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
  };

  // 3. Save to Grafana
  console.log('Pushing updated dashboard to Grafana...');
  const saveRes = await grafanaRequest('POST', '/api/dashboards/db', {
    dashboard: dash,
    overwrite: true
  });
  console.log('Save result:', saveRes);

  // 4. Save local copy
  const localFile = 'dashboards/noc-zabbix-command-center.json';
  fs.writeFileSync(localFile, JSON.stringify(dash, null, 2), 'utf8');
  console.log(`Saved local file ${localFile}`);
}

main().catch(console.error);
