import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const req = http.request('http://172.27.210.154:3005/api/search?type=dash-db', {
  headers: { 'Authorization': 'Bearer ' + grafanaToken }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    try {
      const list = JSON.parse(b);
      console.log(`Encontrados ${list.length} dashboards:`);
      list.forEach(d => console.log(`- [${d.uid}] ${d.title} (Folder: ${d.folderTitle || 'General'}) -> ${d.url}`));
    } catch (e) {
      console.error(b);
    }
  });
});
req.end();
