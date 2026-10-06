import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

http.get('http://172.27.210.154:3005/public/plugins/alexanderzobnin-zabbix-triggers-panel/module.js', {
  headers: { Authorization: `Bearer ${token}` }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    let idx = 0;
    while ((idx = d.indexOf('queryType', idx)) !== -1) {
      console.log("Snippet at", idx, ":");
      console.log(d.substring(idx - 100, idx + 200));
      idx += 10;
    }
  });
});
