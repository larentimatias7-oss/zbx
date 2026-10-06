import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function testWithLastStar() {
  const dash = {
    dashboard: {
      id: null,
      uid: 'test-matrix-table-dev',
      title: 'TEST MATRIX DEV',
      tags: ['test'],
      timezone: 'browser',
      schemaVersion: 39,
      version: 1,
      panels: [
        {
          id: 1,
          title: 'WAN Matrix Test',
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
            }
          ]
        }
      ]
    },
    overwrite: true
  };

  const payload = JSON.stringify(dash);
  const res = await new Promise((resolve) => {
    const req = http.request({
      hostname: '172.27.210.154',
      port: 3005,
      path: '/api/dashboards/db',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(JSON.parse(b)));
    });
    req.write(payload);
    req.end();
  });
  console.log('Result deploy test:', res);
}

testWithLastStar().catch(console.error);
