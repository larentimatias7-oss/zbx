import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const uid = process.argv[2] || 'milicic-fortigate-sdwan';

const req = http.request(`http://172.27.210.154:3005/api/dashboards/uid/${uid}`, {
  headers: { 'Authorization': 'Bearer ' + grafanaToken }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    try {
      const data = JSON.parse(b);
      console.log(`=== DASHBOARD: ${data.dashboard.title} (${data.dashboard.uid}) ===`);
      console.log(`Total paneles: ${data.dashboard.panels.length}`);
      data.dashboard.panels.forEach(p => {
        console.log(`- ID ${String(p.id).padEnd(2)}: [${p.type.padEnd(10)}] "${p.title}" (x:${p.gridPos.x}, y:${p.gridPos.y}, w:${p.gridPos.w}, h:${p.gridPos.h})`);
      });
    } catch (e) {
      console.error(b);
    }
  });
});
req.end();
