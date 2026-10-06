import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const uids = ['ae0yciqutx2iob', 'fe0ylyg4cdd6oc', 'be0yks0sqf7y8e'];

for (const uid of uids) {
  http.get(`http://172.27.210.154:3005/api/dashboards/uid/${uid}`, {
    headers: { Authorization: `Bearer ${token}` }
  }, res => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      const data = JSON.parse(d);
      const panels = data.dashboard.panels || [];
      console.log(`\n=== DASHBOARD: ${data.dashboard.title} (${uid}) ===`);
      for (const p of panels) {
        if (p.type === 'alexanderzobnin-zabbix-triggers-panel' || p.type?.includes('trigger') || p.type?.includes('zabbix')) {
          console.log(`Found panel: id=${p.id}, title="${p.title}", type="${p.type}"`);
          console.log(JSON.stringify(p, null, 2));
        }
      }
    });
  });
}
