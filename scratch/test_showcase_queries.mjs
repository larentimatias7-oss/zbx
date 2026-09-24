import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function run() {
  const dbRes = await new Promise(resolve => {
    http.get('http://172.27.210.154:3005/api/dashboards/uid/milicic-plugins-showcase', {
      headers: { 'Authorization': 'Bearer ' + token }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(JSON.parse(b)));
    });
  });

  const now = Date.now();
  for (const p of dbRes.dashboard.panels) {
    if (!p.targets) continue;
    const queryPayload = {
      from: String(now - 3600*1000),
      to: String(now),
      queries: p.targets.map(t => ({ ...t, datasource: p.datasource }))
    };
    const data = JSON.stringify(queryPayload);
    const res = await new Promise(resolve => {
      const req = http.request({
        hostname: '172.27.210.154', port: 3005, path: '/api/ds/query', method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
      }, r => {
        let b = '';
        r.on('data', c => b += c);
        r.on('end', () => resolve({ status: r.statusCode, body: JSON.parse(b) }));
      });
      req.write(data); req.end();
    });
    const results = res.body?.results || {};
    let frames = 0;
    for (const k of Object.keys(results)) {
      frames += results[k]?.frames?.length || 0;
    }
    console.log(`Panel [${p.id}] ${p.title} (${p.type}) -> Frames: ${frames}`);
  }
}
run();
