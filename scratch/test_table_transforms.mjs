import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function testTableTransforms() {
  const now = Date.now();
  const payload = JSON.stringify({
    from: String(now - 900000),
    to: String(now),
    queries: [
      {
        refId: 'Ping',
        schema: 13,
        queryType: '0',
        group: { filter: 'FortiGate' },
        host: { filter: '/.*/' },
        item: { filter: 'ICMP ping' },
        resultFormat: 'time_series',
        datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
      },
      {
        refId: 'Latency',
        schema: 13,
        queryType: '0',
        group: { filter: 'FortiGate' },
        host: { filter: '/.*/' },
        item: { filter: 'ICMP response time' },
        resultFormat: 'time_series',
        datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
      },
      {
        refId: 'Loss',
        schema: 13,
        queryType: '0',
        group: { filter: 'FortiGate' },
        host: { filter: '/.*/' },
        item: { filter: 'ICMP loss' },
        resultFormat: 'time_series',
        datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
      }
    ]
  });

  const res = await new Promise((resolve) => {
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
      res.on('end', () => resolve(JSON.parse(b)));
    });
    req.write(payload);
    req.end();
  });

  console.log('Results keys:', Object.keys(res.results));
  for (const k of ['Ping', 'Latency', 'Loss']) {
    console.log(`Query ${k}: ${res.results[k]?.frames?.length} frames`);
  }
}

testTableTransforms().catch(console.error);
