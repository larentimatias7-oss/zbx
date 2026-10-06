import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const grafanaUrl = 'http://172.27.210.154:3005';
const dsUid = 'efz4nzx8r30g0c';
const DS = { type: 'alexanderzobnin-zabbix-datasource', uid: dsUid };

// Paleta corporativa
const C = {
  disaster: '#E02F44',
  ok: '#73BF69',
  nodata: '#6B7280',
  brand: '#EA580C'
};

const upDownMappings = [
  {
    type: 'value',
    options: {
      '0': { color: C.disaster, index: 0, text: 'DOWN' },
      '1': { color: C.ok, index: 1, text: 'UP' }
    }
  },
  {
    type: 'special',
    options: {
      match: 'null+nan',
      result: { color: C.nodata, index: 2, text: 'SIN DATOS' }
    }
  }
];

// Let's create a test dashboard with 2 variations of FortiGate panel:
// Variation 1: Pure TimeSeries (what worked in V9)
// Variation 2: Table rows with values: true
const testDashboard = {
  id: null,
  uid: 'test-mosaics',
  title: 'Test Mosaics',
  schemaVersion: 40,
  timezone: 'browser',
  time: { from: 'now-15m', to: 'now' },
  panels: [
    {
      id: 1,
      title: 'Var 1: TimeSeries (V9 Style)',
      type: 'stat',
      gridPos: { x: 0, y: 0, w: 12, h: 8 },
      datasource: DS,
      fieldConfig: {
        defaults: {
          color: { mode: 'thresholds' },
          thresholds: { mode: 'absolute', steps: [{ color: C.disaster, value: null }, { color: C.ok, value: 1 }] },
          mappings: upDownMappings,
          noValue: 'SIN DATOS'
        }
      },
      options: {
        reduceOptions: { calcs: ['lastNotNull'], values: false },
        orientation: 'auto',
        textMode: 'name',
        colorMode: 'background',
        graphMode: 'none',
        justifyMode: 'center',
        text: { titleSize: 12 }
      },
      targets: [
        {
          refId: 'A', schema: 12, queryType: '0',
          group: { filter: 'FortiGate' },
          host: { filter: '/.*/' },
          item: { filter: 'ICMP ping' },
          resultFormat: 'time_series'
        }
      ],
      transformations: [
        { id: 'renameByRegex', options: { regex: '(.*):.*', renamePattern: '$1' } },
        { id: 'renameByRegex', options: { regex: 'FTG_(.*)', renamePattern: '$1' } },
        { id: 'renameByRegex', options: { regex: '(.*)_SNMP', renamePattern: '$1' } }
      ]
    },
    {
      id: 2,
      title: 'Var 2: Deduplicated Rows with values: true',
      type: 'stat',
      gridPos: { x: 12, y: 0, w: 12, h: 8 },
      datasource: DS,
      fieldConfig: {
        defaults: {
          color: { mode: 'thresholds' },
          thresholds: { mode: 'absolute', steps: [{ color: C.disaster, value: null }, { color: C.ok, value: 1 }] },
          mappings: upDownMappings,
          noValue: 'SIN DATOS'
        }
      },
      options: {
        reduceOptions: { calcs: ['lastNotNull'], values: true, fields: '/^Estado$/' },
        orientation: 'auto',
        textMode: 'name',
        colorMode: 'background',
        graphMode: 'none',
        justifyMode: 'center',
        text: { titleSize: 12 }
      },
      targets: [
        {
          refId: 'A', schema: 12, queryType: '0',
          group: { filter: 'FortiGate' },
          host: { filter: '/.*/' },
          item: { filter: 'ICMP ping' },
          resultFormat: 'time_series'
        }
      ],
      transformations: [
        { id: 'renameByRegex', options: { regex: '(.*):.*', renamePattern: '$1' } },
        { id: 'renameByRegex', options: { regex: 'FTG_(.*)', renamePattern: '$1' } },
        { id: 'renameByRegex', options: { regex: '(.*)_SNMP', renamePattern: '$1' } },
        { id: 'reduce', options: { mode: 'seriesToRows', reducers: ['lastNotNull'], includeTimeField: false } },
        { id: 'groupBy', options: { fields: { Field: { operation: 'groupby', aggregations: [] }, 'Last *NotNull': { operation: 'aggregate', aggregations: ['min'] } } } },
        { id: 'organize', options: { renameByName: { Field: 'Host', 'Last *NotNull (min)': 'Estado' } } },
        { id: 'sortBy', options: { fields: {}, sort: [{ field: 'Estado', desc: false }] } }
      ]
    }
  ]
};

const payload = JSON.stringify({ dashboard: testDashboard, overwrite: true });

const req = http.request(`${grafanaUrl}/api/dashboards/db`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Content-Length': Buffer.byteLength(payload)
  }
}, res => {
  let b = '';
  res.on('data', d => b += d);
  res.on('end', () => console.log("Deploy test-mosaics:", res.statusCode, b));
});

req.on('error', console.error);
req.write(payload);
req.end();
