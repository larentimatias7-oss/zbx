import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';

const token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();

http.get({
  hostname: '172.27.210.154',
  port: 3005,
  path: '/api/dashboards/uid/milicic-activedirectory-soc',
  headers: { 'Authorization': 'Bearer ' + token }
}, res => {
  let b = ''; res.on('data', c => b += c);
  res.on('end', () => {
    const data = JSON.parse(b);
    fs.writeFileSync('scratch/live_ad_soc.json', JSON.stringify(data.dashboard, null, 2), 'utf8');
    console.log(`Saved live dashboard v${data.dashboard.version} with ${data.dashboard.panels.length} panels.`);
  });
});
