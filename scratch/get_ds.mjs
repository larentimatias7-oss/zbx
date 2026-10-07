import http from 'http';
import { execSync } from 'child_process';

const token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();

http.get({
  hostname: '172.27.210.154', port: 3005, path: '/api/datasources/uid/efz4nzx8r30g0c',
  headers: { 'Authorization': 'Bearer ' + token }
}, res => {
  let b = ''; res.on('data', c => b += c);
  res.on('end', () => console.log(JSON.stringify(JSON.parse(b), null, 2)));
});
