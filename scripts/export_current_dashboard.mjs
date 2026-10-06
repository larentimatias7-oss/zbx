import fs from 'fs';
import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const req = http.request({
  hostname: '172.27.210.154',
  port: 3005,
  path: '/api/dashboards/uid/noc-zabbix-command-center',
  headers: {
    'Authorization': 'Bearer ' + token
  }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    const d = JSON.parse(b);
    fs.writeFileSync('./dashboards/noc-zabbix-command-center.json', JSON.stringify(d.dashboard, null, 2));
    console.log('Saved live dashboard version ' + d.dashboard.version + ' with ' + d.dashboard.panels.length + ' panels to dashboards/noc-zabbix-command-center.json');
  });
});
req.end();
