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
    const dash = JSON.parse(b).dashboard;
    console.log(`Live Dashboard: ${dash.title} (Version: ${dash.version}) | Panels count: ${dash.panels.length}\n`);
    for (const p of dash.panels) {
      const t = p.title || (p.options?.content ? 'Text/HTML Banner' : '');
      console.log(`[id: ${p.id.toString().padStart(3)}] y: ${p.gridPos?.y.toString().padStart(2)} | x: ${p.gridPos?.x.toString().padStart(2)} | w: ${p.gridPos?.w.toString().padStart(2)} | h: ${p.gridPos?.h.toString().padStart(2)} | type: ${p.type.padEnd(14)} | '${t}'`);
    }
  });
});
req.end();
