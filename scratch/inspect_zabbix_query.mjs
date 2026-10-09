import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  try {
    token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
  } catch (e) {}
}

const now = Date.now();
const reqData = {
  from: String(now - 3600000),
  to: String(now),
  queries: [
    {
      refId: 'A',
      datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
      queryType: '5',
      schema: 12,
      group: { filter: '/.*/' },
      host: { filter: '/.*/' },
      options: {
        acknowledged: 2,
        hostsInMaintenance: true,
        limit: 5,
        minSeverity: 0,
        severities: [0, 1, 2, 3, 4, 5],
        sortProblems: 'priority'
      },
      showProblems: 'problems'
    }
  ]
};

const payload = JSON.stringify(reqData);
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
      const parsed = JSON.parse(b);
      console.log('Keys in results:', Object.keys(parsed.results || {}));
      console.log('Result A:', JSON.stringify(parsed.results?.A).slice(0, 1000));
    } catch (e) {
      console.error('Parse error:', e, b.slice(0, 500));
    }
  });
});
req.write(payload);
req.end();
