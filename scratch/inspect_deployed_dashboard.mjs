import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

// We can check how the dashboard is currently configured in Grafana
const req = http.request('http://172.27.210.154:3005/api/dashboards/uid/noc-zabbix-command-center', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token
  }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    const data = JSON.parse(b);
    console.log('Dashboard title:', data.dashboard.title);
    console.log('Version:', data.dashboard.version);
    console.log('Panels count:', data.dashboard.panels?.length);
    data.dashboard.panels?.forEach(p => {
      console.log(`- Panel ${p.id}: [${p.type}] "${p.title}" (w:${p.gridPos.w}, h:${p.gridPos.h}, x:${p.gridPos.x}, y:${p.gridPos.y})`);
    });
  });
});
req.end();
