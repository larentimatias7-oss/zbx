import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const payload = JSON.stringify({
  queries: [
    {
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      group: { filter: "FortiGate" },
      host: { filter: "/.*/" },
      item: { filter: "/IPv4 Active sessions/" },
      queryType: "0",
      refId: "A",
      resultFormat: "time_series",
      schema: 12
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
    try {
      const json = JSON.parse(b);
      const frames = json.results?.A?.frames || [];
      console.log('Series obtenidas:', frames.length);
      frames.forEach(f => {
        const host = f.schema.fields[1]?.labels?.host || f.schema.name;
        console.log(`- Serie: "${f.schema.name}" | Host label: "${host}"`);
      });
    } catch (e) {
      console.error(b);
    }
  });
});
req.write(payload);
req.end();
