import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const req = http.request('http://172.27.210.154:3005/api/dashboards/uid/milicic-activedirectory-soc', {
  headers: { 'Authorization': 'Bearer ' + token }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    try {
      const d = JSON.parse(b);
      fs.writeFileSync('.zabbix_context/dashboards/milicic-activedirectory-soc-live.json', JSON.stringify(d, null, 2), 'utf8');
      console.log(`Saved live dashboard version ${d.dashboard.version} (title: "${d.dashboard.title}")`);
    } catch (e) {
      console.error(b);
    }
  });
});
req.end();
