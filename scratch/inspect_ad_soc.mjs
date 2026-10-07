import http from 'http';
import { execSync } from 'child_process';

const token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();

async function inspectADSOC() {
  const res = await new Promise((resolve) => {
    http.get({
      hostname: '172.27.210.154',
      port: 3005,
      path: '/api/dashboards/uid/milicic-activedirectory-soc',
      headers: { 'Authorization': 'Bearer ' + token }
    }, r => {
      let b = ''; r.on('data', c => b += c);
      r.on('end', () => resolve(JSON.parse(b)));
    });
  });

  console.log('Dashboard Title:', res.dashboard.title);
  console.log('Version:', res.dashboard.version);
  console.log('Panels Count:', res.dashboard.panels.length);
  for (const p of res.dashboard.panels) {
    console.log(`- ID ${p.id} [${p.type}]: ${p.title} (x:${p.gridPos?.x}, y:${p.gridPos?.y}, w:${p.gridPos?.w}, h:${p.gridPos?.h})`);
  }
}

inspectADSOC().catch(console.error);
