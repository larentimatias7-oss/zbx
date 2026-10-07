import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

// 7 days ago until now: 2026-10-07
const now = Date.now();
const from = String(now - 14 * 24 * 3600 * 1000); // 14 days
const to = String(now);

const payload = JSON.stringify({
  from,
  to,
  queries: [
    {
      refId: 'UserLocked',
      schema: 12,
      queryType: '0',
      group: { filter: 'AD' },
      host: { filter: 'SRO-DCO01' },
      item: { filter: 'User locked Name' },
      resultFormat: 'table',
      datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
    },
    {
      refId: 'PcLocked',
      schema: 12,
      queryType: '0',
      group: { filter: 'AD' },
      host: { filter: 'SRO-DCO01' },
      item: { filter: 'User Locked PC' },
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
      for (const [k, v] of Object.entries(data.results)) {
        console.log(`\nResult for ${k}: frames = ${v.frames ? v.frames.length : 0}`);
        if (v.frames && v.frames.length > 0) {
          console.log(`Schema fields:`, v.frames[0].schema.fields.map(f => f.name));
          console.log(`Values sample:`, v.frames[0].data.values);
        }
      }
    } catch (e) {
      console.log('Error:', b);
    }
  });
});
req.write(payload);
req.end();
