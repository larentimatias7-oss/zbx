import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const req = http.request('http://172.27.210.154:3005/api/dashboards/uid/noc-zabbix-command-center', {
  headers: { 'Authorization': 'Bearer ' + token }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    try {
      const d = JSON.parse(b);
      console.log(`NOC Command Center (Version: ${d.dashboard.version}) Panels: ${d.dashboard.panels.length}`);
      d.dashboard.panels.forEach(p => {
        if (p.type === 'row') {
          console.log(`[ROW] "${p.title}" (y: ${p.gridPos.y})`);
        }
      });
    } catch (e) {
      console.error(b);
    }
  });
});
req.end();
