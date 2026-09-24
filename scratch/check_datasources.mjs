import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

http.get('http://172.27.210.154:3005/api/datasources', {
  headers: { Authorization: 'Bearer ' + token }
}, res => {
  let b = '';
  res.on('data', d => b += d);
  res.on('end', () => {
    try {
      const ds = JSON.parse(b);
      console.log('Datasources configured:');
      ds.forEach(d => console.log(' - ' + d.name + ' (' + d.type + '), UID: ' + d.uid));
    } catch(e) { console.error(b); }
  });
});
