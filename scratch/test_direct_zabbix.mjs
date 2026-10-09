import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function getDatasource() {
  return new Promise((resolve, reject) => {
    const req = http.request('http://172.27.210.154:3005/api/datasources/uid/efz4nzx8r30g0c', {
      headers: { 'Authorization': 'Bearer ' + token }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(JSON.parse(b)));
    });
    req.on('error', reject);
    req.end();
  });
}

async function updateDatasource(ds) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(ds);
    const req = http.request(`http://172.27.210.154:3005/api/datasources/uid/${ds.uid}`, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(JSON.parse(b)));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function testHealth() {
  return new Promise((resolve, reject) => {
    const req = http.request('http://172.27.210.154:3005/api/datasources/uid/efz4nzx8r30g0c/health', {
      headers: { 'Authorization': 'Bearer ' + token }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const original = await getDatasource();
  console.log('Original URL:', original.url);

  console.log('Testing direct IP https://172.30.20.61/api_jsonrpc.php...');
  const modified = { ...original, url: 'https://172.30.20.61/api_jsonrpc.php' };
  await updateDatasource(modified);

  const health = await testHealth();
  console.log('Health result:', health);

  // Revert back
  console.log('Restoring original URL:', original.url);
  await updateDatasource(original);
  console.log('Reverted.');
}

main().catch(console.error);
