import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const now = Date.now();
const payload = JSON.stringify({
  from: String(now - 3600000),
  to: String(now),
  queries: [
    {
      refId: 'FailedLogin',
      schema: 12,
      queryType: '0',
      group: { filter: 'AD' },
      host: { filter: 'SRO-DCO01' },
      item: { filter: '/Eventlog.*Failed Login/i' },
      resultFormat: 'time_series',
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
      for (const k of Object.keys(data.results)) {
        const r = data.results[k];
        console.log(`Query ${k}: ${r.frames ? r.frames.length + ' frames' : 'error: ' + r.error}`);
        if (r.frames) {
          r.frames.forEach(f => console.log('  Frame:', f.schema?.name, 'points:', f.data?.values?.[0]?.length));
        }
      }
    } catch (e) {
      console.log('Error:', b);
    }
  });
});
req.write(payload);
req.end();
