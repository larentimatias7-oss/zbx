import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken || grafanaToken.length < 10) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function queryDashboard() {
  // Fetch dashboard
  const dashRes = await new Promise(resolve => {
    http.get({
      hostname: '172.27.210.154',
      port: 3005,
      path: '/api/dashboards/uid/milicic-geomap-wan-sdwan',
      headers: { 'Authorization': 'Bearer ' + grafanaToken }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
  });

  const panels = dashRes.dashboard.panels;
  for (const p of panels) {
    if (!p.targets || p.targets.length === 0) continue;
    console.log(`\nTesting Panel ${p.id} [${p.type}] "${p.title}"...`);
    const ds = p.datasource || { uid: "efz4nzx8r30g0c", type: "alexanderzobnin-zabbix-datasource" };
    
    // Prepare query payload
    const body = {
      from: "now-6h",
      to: "now",
      queries: p.targets.map(t => ({
        ...t,
        datasource: ds
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
          try {
            resolve(JSON.parse(d));
          } catch(e) {
            resolve({ error: d });
          }
        });
      });
      r.write(JSON.stringify(body));
      r.end();
    });

    if (qRes.results) {
      for (const k of Object.keys(qRes.results)) {
        const resObj = qRes.results[k];
        if (resObj.error) {
          console.log(`  Target ${k} ERROR:`, resObj.error);
        } else if (resObj.frames) {
          const rows = resObj.frames.reduce((acc, f) => acc + (f.data ? f.data.values[0].length : 0), 0);
          console.log(`  Target ${k} OK: ${resObj.frames.length} frames, ${rows} data points`);
        }
      }
    } else {
      console.log('  Response:', qRes);
    }
  }
}

queryDashboard();
