import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken || grafanaToken.length < 10) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const req = http.request({
  hostname: '172.27.210.154',
  port: 3005,
  path: '/api/dashboards/uid/milicic-geomap-wan-sdwan',
  headers: { 'Authorization': 'Bearer ' + grafanaToken }
}, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    try {
      const d = JSON.parse(data);
      console.log('Dashboard Title:', d.dashboard.title);
      console.log('Panels count:', d.dashboard.panels.length);
      d.dashboard.panels.forEach(p => {
        console.log(`Panel ${p.id} [${p.type}]: ${p.title} (targets: ${(p.targets||[]).length})`);
      });
    } catch (e) {
      console.error(e, data);
    }
  });
});
req.end();
