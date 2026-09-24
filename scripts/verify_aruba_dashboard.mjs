import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const req = http.request('http://172.27.210.154:3005/api/dashboards/uid/milicic-aruba-wifi-switches', {
  headers: { 'Authorization': 'Bearer ' + grafanaToken }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    const d = JSON.parse(b);
    console.log('Grafana Verified:', d.dashboard.title);
    console.log('Panels count:', d.dashboard.panels.length);
    console.log('Folder:', d.meta.folderTitle, '(UID: ' + d.meta.folderUid + ')');
    console.log('URL:', 'http://172.27.210.154:3005' + d.meta.url);
  });
});
req.end();
