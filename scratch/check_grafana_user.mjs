import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function get(path) {
  return new Promise((resolve) => {
    http.get(`http://172.27.210.154:3005${path}`, {
      headers: { 'Authorization': 'Bearer ' + grafanaToken }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    }).on('error', err => resolve({ status: 0, body: err.message }));
  });
}

async function run() {
  console.log('1. /api/user:', await get('/api/user'));
  console.log('2. /api/serviceaccounts:', await get('/api/serviceaccounts'));
  console.log('3. /api/org/users:', await get('/api/org/users'));
  console.log('4. /api/access-control/user/permissions:', await get('/api/access-control/user/permissions'));
}

run();
