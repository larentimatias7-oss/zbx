import http from 'http';
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

async function testTableCreation() {
  const panel = {
    id: 1,
    title: 'Matriz WAN de Sedes Remotas',
    type: 'table',
    gridPos: { h: 10, w: 24, x: 0, y: 0 },
    datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
    targets: [
      {
        refId: 'A',
        schema: 13,
        queryType: '0',
        group: { filter: 'FortiGate' },
        host: { filter: '/.*/' },
        item: { filter: 'ICMP ping' },
        resultFormat: 'time_series',
        datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
      },
      {
        refId: 'B',
        schema: 13,
        queryType: '0',
        group: { filter: 'FortiGate' },
        host: { filter: '/.*/' },
        item: { filter: 'ICMP response time' },
        resultFormat: 'time_series',
        datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
      },
      {
        refId: 'C',
        schema: 13,
        queryType: '0',
        group: { filter: 'FortiGate' },
        host: { filter: '/.*/' },
        item: { filter: 'ICMP loss' },
        resultFormat: 'time_series',
        datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
      },
      {
        refId: 'D',
        schema: 13,
        queryType: '0',
        group: { filter: 'FortiGate' },
        host: { filter: '/.*/' },
        item: { filter: '/IPv4 Active sessions/' },
        resultFormat: 'time_series',
        datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
      }
    ],
    transformations: [
      {
        id: 'renameByRegex',
        options: {
          regex: '^(?:FTG_|)(.*?)(?:_SNMP|):.*',
          renamePattern: '$1'
        }
      },
      {
        id: 'reduce',
        options: {
          includeTimeField: false,
          mode: 'seriesToRows',
          reducers: ['lastNotNull']
        }
      },
      {
        id: 'joinByField',
        options: {
          byField: 'Field',
          mode: 'outerTabular'
        }
      },
      {
        id: 'organize',
        options: {
          excludeByName: {},
          indexByName: {},
          renameByName: {
            Field: 'Sede / Obra',
            'Last * (not null)': 'Estado',
            'Last * (not null) 1': 'Latencia',
            'Last * (not null) 2': 'Pérdida %',
            'Last * (not null) 3': 'Sesiones'
          }
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
            { id: 'unit', value: 'none' },
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

  const testDash = {
    dashboard: {
      id: null,
      uid: 'test-wan-table-scratch',
      title: 'TEST WAN TABLE',
      panels: [panel],
      schemaVersion: 39,
      version: 1
    },
    overwrite: true
  };

  const createRes = await api('/api/dashboards/db', 'POST', testDash);
  console.log('Test dashboard creation:', createRes);
}

testTableCreation().catch(console.error);
