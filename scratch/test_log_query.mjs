import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const payload = JSON.stringify({
  queries: [
    {
      refId: "A",
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      schema: 12,
      queryType: "0", // Metrics
      group: { filter: "AD" },
      host: { filter: "SRO-DCO01" },
      item: { filter: "Eventlog by Zabbix agent: User locked" },
      resultFormat: "time_series"
    }
  ],
  from: "now-7d",
  to: "now"
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
    console.log('Status:', res.statusCode);
    try {
      const data = JSON.parse(b);
      console.log('Results A frames:', data.results?.A?.frames?.length);
      if (data.results?.A?.frames?.length > 0) {
        console.log('Fields:', data.results.A.frames[0].schema.fields.map(f => f.name));
        console.log('Rows count:', data.results.A.frames[0].data.values[0]?.length);
        console.log('First value:', data.results.A.frames[0].data.values[1]?.[0]);
      } else {
        console.log('Response body:', b.slice(0, 300));
      }
    } catch(e) {
      console.log('Error parsing:', e, b.slice(0, 300));
    }
  });
});
req.write(payload);
req.end();
