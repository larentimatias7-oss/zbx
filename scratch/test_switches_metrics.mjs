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
    host: { filter: 'SRO-E02-PB00-CORE01' },
    item: { filter: '/Interface (Po4|Te1\\/0\\/5|Te1\\/0\\/6|Te1\\/0\\/8).*Bits received/' },
    resultFormat: 'time_series'
  }],
  from: 'now-3h',
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
      json.results?.A?.frames?.forEach(f => console.log('Item:', f.schema?.fields?.[1]?.labels?.item));
    } catch(e) { console.error(e); }
  });
});
req.write(payload);
req.end();
