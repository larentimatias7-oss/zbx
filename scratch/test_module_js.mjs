import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

http.get('http://172.27.210.154:3005/public/plugins/alexanderzobnin-zabbix-triggers-panel/module.js', {
  headers: { Authorization: `Bearer ${token}` }
}, res => {
  console.log("module.js status:", res.statusCode, res.headers['content-type']);
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log("module.js length:", d.length, "preview:", d.slice(0, 200));
  });
});
