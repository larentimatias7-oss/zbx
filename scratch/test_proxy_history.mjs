import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

// In Grafana, how does the frontend datasource query?
// The frontend calls Zabbix API via datasource proxy:
// /api/datasources/proxy/uid/efz4nzx8r30g0c/api_jsonrpc.php
function zabbixProxy(method, params) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      jsonrpc: "2.0",
      method,
      params,
      id: 1,
      auth: null
    });
    const req = http.request('http://172.27.210.154:3005/api/datasources/proxy/uid/efz4nzx8r30g0c/api_jsonrpc.php', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try { resolve(JSON.parse(b)); } catch(e) { resolve(b); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function test() {
  const history = await zabbixProxy('history.get', {
    history: 2,
    itemids: ["83274", "96712", "101379"],
    time_from: Math.floor(Date.now() / 1000) - (7 * 86400),
    output: "extend",
    sortfield: "clock",
    sortorder: "DESC",
    limit: 50
  });

  console.log('History raw result:', JSON.stringify(history).slice(0, 500));
  console.log('History results count:', history?.result?.length);
  if (history?.result?.length > 0) {
    console.log('Sample event:', history.result[0]);
  }
}

test();
