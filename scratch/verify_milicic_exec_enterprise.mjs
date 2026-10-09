import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function testQuery(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request('http://172.27.210.154:3005/api/ds/query', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(b) });
        } catch(e) {
          resolve({ status: res.statusCode, raw: b });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function getDashboard() {
  return new Promise((resolve, reject) => {
    http.get('http://172.27.210.154:3005/api/dashboards/uid/milicic-exec-monthly', {
      headers: { 'Authorization': 'Bearer ' + token }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(JSON.parse(b)));
    }).on('error', reject);
  });
}

async function main() {
  console.log('--- VERIFICACIÓN INTEGRAL DE PANELES EN GRAFANA ---');
  const d = await getDashboard();
  console.log(`Dashboard: "${d.dashboard.title}" (UID: ${d.dashboard.uid})`);
  const panels = d.dashboard.panels.filter(p => p.type !== 'row');

  for (const p of panels) {
    if (!p.targets || p.targets.length === 0) {
      console.log(`[PASS] Panel ${p.id} (${p.title || 'Hero'}): Sin targets (render local)`);
      continue;
    }
    const from = p.timeFrom ? `now-${p.timeFrom}` : 'now-30d';
    const res = await testQuery({ queries: p.targets, from, to: 'now' });
    const hasFrames = Object.values(res.body?.results || {}).some(r => r.frames && r.frames.length > 0);
    const hasError = Object.values(res.body?.results || {}).some(r => r.error);
    
    if (res.status === 200 && !hasError && hasFrames) {
      console.log(`[PASS ✓] Panel ${p.id} (${p.title || 'Hero'}): HTTP ${res.status} | Data frames OK`);
    } else {
      console.log(`[ALERT ⚠] Panel ${p.id} (${p.title}): Status ${res.status} | hasFrames: ${hasFrames} | hasError: ${hasError}`);
      if (hasError) console.log('   Error details:', JSON.stringify(res.body).slice(0, 200));
    }
  }
}

main().catch(console.error);
