import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

function fetch(urlPath) {
  return new Promise((resolve) => {
    http.get(`http://172.27.210.154:3005${urlPath}`, {
      headers: { Authorization: `Bearer ${token}` }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: d });
      });
    }).on('error', err => resolve({ error: err }));
  });
}

async function run() {
  const p1 = await fetch('/api/plugins/alexanderzobnin-zabbix-triggers-panel');
  console.log("Plugin API info:", p1.status, p1.data.slice(0, 500));

  const p2 = await fetch('/api/plugins/alexanderzobnin-zabbix-triggers-panel/settings');
  console.log("Plugin settings:", p2.status, p2.data.slice(0, 500));
}

run();
