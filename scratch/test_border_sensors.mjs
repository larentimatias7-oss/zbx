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
  const res = await queryGrafana([
    {
      group: 'FortiGate',
      host: '/milicic_border1/',
      item: '/(PSU|FAN|TMP|Alarm status)/'
    }
  ]);

  console.log('Border 1 sensors count:', res.results.A.frames?.length);
  res.results.A.frames?.forEach(f => {
    const last = f.data.values[1].filter(x => x !== null).slice(-1)[0];
    console.log('  ', f.schema.name, '=>', last);
  });
}

run().catch(console.error);
