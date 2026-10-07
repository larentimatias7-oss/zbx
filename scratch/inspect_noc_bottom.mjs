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
      const panels = d.dashboard.panels;
      console.log(`Total panels: ${panels.length}`);
      const sorted = [...panels].sort((a, b) => (b.gridPos.y + b.gridPos.h) - (a.gridPos.y + a.gridPos.h));
      console.log('Bottom 5 panels:');
      sorted.slice(0, 5).forEach(p => {
        console.log(`- ID: ${p.id} | Type: ${p.type} | Title: "${p.title}" | y: ${p.gridPos.y}, h: ${p.gridPos.h}, max Y: ${p.gridPos.y + p.gridPos.h}`);
      });
    } catch (e) {
      console.error(b);
    }
  });
});
req.end();
