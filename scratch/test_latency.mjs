import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function testLatencyQuery() {
  const now = Date.now();
  const payload = JSON.stringify({
    from: String(now - 3600000),
    to: String(now),
    queries: [
      {
        refId: 'A',
        schema: 12,
        queryType: '0',
        group: { filter: '/(FortiGate|ANTENAS P2P)/' },
        host: { filter: '/.*/' },
        item: { filter: 'ICMP response time' },
        resultFormat: 'time_series',
        datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
      }
    ]
  });

  const res = await new Promise((resolve, reject) => {
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
    req.on('error', reject);
    req.write(payload);
    req.end();
  });

  const frames = res.results.A.frames;
  console.log(`Found ${frames.length} frames for Latency.`);

  const list = frames.map(f => {
    const rawName = f.schema.name;
    const lastVal = f.data.values[1].filter(x => x !== null).slice(-1)[0] || 0;
    const match = rawName.match(/^(.*?):/);
    const cleanName = match ? match[1].replace(/_SNMP$/, '').replace(/^FTG_/, '') : rawName;
    return { rawName, cleanName, lastVal };
  }).sort((a, b) => b.lastVal - a.lastVal);

  console.log('TOP 5 SEDES WAN (Mayor Latencia):');
  list.slice(0, 5).forEach(x => {
    const ms = (x.lastVal * 1000).toFixed(1);
    console.log(`  ${x.cleanName} -> ${ms} ms (${x.lastVal} s)`);
  });
}

testLatencyQuery().catch(console.error);
