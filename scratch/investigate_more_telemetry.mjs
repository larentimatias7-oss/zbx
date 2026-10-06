import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function queryGrafana(queries) {
  const now = Date.now();
  const payload = JSON.stringify({
    from: String(now - 900000),
    to: String(now),
    queries: queries.map((q, i) => ({
      refId: q.refId || String.fromCharCode(65 + i),
      schema: 13,
      queryType: '0',
      group: { filter: q.group || '/.*/' },
      host: { filter: q.host || '/.*/' },
      item: { filter: q.item },
      resultFormat: 'time_series',
      datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
    }))
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
  console.log('--- 1. Hardware Environment & Sensors (Temperatures / PSU / Fans) ---');
  const sensors = await queryGrafana([
    {
      group: '/(FortiGate|switch|Storage_Server|UPS)/',
      item: '/(Temperature|Sensor TMP|Ambient temperature|PSU|FAN)/'
    }
  ]);
  console.log('Sensor frames:', sensors.results.A.frames?.length);
  sensors.results.A.frames?.slice(0, 10).forEach(f => {
    const last = f.data.values[1].filter(x => x !== null).slice(-1)[0];
    console.log('  ', f.schema.name, '=>', last);
  });

  console.log('\n--- 2. Switch Uplinks Discards & Drops ---');
  const discards = await queryGrafana([
    {
      group: '/switch/',
      item: '/(discarded|packets with errors|CRC)/'
    }
  ]);
  console.log('Discard frames count:', discards.results.A.frames?.length);
  const nonZeroDiscards = [];
  discards.results.A.frames?.forEach(f => {
    const last = f.data.values[1].filter(x => x !== null).slice(-1)[0];
    if (last > 0) nonZeroDiscards.push({ name: f.schema.name, last });
  });
  console.log('Non-zero discard interfaces:', nonZeroDiscards.length);
  nonZeroDiscards.slice(0, 10).forEach(x => console.log('  ', x.name, '=>', x.last));

  console.log('\n--- 3. Veeam Backup Status ---');
  const bkp = await queryGrafana([
    {
      host: '/(BKP|backup)/',
      item: '/(backup|job|state|status|result|last)/'
    }
  ]);
  console.log('Backup frames count:', bkp.results.A.frames?.length);
  bkp.results.A.frames?.slice(0, 10).forEach(f => {
    const last = f.data.values[1].filter(x => x !== null).slice(-1)[0];
    console.log('  ', f.schema.name, '=>', last);
  });
}

run().catch(console.error);
