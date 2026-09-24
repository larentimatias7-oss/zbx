import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const now = Date.now();
const payload = JSON.stringify({
  from: String(now - 30 * 24 * 3600000),
  to: String(now),
  queries: [
    {
      refId: 'QT_0_Table',
      schema: 12,
      queryType: '0',
      group: { filter: 'AD' },
      host: { filter: 'SRO-DCO01' },
      item: { filter: 'Eventlog by Zabbix agent: Failed Login' },
      resultFormat: 'table',
      datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
    },
    {
      refId: 'QT_2_Logs',
      schema: 12,
      queryType: '2',
      group: { filter: 'AD' },
      host: { filter: 'SRO-DCO01' },
      item: { filter: 'Eventlog by Zabbix agent: Failed Login' },
      resultFormat: 'table',
      datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
    },
    {
      refId: 'QT_4_ItemValue',
      schema: 12,
      queryType: '4',
      group: { filter: 'AD' },
      host: { filter: 'SRO-DCO01' },
      item: { filter: 'Eventlog by Zabbix agent: Failed Login' },
      resultFormat: 'table',
      datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
    }
  ]
});

const req = http.request({
  hostname: '172.27.210.154',
  port: 3005,
  path: '/api/ds/query',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    try {
      const data = JSON.parse(b);
      console.log('STATUS:', res.statusCode);
      console.log('FULL DATA:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('Error parsing response:', b);
    }
  });
});
req.write(payload);
req.end();
