import http from 'http';
import { execSync } from 'child_process';
import fs from 'fs';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

http.get('http://172.27.210.154:3005/api/dashboards/uid/noc-zabbix-command-center', {
  headers: { Authorization: `Bearer ${token}` }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const json = JSON.parse(d);
    console.log("Current version:", json.dashboard?.version);
    console.log("Total panels:", json.dashboard?.panels?.length);
    fs.writeFileSync('scratch/current_user_dash.json', JSON.stringify(json.dashboard, null, 2));
    console.log("Panels list:");
    json.dashboard?.panels?.forEach(p => {
      console.log(`- ID: ${p.id}, Title: "${p.title}", Type: ${p.type}, GridPos: ${JSON.stringify(p.gridPos)}`);
      if (p.targets) {
        p.targets.forEach(t => {
          console.log(`    Target: group="${t.group?.filter}", host="${t.host?.filter}", item="${t.item?.filter}"`);
        });
      }
    });
  });
});
