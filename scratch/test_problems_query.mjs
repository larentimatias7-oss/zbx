import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const queryPayload = JSON.stringify({
  from: "now-7d",
  to: "now",
  queries: [
    {
      refId: "A",
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      schema: 12,
      queryType: "5",
      group: { filter: "/.*/" },
      options: { minSeverity: 1 }
    }
  ]
});

const req = http.request('http://172.27.210.154:3005/api/ds/query', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(queryPayload)
  }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(b);
      const frames = parsed.results.A.frames || [];
      console.log('Frames:', frames.length);
      if (frames[0]) {
        console.log('Fields:', frames[0].schema.fields.map(f => f.name));
        const rawJsonSample = frames[0].data.values[0][0];
        console.log('Sample raw JSON item:');
        console.log(JSON.stringify(JSON.parse(rawJsonSample), null, 2));
      }
    } catch (e) {
      console.error(e, b);
    }
  });
});
req.write(queryPayload);
req.end();
