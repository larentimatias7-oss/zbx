import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();

http.get({
  hostname: '172.27.210.154',
  port: 3005,
  path: '/api/dashboards/uid/test-canvas-props',
  headers: { 'Authorization': 'Bearer ' + token }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const dash = JSON.parse(d);
    console.log(JSON.stringify(dash.dashboard.panels[0].options, null, 2));
  });
});
