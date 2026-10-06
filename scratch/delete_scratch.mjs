import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const req = http.request({
  hostname: '172.27.210.154', port: 3005,
  path: '/api/dashboards/uid/test-wan-table-scratch',
  method: 'DELETE',
  headers: { Authorization: 'Bearer ' + token }
}, res => {
  console.log('Delete test dash status:', res.statusCode);
});
req.end();
