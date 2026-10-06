import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const payload = JSON.stringify({
  queries: [{
    refId: 'A',
    datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
    schema: 12,
    queryType: '0',
    group: { filter: '/(Windows_Server|Linux servers|Virtual machines|Hypervisors|Storage_Server|Backup_Server|Zabbix servers|AD|Datacenter|Applications)/' },
    host: { filter: '/.*/' },
    item: { filter: '/(agent.ping|ICMP ping)/' },
    resultFormat: 'time_series'
  }],
  from: 'now-15m',
  to: 'now'
});

const req = http.request('http://172.27.210.154:3005/api/ds/query', {
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
    const json = JSON.parse(b);
    const frames = json.results?.A?.frames || [];
    console.log(`Total server frames: ${frames.length}`);
    const hostMap = new Map();
    frames.forEach(f => {
      const name = f.schema?.name || '';
      const [host, item] = name.split(': ');
      if (!hostMap.has(host)) hostMap.set(host, []);
      hostMap.get(host).push(item);
    });
    console.log(`Unique hosts: ${hostMap.size}`);
    hostMap.forEach((items, host) => {
      console.log(`Host: ${host} -> Items: [${items.join(', ')}]`);
    });
  });
});

req.on('error', console.error);
req.write(payload);
req.end();
