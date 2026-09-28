import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const uid = 'milicic-activedirectory-soc';

const req = http.request(`http://172.27.210.154:3005/api/dashboards/uid/${uid}`, {
  headers: { 'Authorization': 'Bearer ' + grafanaToken }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    try {
      const data = JSON.parse(b);
      fs.writeFileSync('c:/zabbix_anti/scratch/ad_dashboard_raw.json', JSON.stringify(data, null, 2), 'utf8');
      console.log(`Saved dashboard to scratch/ad_dashboard_raw.json (Version: ${data.dashboard.version})`);
      console.log(`Total panels: ${data.dashboard.panels.length}`);
      data.dashboard.panels.forEach(p => {
        console.log(`ID ${p.id}: [${p.type}] "${p.title}"`);
        if (p.panels) {
          p.panels.forEach(sp => console.log(`  Sub ID ${sp.id}: [${sp.type}] "${sp.title}"`));
        }
      });
    } catch (e) {
      console.error(b);
    }
  });
});
req.end();
