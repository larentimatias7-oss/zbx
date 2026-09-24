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
      datasource: {
        type: "alexanderzobnin-zabbix-datasource",
        uid: "efz4nzx8r30g0c"
      },
      schema: 12,
      queryType: "0",
      group: { filter: "AD" },
      host: { filter: "SRO-DCO01" },
      item: { filter: "CPU utilization" },
      resultFormat: "time_series"
    }
  ],
  from: "now-1h",
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
    console.log('Query HTTP Status:', res.statusCode);
    try {
      const data = JSON.parse(b);
      const frames = data.results.A.frames;
      console.log('Data frames returned:', frames.length);
      if (frames.length > 0) {
        console.log('Frame Name:', frames[0].schema.name);
        console.log('Total data points:', frames[0].data.values[0].length);
        console.log('Last value:', frames[0].data.values[1][frames[0].data.values[1].length - 1]);
      }
    } catch(e) {
      console.log('Raw output:', b);
    }
  });
});
req.write(payload);
req.end();
