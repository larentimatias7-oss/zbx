import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  try {
    token = execSync("powershell.exe -NoProfile -Command \"[System.Environment]::GetEnvironmentVariable('GRAFANA_SERVICE_ACCOUNT_TOKEN', 'User')\"", { encoding: 'utf8' }).trim();
  } catch (e) {}
}

const req = http.request({
  hostname: '172.27.210.154',
  port: 3005,
  path: '/api/dashboards/uid/milicic-soc-overview',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    try {
      const data = JSON.parse(b);
      console.log('Title:', data.dashboard?.title);
      console.log('Panels count:', data.dashboard?.panels?.length);
      data.dashboard?.panels?.forEach(p => console.log('  -', p.id, p.type, p.title));
    } catch (e) {
      console.error(e);
    }
  });
});
req.end();
