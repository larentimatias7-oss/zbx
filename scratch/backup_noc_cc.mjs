import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

function grafanaRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = http.request({
      hostname: '172.27.210.154',
      port: 3005,
      path: path,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(b) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: b });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('Fetching live noc-zabbix-command-center...');
  const res = await grafanaRequest('GET', '/api/dashboards/uid/noc-zabbix-command-center');
  if (res.status !== 200) throw new Error('Failed to fetch noc-zabbix-command-center: ' + res.status);
  
  const v = res.data.dashboard.version || 'v34';
  const fname = `.zabbix_context/dashboards/backups/noc-zabbix-command-center-backup-v${v}.json`;
  fs.writeFileSync(fname, JSON.stringify(res.data.dashboard, null, 2), 'utf8');
  console.log(`Saved backup to ${fname}`);
}

run().catch(console.error);
