import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const req = http.request({
  hostname: '172.27.210.154',
  port: 3005,
  path: '/api/datasources/uid/efz4nzx8r30g0c',
  headers: { 'Authorization': 'Bearer ' + token }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('HTTP Status:', res.statusCode);
    try {
      const json = JSON.parse(data);
      console.log('ID:', json.id);
      console.log('UID:', json.uid);
      console.log('Name:', json.name);
      console.log('Type:', json.type);
      console.log('URL:', json.url);
      console.log('jsonData:', JSON.stringify(json.jsonData, null, 2));
      console.log('secureJsonFields:', json.secureJsonFields);
    } catch(e) {
      console.log(data);
    }
  });
});
req.end();
