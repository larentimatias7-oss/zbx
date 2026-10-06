import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

http.get('http://172.27.210.154:3005/api/dashboards/uid/milicic-plugins-showcase', {
  headers: { Authorization: `Bearer ${token}` }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    try {
      const json = JSON.parse(d);
      const panels = json.dashboard?.panels || [];
      const dtPanels = panels.filter(p => p.type === 'marcusolsson-dynamictext-panel');
      console.log(`Found ${dtPanels.length} dynamictext panels in showcase:`);
      dtPanels.forEach(p => {
        console.log("Panel:", p.title);
        console.log(JSON.stringify(p.options, null, 2));
      });
    } catch (e) {
      console.error(e);
    }
  });
});
