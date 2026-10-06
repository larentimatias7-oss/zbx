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

async function checkCandidates() {
  console.log('Testing candidates for new KPIs...');
  const res = await queryGrafana([
    // Q1: WAN Latency
    {
      refId: 'A',
      group: '/(FortiGate|ANTENAS P2P)/',
      host: '/.*/',
      item: 'ICMP response time'
    },
    // Q2: WAN Packet Loss
    {
      refId: 'B',
      group: '/(FortiGate|ANTENAS P2P)/',
      host: '/.*/',
      item: 'ICMP loss'
    },
    // Q3: Storage / Disk Pool Space Used % (SAN MSA)
    {
      refId: 'C',
      group: '/(Storage_Server|Storage)/',
      host: '/.*/',
      item: '/Pool.*Space.*%/'
    },
    // Q4: Top WAN Interfaces Traffic (Bits in)
    {
      refId: 'D',
      group: '/FortiGate/',
      host: '/.*/',
      item: '/Interface (port14|port15|wan|internet|claro|tasa|rosario|telecom).*: Bits received/'
    },
    // Q5: Storage SAN IOPS or Health
    {
      refId: 'E',
      group: '/(Storage_Server|Storage)/',
      host: '/.*/',
      item: '/IOPS/'
    }
  ]);

  for (const [k, v] of Object.entries(res.results || {})) {
    console.log(`\n=== QUERY ${k} ===`);
    console.log(`Frames: ${v.frames ? v.frames.length : 0}`);
    if (v.frames) {
      v.frames.slice(0, 5).forEach(f => {
        const lastVal = f.data?.values?.[1]?.filter(x => x !== null).slice(-1)[0];
        console.log(`  ${f.schema?.name} => ${lastVal}`);
      });
    }
  }
}

checkCandidates().catch(console.error);
