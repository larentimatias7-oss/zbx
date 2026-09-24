import http from 'http';
import { execSync } from 'child_process';
import fs from 'fs';

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
  const u = await get('/api/user');
  const sa = await get('/api/serviceaccounts');
  const org = await get('/api/org/users');
  console.log('User status:', u.status, u.body.slice(0, 150));
  console.log('SA status:', sa.status, sa.body.slice(0, 150));
  console.log('Org status:', org.status, org.body.slice(0, 150));
}

run();
