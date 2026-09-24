import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || "";
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const payload = JSON.stringify({
  queries: [{
    refId: 'A',
    datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
    queryType: '0',
    group: { filter: 'switch' },
    host: { filter: '/.*/' },
    item: { filter: '/(ICMP ping|Operational status|CPU|Availability)/' },
    resultFormat: 'time_series'
  }],
  from: 'now-1h',
  to: 'now'
});

const req = http.request('http://172.27.210.154:3005/api/ds/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }
}, res => {
  let b = '';
  res.on('data', d => b += d);
  res.on('end', () => {
    try {
      const json = JSON.parse(b);
      const frames = json.results?.A?.frames || [];
      console.log('Frames count:', frames.length);
      const hosts = new Set();
      frames.forEach(f => {
        const labels = f.schema?.fields?.[1]?.labels;
        if (labels?.host) hosts.add(labels.host + ' -> ' + labels.item);
      });
      console.log('Items found:');
      Array.from(hosts).forEach(h => console.log(' ', h));
    } catch(e) {
      console.error(b);
    }
  });
});
req.write(payload);
req.end();
