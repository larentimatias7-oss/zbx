import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function testFullDashboardLoad() {
  const dash = JSON.parse(fs.readFileSync('dashboards/noc-zabbix-command-center.json', 'utf8'));
  const now = Date.now();
  const global24hFrom = String(now - 86400000); // 24 hours!
  const globalTo = String(now);

  console.log(`Simulating parallel load of all ${dash.panels.length} panels with global range 'Last 24 hours'...`);

  const promises = dash.panels.map((p, idx) => {
    if (!p.targets || p.targets.length === 0 || p.type === 'row' || p.type.includes('dynamictext')) {
      return Promise.resolve({ id: p.id, title: p.title, skipped: true });
    }

    // Determine panel time range: override or global
    let from = global24hFrom;
    if (p.timeFrom === '15m') {
      from = String(now - 900000);
    }

    const payload = JSON.stringify({
      from,
      to: globalTo,
      queries: p.targets.map(t => ({
        ...t,
        datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
      }))
    });

    return new Promise((resolve) => {
      const req = http.request({
        hostname: '172.27.210.154',
        port: 3005,
        path: `/api/ds/query?ds_type=alexanderzobnin-zabbix-datasource&requestId=PANEL_${p.id}`,
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      }, res => {
        let b = '';
        res.on('data', c => b += c);
        res.on('end', () => resolve({ id: p.id, title: p.title, statusCode: res.statusCode, timeFrom: p.timeFrom || '24h' }));
      });
      req.on('error', err => resolve({ id: p.id, title: p.title, error: err.message }));
      req.write(payload);
      req.end();
    });
  });

  const results = await Promise.all(promises);
  const active = results.filter(r => !r.skipped);
  const successes = active.filter(r => r.statusCode === 200);
  const failures = active.filter(r => r.statusCode !== 200);

  console.log(`\nResults: ${successes.length} / ${active.length} queries succeeded (HTTP 200). Failures: ${failures.length}`);
  if (failures.length > 0) {
    console.log('Failed panels:', failures);
  } else {
    console.log('ALL PANELS LOADED FLAWLESSLY IN PARALLEL UNDER 24H GLOBAL TIME RANGE!');
  }
}

testFullDashboardLoad().catch(console.error);
