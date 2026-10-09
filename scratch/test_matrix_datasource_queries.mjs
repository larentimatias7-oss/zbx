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
  console.log('--- TEST 1: Query Type 0 (Metrics) ---');
  const q0 = await testQuery({
    queries: [{
      refId: 'A',
      datasource: { uid: 'efz4nzx8r30g0c' },
      queryType: '0',
      group: { filter: '/.*/' },
      host: { filter: '/.*/' },
      item: { filter: '/ICMP ping/' },
      resultFormat: 'table'
    }],
    from: 'now-15m',
    to: 'now'
  });
  console.log('Status Q0:', q0.status);
  const frames0 = q0.body?.results?.A?.frames || [];
  console.log('Frames count:', frames0.length);
  if (frames0[0]) {
    console.log('Fields:', frames0[0].schema.fields.map(f => f.name));
    console.log('Rows count:', frames0[0].data.values[0]?.length);
  }

  console.log('\n--- TEST 2: Query Type 2 (Text metrics) ---');
  const q2 = await testQuery({
    queries: [{
      refId: 'A',
      datasource: { uid: 'efz4nzx8r30g0c' },
      queryType: '2',
      group: { filter: '/.*/' },
      host: { filter: '/.*/' },
      item: { filter: '/system.uname|agent.version|status/' },
      resultFormat: 'table'
    }],
    from: 'now-1h',
    to: 'now'
  });
  console.log('Status Q2:', q2.status);
  const frames2 = q2.body?.results?.A?.frames || [];
  console.log('Frames count Q2:', frames2.length);
}

main().catch(console.error);
