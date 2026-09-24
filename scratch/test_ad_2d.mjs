import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

console.log('Testing AD Services query with 2 days range (now-2d to now)...');
const start = Date.now();

const payload = JSON.stringify({
  queries: [{
    refId: 'Services',
    datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
    queryType: '0',
    group: { filter: 'AD' },
    host: { filter: '/(SRO-DCO01|SRO-DCO02|SSJ-DCO01)/' },
    item: { filter: '/State of service .*(\"NTDS\"|\"DNS\"|\"Kdc\"|\"Netlogon\"|\"DFSR\"|\"W32Time\"|\"ADWS\").*/' },
    resultFormat: 'time_series'
  }],
  from: String(Date.now() - 2 * 86400 * 1000),
  to: String(Date.now())
});

const req = http.request('http://172.27.210.154:3005/api/ds/query', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }
}, res => {
  let b = '';
  res.on('data', d => b += d);
  res.on('end', () => {
    const duration = (Date.now() - start) / 1000;
    console.log(`Response HTTP Status: ${res.statusCode} after ${duration}s`);
    try {
      const json = JSON.parse(b);
      console.log('Frames count:', json.results?.Services?.frames?.length);
      if (json.results?.Services?.error) {
        console.error('Error in query:', json.results.Services.error);
      }
    } catch(e) {
      console.log(b.slice(0, 300));
    }
  });
});

req.write(payload);
req.end();
