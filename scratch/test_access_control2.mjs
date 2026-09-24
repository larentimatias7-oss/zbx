import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function req(method, path) {
  return new Promise(resolve => {
    http.request(`http://172.27.210.154:3005${path}`, {
      method,
      headers: { 'Authorization': 'Bearer ' + grafanaToken }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({ status: res.statusCode, body: b.slice(0, 100) }));
    }).end();
  });
}

async function run() {
  console.log('Roles:', await req('GET', '/api/access-control/roles'));
}
run();
