import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function testTransformEngine() {
  const now = Date.now();
  // We can query Grafana's /api/ds/query with transformations if Grafana supports it, or check the schema
  const payload = JSON.stringify({
    from: String(now - 900000),
    to: String(now),
    queries: [{
      refId: 'A',
      schema: 13,
      queryType: '0',
      group: { filter: '/(Windows_Server|Linux servers|Virtual machines|Hypervisors|Storage_Server|Backup_Server|Zabbix servers|AD)/' },
      host: { filter: '/.*/' },
      item: { filter: '/^CPU utilization$/' },
      resultFormat: 'time_series',
      datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
    }]
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

  const frames = res.results.A.frames;
  console.log('Query returned', frames.length, 'frames');
  // First 10 frames in order returned:
  frames.slice(0, 10).forEach((f, i) => {
    const vals = f.data.values[1].filter(x => x !== null);
    const last = vals.length > 0 ? vals[vals.length - 1] : null;
    console.log(`  Frame #${i+1}: ${f.schema.name} => ${last}`);
  });
}

testTransformEngine().catch(console.error);
