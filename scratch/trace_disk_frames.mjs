import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function queryGrafana(query) {
  const now = Date.now();
  const payload = JSON.stringify({
    from: String(now - 900000),
    to: String(now),
    queries: [{
      refId: 'A',
      schema: 13,
      queryType: '0',
      group: { filter: query.group },
      host: { filter: query.host || '.*' },
      item: { filter: query.item },
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
  const res = await queryGrafana({
    group: '/(Windows_Server|Linux servers|Virtual machines|Hypervisors|Storage_Server|Backup_Server|Zabbix servers|AD)/',
    host: '.*',
    item: '/FS \\[.*]: Space: Used, in %/'
  });

  const frames = res.results.A.frames;
  console.log(`Total disk frames: ${frames.length}`);

  // Let's trace each frame and its values
  const list = [];
  frames.forEach(f => {
    const name = f.schema.name;
    const vals = f.data.values[1].filter(x => x !== null);
    const last = vals.length > 0 ? vals[vals.length - 1] : null;
    list.push({ name, last });
  });

  console.log('--- ALL FRAMES AND LAST VALUE ---');
  list.forEach(x => console.log(`  ${x.name} => ${x.last}`));

  // Why did Zabbix server appear first?
  // Let's check rename regex:
  const regex = new RegExp('^(.*?):\\s*FS\\s*\\[(.*?)\\]:.*');
  list.forEach(x => {
    const m = x.name.match(regex);
    if (!m) {
      console.log('NO MATCH FOR REGEX:', x.name);
    }
  });
}

run().catch(console.error);
