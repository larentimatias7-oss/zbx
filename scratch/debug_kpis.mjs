import http from 'http';
import { execSync } from 'child_process';
import fs from 'fs';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function queryGrafana(query) {
  const now = Date.now();
  const payload = JSON.stringify({
    from: String(now - 900000), // 15m as in user screenshot
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
  const dash = JSON.parse(fs.readFileSync('./dashboards/noc-zabbix-command-center.json', 'utf8'));

  const kpis = [13, 18, 19, 14, 20, 21, 22, 23];
  for (const id of kpis) {
    const p = dash.panels.find(x => x.id === id);
    if (!p) {
      console.log(`Panel ${id} NOT FOUND!`);
      continue;
    }
    console.log(`\n========================================`);
    console.log(`PANEL ${id}: "${p.title}"`);
    console.log(`Group: "${p.targets[0].group.filter}" | Host: "${p.targets[0].host.filter}" | Item: "${p.targets[0].item.filter}"`);
    console.log(`Transformations count: ${p.transformations?.length}`);
    p.transformations?.forEach((t, i) => {
      console.log(`  T${i}: id="${t.id}" options=`, JSON.stringify(t.options));
    });

    const res = await queryGrafana({
      group: p.targets[0].group.filter,
      host: p.targets[0].host.filter.replace(/\$\{sede:raw\}/, '.*'),
      item: p.targets[0].item.filter
    });

    const frames = res.results?.A?.frames || [];
    console.log(`Query returned ${frames.length} frames.`);
    if (frames.length > 0) {
      frames.slice(0, 5).forEach(f => {
        const last = f.data.values[1].filter(v => v !== null).slice(-1)[0];
        console.log(`  Sample: ${f.schema.name} => ${last}`);
      });
    } else {
      console.log(`  NO FRAMES! Error:`, res.results?.A?.error);
    }
  }
}

run().catch(console.error);
