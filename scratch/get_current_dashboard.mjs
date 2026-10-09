import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  try {
    token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
  } catch (e) {}
}

const req = http.request({
  hostname: '172.27.210.154',
  port: 3005,
  path: '/api/dashboards/uid/zabbix-matrixmax-overview',
  method: 'GET',
  headers: { 'Authorization': 'Bearer ' + token }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    try {
      const d = JSON.parse(b);
      console.log('Dashboard Version:', d.dashboard?.version);
      const p10 = d.dashboard?.panels?.find(p => p.id === 10);
      if (p10) {
        console.log('Panel 10 Title:', p10.title);
        console.log('Panel 10 Content length:', p10.options?.content?.length);
        console.log('Panel 10 includes preRenderedTable:', p10.options?.content?.includes('matrix-main-table'));
        console.log('Panel 10 afterRender includes context.element:', p10.options?.afterRender?.includes('context.element'));
      }
    } catch (e) {
      console.error(e);
    }
  });
});
req.end();
