import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const payload = JSON.stringify({
  queries: [{
    refId: 'A',
    datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
    schema: 12,
    queryType: '0',
    group: { filter: 'FortiGate' },
    host: { filter: '/.*/' },
    item: { filter: 'ICMP ping' },
    resultFormat: 'time_series'
  }],
  from: 'now-15m',
  to: 'now'
});

const req = http.request('http://172.27.210.154:3005/api/ds/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Content-Length': Buffer.byteLength(payload)
  }
}, res => {
  let b = '';
  res.on('data', d => b += d);
  res.on('end', () => {
    const json = JSON.parse(b);
    const frames = json.results?.A?.frames || [];
    console.log(`Received ${frames.length} frames.`);
    frames.slice(0, 3).forEach(f => {
      console.log('Frame schema name:', f.schema?.name, 'fields:', f.schema?.fields?.map(x => x.name));
    });
  });
});

req.on('error', console.error);
req.write(payload);
req.end();
