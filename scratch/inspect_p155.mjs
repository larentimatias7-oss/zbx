import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

function grafanaRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = http.request({
      hostname: '172.27.210.154',
      port: 3005,
      path: path,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(b) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: b });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function run() {
  const res = await grafanaRequest('GET', '/api/dashboards/uid/noc-zabbix-command-center');
  if (res.status !== 200) throw new Error('Failed to fetch noc-zabbix-command-center: ' + res.status);
  
  const dash = res.data.dashboard;
  console.log('Dashboard title:', dash.title, 'version:', dash.version);
  
  const p156 = dash.panels.find(p => p.id === 156);
  console.log('Panel 156 targets:', JSON.stringify(p156.targets, null, 2));
  console.log('Panel 156 transformations:', JSON.stringify(p156.transformations, null, 2));

  const nearbyPanels = dash.panels.filter(p => p.gridPos && p.gridPos.y >= 55 && p.gridPos.y <= 75);
  console.log('Nearby panels:', nearbyPanels.map(p => ({ id: p.id, title: p.title, type: p.type, gridPos: p.gridPos })));
}

run().catch(console.error);
