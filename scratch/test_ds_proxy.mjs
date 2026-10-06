import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const payload = JSON.stringify({
  jsonrpc: "2.0",
  method: "problem.get",
  params: {
    output: "extend",
    limit: 5,
    sortfield: ["eventid"],
    sortorder: "DESC"
  },
  id: 1,
  auth: null // or handled by datasource header/token
});

const req = http.request('http://172.27.210.154:3005/api/datasources/proxy/uid/efz4nzx8r30g0c/api_jsonrpc.php', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Content-Length': Buffer.byteLength(payload)
  }
}, res => {
  let b = '';
  res.on('data', d => b += d);
  res.on('end', () => {
    console.log("Datasource proxy status:", res.statusCode);
    console.log("Response:", b.slice(0, 400));
  });
});

req.on('error', console.error);
req.write(payload);
req.end();
