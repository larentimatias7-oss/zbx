import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken || grafanaToken.length < 10) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function verifyAll() {
  const dashRes = await new Promise(resolve => {
    http.get({
      hostname: '172.27.210.154',
      port: 3005,
      path: '/api/dashboards/uid/milicic-canvas-campus-sro',
      headers: { 'Authorization': 'Bearer ' + grafanaToken }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
  });

  console.log('Dashboard Title:', dashRes.dashboard.title);
  console.log('Total Panels:', dashRes.dashboard.panels.length);

  for (const p of dashRes.dashboard.panels) {
    if (!p.targets || p.targets.length === 0) continue;
    const body = {
      from: "now-1h",
      to: "now",
      queries: p.targets.map(t => ({
        ...t,
        datasource: p.datasource
      }))
    };

    const qRes = await new Promise(resolve => {
      const r = http.request({
        hostname: '172.27.210.154',
        port: 3005,
        path: '/api/ds/query',
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + grafanaToken,
          'Content-Type': 'application/json'
        }
      }, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => resolve(JSON.parse(d)));
      });
      r.write(JSON.stringify(body));
      r.end();
    });

    console.log(`\nPanel ${p.id} [${p.type}] "${p.title}":`);
    for (const k of Object.keys(qRes.results || {})) {
      const resObj = qRes.results[k];
      if (resObj.error) {
        console.log(`  ❌ Target ${k}: ERROR ${resObj.error}`);
      } else if (resObj.frames && resObj.frames.length > 0) {
        const valCount = resObj.frames[0].data?.values?.[1]?.length || 0;
        const lastVal = resObj.frames[0].data?.values?.[1]?.[valCount - 1];
        console.log(`  ✅ Target ${k}: OK (${valCount} pts, last: ${lastVal})`);
      } else {
        console.log(`  ⚠️ Target ${k}: Empty frame`);
      }
    }
  }
}

verifyAll();
