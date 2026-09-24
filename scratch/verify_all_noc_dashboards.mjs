import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken || grafanaToken.length < 10) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const dashboards = [
  "milicic-noc-wallboard",
  "milicic-noc-latency-matrix",
  "milicic-noc-sre-cockpit"
];

async function verifyDashboard(uid) {
  const dashRes = await new Promise(resolve => {
    http.get({
      hostname: '172.27.210.154',
      port: 3005,
      path: '/api/dashboards/uid/' + uid,
      headers: { 'Authorization': 'Bearer ' + grafanaToken }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
  });

  console.log(`\n======================================================`);
  console.log(`VERIFYING: ${dashRes.dashboard.title} (${uid})`);
  console.log(`Panels Count: ${dashRes.dashboard.panels.length}`);
  console.log(`======================================================`);

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
        res.on('end', () => {
          try { resolve(JSON.parse(d)); } catch(e) { resolve({ error: d }); }
        });
      });
      r.write(JSON.stringify(body));
      r.end();
    });

    const results = qRes.results || {};
    let ok = 0;
    let err = 0;
    for (const k of Object.keys(results)) {
      if (results[k].error) err++;
      else if (results[k].frames && results[k].frames.length > 0) ok++;
    }
    console.log(`Panel ${p.id} [${p.type}] "${p.title}": ${ok} targets OK${err > 0 ? `, ${err} ERRORS` : ''}`);
  }
}

async function run() {
  for (const uid of dashboards) {
    await verifyDashboard(uid);
  }
}

run();
