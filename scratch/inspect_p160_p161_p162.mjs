import http from 'http';
import { execSync } from 'child_process';
import fs from 'fs';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

http.get('http://172.27.210.154:3005/api/dashboards/uid/noc-zabbix-command-center', {
  headers: { Authorization: 'Bearer ' + token }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    const dash = JSON.parse(b);
    const p155 = dash.dashboard.panels.find(p => p.id === 155);
    const p160 = dash.dashboard.panels.find(p => p.id === 160);
    const p161 = dash.dashboard.panels.find(p => p.id === 161);
    const p162 = dash.dashboard.panels.find(p => p.id === 162);
    
    fs.writeFileSync('scratch/panels_160_161_162.json', JSON.stringify({ p155, p160, p161, p162 }, null, 2));
    console.log('Saved panels to scratch/panels_160_161_162.json');
    console.log('P160 title:', p160?.title, 'targets:', p160?.targets?.length, 'transforms:', p160?.transformations?.length);
    console.log('P161 title:', p161?.title, 'targets:', p161?.targets?.length, 'transforms:', p161?.transformations?.length);
    console.log('P162 title:', p162?.title, 'targets:', p162?.targets?.length, 'transforms:', p162?.transformations?.length);
  });
});
