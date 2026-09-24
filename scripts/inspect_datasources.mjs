import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const req = http.request('http://172.27.210.154:3005/api/datasources', {
  headers: { 'Authorization': 'Bearer ' + grafanaToken }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    try {
      const list = JSON.parse(b);
      console.log('Datasources found:', list.length);
      list.forEach(ds => {
        console.log(`- ID: ${ds.id} | UID: ${ds.uid} | Name: "${ds.name}" | Type: ${ds.type} | URL: ${ds.url} | Default: ${ds.isDefault}`);
        console.log('  jsonData:', JSON.stringify(ds.jsonData));
      });
    } catch (e) {
      console.error('Error parsing JSON:', b);
    }
  });
});
req.end();
