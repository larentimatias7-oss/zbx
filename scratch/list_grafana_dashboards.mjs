import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const req = http.request('http://172.27.210.154:3005/api/search', {
  headers: { 'Authorization': 'Bearer ' + token }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    try {
      const list = JSON.parse(b);
      console.log('Total items in Grafana:', list.length);
      list.forEach(i => console.log(`${i.type.padEnd(8)} | ${i.uid.padEnd(25)} | ${i.title.padEnd(45)} | Folder: ${i.folderTitle || 'General'}`));
    } catch (e) {
      console.error(b);
    }
  });
});
req.end();
