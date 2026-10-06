import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

http.get('http://172.27.210.154:3005/public/plugins/marcusolsson-dynamictext-panel/module.js', {
  headers: { Authorization: `Bearer ${token}` }
}, res => {
  console.log("marcusolsson-dynamictext-panel status:", res.statusCode);
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log("length:", d.length);
    const idx = d.indexOf('styles');
    console.log("found styles?", idx !== -1);
  });
});
