import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function testOne(panelId, fromRange = 'now-1h') {
  const dashRes = await new Promise(r => {
    http.get('http://172.27.210.154:3005/api/dashboards/uid/milicic-exec-monthly', {
      headers: { Authorization: 'Bearer ' + token }
    }, res => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => r(JSON.parse(b)));
    });
  });

  const p = dashRes.dashboard.panels.find(p => p.id === panelId);
  console.log(`\nTesting Panel ${panelId}: "${p.title}" (Range: ${fromRange})`);

  const payload = JSON.stringify({
    queries: p.targets,
    from: fromRange,
    to: 'now'
  });

  const res = await new Promise(r => {
    const req = http.request('http://172.27.210.154:3005/api/ds/query', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => r({ status: res.statusCode, body: b }));
    });
    req.write(payload);
    req.end();
  });

  console.log(`Status: ${res.status}`);
  const hasFrames = res.body.includes('"frames":[{');
  console.log(`Frames returned: ${hasFrames}`);
}

async function main() {
  await testOne(12, 'now-24h');
  await testOne(21, 'now-7d');
  await testOne(32, 'now-24h');
}

main().catch(console.error);
