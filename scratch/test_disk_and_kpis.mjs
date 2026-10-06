import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function queryGrafana(queries) {
  const now = Date.now();
  const payload = JSON.stringify({
    from: String(now - 3600000),
    to: String(now),
    queries: queries.map((q, i) => ({
      refId: String.fromCharCode(65 + i),
      schema: 12,
      queryType: '0',
      group: { filter: q.group || '/.*/' },
      host: { filter: q.host || '/.*/' },
      item: { filter: q.item },
      resultFormat: 'time_series',
      datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
    }))
  });

  return new Promise((resolve, reject) => {
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
          resolve(JSON.parse(b));
        } catch (e) {
          reject(new Error(b));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('Testing Queries...');

  // Test 1: Disk Space Used in %
  const resDisks = await queryGrafana([
    {
      group: '/(Windows_Server|Linux servers|AD|Backup_Server|Zabbix servers)/',
      host: '/.*/',
      item: '/FS \\[.*]: Space: Used, in %/'
    },
    {
      group: '/(Windows_Server|Linux servers|AD|Backup_Server|Zabbix servers)/',
      host: '/.*/',
      item: '/FS \\[(C:|\\/)].*: Space: Used, in %/'
    },
    {
      group: '/Storage_Server/',
      host: '/.*/',
      item: '/.*Space.*%/'
    }
  ]);

  console.log('--- TEST 1: Disks ---');
  for (const [k, v] of Object.entries(resDisks.results || {})) {
    console.log(`Query ${k}: ${v.frames ? v.frames.length : 0} series`);
    if (v.frames) {
      v.frames.slice(0, 8).forEach(f => {
        const lastVal = f.data?.values?.[1]?.filter(x => x !== null).slice(-1)[0];
        console.log(`  ${f.schema?.name} => ${lastVal}`);
      });
    }
  }

  // Test 2: Latencia ICMP / Ping RTT
  const resLatency = await queryGrafana([
    {
      group: '/(FortiGate|switch|ANTENAS P2P)/',
      host: '/.*/',
      item: 'ICMP response time'
    },
    {
      group: '/(FortiGate|switch|ANTENAS P2P)/',
      host: '/.*/',
      item: 'ICMP loss'
    }
  ]);

  console.log('--- TEST 2: WAN / Latency ---');
  for (const [k, v] of Object.entries(resLatency.results || {})) {
    console.log(`Query ${k}: ${v.frames ? v.frames.length : 0} series`);
    if (v.frames) {
      v.frames.slice(0, 8).forEach(f => {
        const lastVal = f.data?.values?.[1]?.filter(x => x !== null).slice(-1)[0];
        console.log(`  ${f.schema?.name} => ${lastVal}`);
      });
    }
  }
}

run().catch(console.error);
