import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

http.get('http://172.27.210.154:3005/api/frontend/settings', {
  headers: { Authorization: `Bearer ${token}` }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    try {
      const json = JSON.parse(d);
      console.log("frontend settings keys:", Object.keys(json));
      console.log("bootData:", Object.keys(json.bootData || {}));
      console.log("disableSanitizeHtml at root:", json.disableSanitizeHtml);
      console.log("buildInfo:", json.buildInfo);
    } catch (e) {
      console.log(d.slice(0, 500));
    }
  });
});
