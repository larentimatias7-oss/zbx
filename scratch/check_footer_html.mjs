import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

http.get('http://172.27.210.154:3005/d/noc-zabbix-command-center/noc-zabbix-command-center?kiosk', {
  headers: { Authorization: `Bearer ${token}` }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log("HTML response length:", d.length);
    const idx = d.indexOf('footer');
    console.log("Found 'footer'?", idx !== -1);
    if (idx !== -1) {
      console.log(d.substring(idx - 100, idx + 200));
    }
  });
});
