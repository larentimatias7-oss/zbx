import http from 'http';
import { execSync } from 'child_process';
import fs from 'fs';

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
  const dash = JSON.parse(fs.readFileSync('./dashboards/noc-zabbix-command-center.json', 'utf8'));
  const pWan = dash.panels.find(p => p._customTag === 'wan-matrix-table');
  const pSrv = dash.panels.find(p => p._customTag === 'server-matrix-table');

  console.log('--- Testing WAN Matrix targets ---');
  const resWan = await queryGrafana(pWan.targets.map(t => ({
    refId: t.refId,
    group: t.group.filter,
    host: t.host.filter.replace(/\$\{sede:raw\}/, '.*'),
    item: t.item.filter
  })));
  for (const k of Object.keys(resWan.results)) {
    console.log(`Target ${k}: ${resWan.results[k].frames?.length} frames`);
  }

  console.log('\n--- Testing Server Matrix targets ---');
  const resSrv = await queryGrafana(pSrv.targets.map(t => ({
    refId: t.refId,
    group: t.group.filter,
    host: t.host.filter.replace(/\$\{sede:raw\}/, '.*'),
    item: t.item.filter
  })));
  for (const k of Object.keys(resSrv.results)) {
    console.log(`Target ${k}: ${resSrv.results[k].frames?.length} frames`);
  }
}

run().catch(console.error);
