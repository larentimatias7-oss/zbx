import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const ds = { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' };
const SRV_GROUPS = '/^(Windows_Server|Linux servers|Virtual machines|Hypervisors|Storage_Server|Backup_Server|Zabbix servers|AD|print|File_server|Applications)$/';

const payload = JSON.stringify({
  queries: [{
    refId: 'A', datasource: ds, schema: 12, queryType: '0',
    group: { filter: SRV_GROUPS },
    host: { filter: '/.*/' },
    item: { filter: '/(ICMP ping|agent.ping)/' },
    resultFormat: 'time_series'
  }],
  from: 'now-15m',
  to: 'now'
});

const req = http.request('http://172.27.210.154:3005/api/ds/query', {
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
    const data = JSON.parse(b);
    const frames = data.results.A.frames || [];
    console.log(`SRV_GROUPS returned ${frames.length} frames:`);
    const hosts = new Set();
    frames.forEach(f => {
      const h = f.schema.name.split(':')[0].trim();
      hosts.add(h);
    });
    console.log(`Unique hosts (${hosts.size}):`, Array.from(hosts).sort().join(', '));
  });
});
req.write(payload);
req.end();
