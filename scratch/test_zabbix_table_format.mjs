import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function queryGrafana(resultFormat = 'table') {
  const now = Date.now();
  const payload = JSON.stringify({
    from: String(now - 900000),
    to: String(now),
    queries: [{
      refId: 'A',
      schema: 13,
      queryType: '0',
      group: { filter: 'FortiGate' },
      host: { filter: '/.*/' },
      item: { filter: 'ICMP ping' },
      resultFormat: resultFormat,
      datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
    }]
  });

  return new Promise((resolve) => {
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
}

async function run() {
  console.log('Testing resultFormat: table in Zabbix datasource:');
  const res = await queryGrafana('table');
  console.log('Frames:', res.results?.A?.frames?.length);
  if (res.results?.A?.frames) {
    const f = res.results.A.frames[0];
    console.log('Frame schema fields:', f.schema.fields.map(x => x.name));
    console.log('Sample rows:', f.data.values.map(col => col.slice(0, 5)));
  }
}

run().catch(console.error);
