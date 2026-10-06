import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function queryGrafana(itemRegex) {
  const now = Date.now();
  const payload = JSON.stringify({
    from: String(now - 900000),
    to: String(now),
    queries: [{
      refId: 'A',
      schema: 13,
      queryType: '0',
      group: { filter: '/(Windows_Server|Linux servers|Virtual machines|Hypervisors|Storage_Server|Backup_Server|Zabbix servers|AD)/' },
      host: { filter: '/.*/' },
      item: { filter: itemRegex },
      resultFormat: 'time_series',
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
  // Test regex: FS with a colon inside brackets, or root /
  // e.g. /FS \[.*(:|\/$)\].*Space: Used, in %/
  const regex = '/FS \\[.*(:\\)|\\/$)\\].*Space: Used, in %/';
  console.log('Testing regex:', regex);
  const res = await queryGrafana(regex);
  const frames = res.results.A.frames || [];
  console.log('Frames matching:', frames.length);
  frames.forEach(f => {
    const vals = f.data.values[1].filter(x => x !== null);
    const last = vals.length > 0 ? vals[vals.length - 1] : null;
    console.log('  ', f.schema.name, '=>', last?.toFixed(1) + '%');
  });
}

run().catch(console.error);
