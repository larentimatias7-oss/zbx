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
    group: { filter: "sanJuan" },
    host: { filter: "/.*/" },
    item: { filter: "/(ICMP ping|Zabbix agent ping)/" },
    resultFormat: 'time_series'
  }],
  from: 'now-15m',
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
      console.log('Frames:', json.results?.A?.frames?.length);
      json.results?.A?.frames?.forEach(f => console.log('Host/Item:', f.schema?.fields?.[1]?.labels));
    } catch(e) { console.error(e); }
  });
});
req.write(payload);
req.end();
