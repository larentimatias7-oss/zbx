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
    const d = JSON.parse(b).dashboard;
    console.log('Version:', d.version);
    const soc = d.panels.filter(p => p.id >= 150 && p.id <= 160);
    soc.forEach(p => {
      console.log('Panel ID:', p.id, '| Title:', p.title, '| Type:', p.type);
      if (p.targets) {
        console.log('  Targets:', p.targets.map(t => ({ refId: t.refId, host: t.host?.filter, item: t.item?.filter })));
      }
    });
  });
});
req.end();
