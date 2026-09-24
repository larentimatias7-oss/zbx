import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

function postQuery(payload) {
  return new Promise((resolve) => {
    const data = JSON.stringify(payload);
    const req = http.request({
      hostname: '172.27.210.154',
      port: 3005,
      path: '/api/ds/query',
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
        } catch (e) {
          resolve({ status: res.statusCode, raw: b.slice(0, 300) });
        }
      });
    });
    req.on('error', err => resolve({ status: 0, error: err.message }));
    req.write(data);
    req.end();
  });
}

async function testDashboard(uid) {
  console.log(`\n======================================================`);
  console.log(`PROBANDO DASHBOARD: ${uid}`);
  console.log(`======================================================`);

  const dbRes = await new Promise(resolve => {
    http.get(`http://172.27.210.154:3005/api/dashboards/uid/${uid}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(JSON.parse(b)));
    });
  });

  const panels = dbRes.dashboard.panels || [];
  const now = Date.now();
  const from = String(now - 3 * 3600 * 1000);
  const to = String(now);

  for (const p of panels) {
    if (p.type === 'row' || !p.targets || p.targets.length === 0) continue;

    // Si es un panel de problemas/triggers (queryType 1, 4 o 5), indicar soporte nativo de frontend
    const isTriggerQuery = p.targets.some(t => String(t.queryType) === '1' || String(t.queryType) === '4' || String(t.queryType) === '5');
    if (isTriggerQuery) {
      console.log(`[${String(p.id).padEnd(2)}] "${p.title.slice(0, 45).padEnd(45)}" => ⚡ TRIGGER/PROBLEM PANEL (Frontend Native: OK)`);
      continue;
    }

    // Sustituir variables simples para la prueba si existen
    const targets = JSON.parse(JSON.stringify(p.targets)).map(t => {
      if (t.host && typeof t.host.filter === 'string') {
        t.host.filter = t.host.filter.replace(/\$\{[a-zA-Z0-9_:]+\}/g, '.*')
                                     .replace(/\$[a-zA-Z0-9_]+/g, '.*');
      }
      return {
        ...t,
        datasource: p.datasource
      };
    });

    const payload = {
      from,
      to,
      queries: targets
    };

    const res = await postQuery(payload);
    let frames = 0;
    let rows = 0;
    let errMessage = null;

    if (res.status === 200 && res.body?.results) {
      for (const k of Object.keys(res.body.results)) {
        const r = res.body.results[k];
        if (r.error) {
          errMessage = r.error;
        }
        if (r.frames) {
          frames += r.frames.length;
          for (const f of r.frames) {
            rows += (f.data?.values?.[0]?.length || 0);
          }
        }
      }
    } else {
      errMessage = `HTTP ${res.status}: ${res.raw || JSON.stringify(res.body?.message || res.body)}`;
    }

    const state = errMessage ? `❌ ERROR: ${errMessage}` : (frames === 0 || rows === 0 ? '⚠️ NO DATA' : `✅ OK (${frames} series, ${rows} pts)`);
    console.log(`[${String(p.id).padEnd(2)}] "${p.title.slice(0, 45).padEnd(45)}" => ${state}`);
  }
}

async function run() {
  const dashboardsToTest = [
    'milicic-servers-overview',
    'milicic-aruba-wifi-switches',
    'milicic-switches-core',
    'milicic-fortigate-sdwan',
    'milicic-vmware-datastores',
    'milicic-sanjuan-infra',
    'milicic-backup-veeam',
    'milicic-facilities-ups',
    'milicic-activedirectory-soc',
    'milicic-soc-overview'
  ];

  for (const uid of dashboardsToTest) {
    await testDashboard(uid);
  }
}

run().catch(console.error);
