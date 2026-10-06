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
  // Test disk regexes
  const res = await queryGrafana([
    {
      group: '/(Windows_Server|Linux servers|AD|Backup_Server|Storage_Server|Virtual machines)/',
      host: '/.*/',
      item: '/FS \\[.*]: Space: Used, in %/'
    },
    {
      group: '/FortiGate/',
      host: '/.*/',
      item: '/(Bits received|Bits sent|Traffic in|Traffic out)/'
    },
    {
      group: '/FortiGate/',
      host: '/.*/',
      item: '/.*utilization.*/'
    }
  ]);

  console.log('--- DISK CANDIDATES ---');
  const diskFrames = res.results.A?.frames || [];
  console.log(`Total disk frames: ${diskFrames.length}`);
  diskFrames.forEach(f => {
    const val = f.data?.values?.[1]?.filter(x => x !== null).slice(-1)[0];
    console.log(`  ${f.schema?.name} => ${val?.toFixed?.(1)}%`);
  });

  console.log('--- FORTIGATE TRAFFIC / UTILIZATION ---');
  const ftgFrames = res.results.B?.frames || [];
  console.log(`Total FTG traffic frames: ${ftgFrames.length}`);
  ftgFrames.slice(0, 10).forEach(f => {
    const val = f.data?.values?.[1]?.filter(x => x !== null).slice(-1)[0];
    console.log(`  ${f.schema?.name} => ${val}`);
  });
  
  const utilFrames = res.results.C?.frames || [];
  console.log(`Total FTG util frames: ${utilFrames.length}`);
  utilFrames.slice(0, 10).forEach(f => {
    const val = f.data?.values?.[1]?.filter(x => x !== null).slice(-1)[0];
    console.log(`  ${f.schema?.name} => ${val}`);
  });
}

run().catch(console.error);
