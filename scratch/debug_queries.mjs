import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function testQuery(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request('http://172.27.210.154:3005/api/ds/query', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(b) });
        } catch(e) {
          resolve({ status: res.statusCode, raw: b });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const res = await testQuery({
    queries: [
      {
        refId: 'A',
        datasource: { uid: 'efz4nzx8r30g0c', type: 'alexanderzobnin-zabbix-datasource' },
        schema: 12,
        queryType: '0',
        group: { filter: '/.*/' },
        host: { filter: 'SRO-SQL01' },
        item: { filter: '/CPU utilization/i' },
        options: { showDisabledItems: false }
      }
    ],
    from: 'now-30d',
    to: 'now'
  });
  console.log('Status Panel 41 (CPU 30d):', res.status);
  const frames = res.body?.results?.A?.frames || [];
  console.log('Frames:', frames.length);
  if (frames[0]) {
    console.log('Points count:', frames[0].data.values[0].length);
  }
}

main().catch(console.error);
