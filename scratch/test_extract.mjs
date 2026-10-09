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
  path: '/api/frontend/settings',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token
  }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    try {
      const s = JSON.parse(b);
      console.log('Build info:', s.buildInfo);
      console.log('Boot data keys:', Object.keys(s.bootData || {}));
    } catch(e) { console.error(e); }
  });
});
req.end();
