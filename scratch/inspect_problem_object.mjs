import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const payload = JSON.stringify({
  from: "now-30d",
  to: "now",
  queries: [
    {
      refId: "A",
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      schema: 12,
      queryType: "5",
      options: { minSeverity: 1 }
    }
  ]
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
    try {
      const p = JSON.parse(b);
      const frame = p.results.A.frames[0];
      if (frame) {
        console.log('Fields in frame:', frame.schema.fields.map(f => f.name));
        const val = frame.data.values[0][0];
        console.log('Sample parsed problem:', JSON.stringify(JSON.parse(val), null, 2));
      } else {
        console.log('No frame returned, full response:', b);
      }
    } catch(e) {
      console.error(e, b);
    }
  });
});
req.write(payload);
req.end();
