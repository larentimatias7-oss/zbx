import http from 'http';
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
    const d = JSON.parse(b);
    console.log('Dashboard title:', d.dashboard.title);
    console.log('Templating list:', d.dashboard.templating.list.map(v => ({ name: v.name, type: v.type, current: v.current, query: v.query })));
  });
});
req.end();
