import http from 'http';
import { execSync } from 'child_process';

const token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();

async function inspectP60() {
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

  const p60 = res.dashboard.panels.find(p => p.id === 60);
  console.log(JSON.stringify(p60, null, 2));
}

inspectP60().catch(console.error);
