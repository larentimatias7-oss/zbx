import http from 'http';
import { execSync } from 'child_process';

const token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();

const payload = JSON.stringify({
  jsonrpc: '2.0',
  method: 'apiinfo.version',
  params: [],
  id: 1
});

const req = http.request({
  hostname: '172.27.210.154',
  port: 3005,
  path: '/api/datasources/proxy/uid/efz4nzx8r30g0c/api_jsonrpc.php',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, res => {
  let b = ''; res.on('data', c => b += c);
  res.on('end', () => console.log('Proxy status:', res.statusCode, 'Body:', b));
});

req.write(payload);
req.end();
