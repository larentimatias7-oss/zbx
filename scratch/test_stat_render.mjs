import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const grafanaUrl = 'http://172.27.210.154:3005';
const dsUid = 'efz4nzx8r30g0c';
const DS = { type: 'alexanderzobnin-zabbix-datasource', uid: dsUid };

const C = {
  disaster: '#E02F44',
  ok: '#73BF69',
  nodata: '#6B7280'
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
    options: { match: 'null+nan', result: { color: C.nodata, index: 2, text: 'SIN DATOS' } }
  }
];

// Let's test different stat panel configs on a test dashboard
const testDashboard = {
  id: null,
  uid: 'test-stat-render',
  title: 'Test Stat Render',
  schemaVersion: 40,
  timezone: 'browser',
  time: { from: 'now-15m', to: 'now' },
  panels: [
    // Opt A: Pure Time Series with textMode: 'name' (V9 Style - guaranteed to work)
    {
      id: 1,
      title: 'Opt A: TimeSeries textMode name',
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
    // Opt B: Table rows with textMode: 'value_and_name' or textMode: 'name'
    {
      id: 2,
      title: 'Opt B: Rows with values: true',
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
        reduceOptions: { values: true, fields: '/^Estado$/', calcs: [] },
        orientation: 'auto',
        textMode: 'value',
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
        { id: 'organize', options: { renameByName: { Field: 'Host', 'Last *NotNull': 'Estado' } } }
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
  res.on('end', () => console.log("Deploy status:", res.statusCode));
});

req.on('error', console.error);
req.write(payload);
req.end();
