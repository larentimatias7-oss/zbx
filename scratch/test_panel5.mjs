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
      group: { filter: "/.*/" },
      host: { filter: "/.*/" },
      options: {
        acknowledged: 2,
        hostsInMaintenance: false,
        limit: 1000,
        minSeverity: 2,
        severities: [2, 3],
        sortProblems: "priority"
      },
      queryType: "5",
      refId: "A",
      schema: 12,
      showProblems: "problems"
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
      console.log('Result:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.error(b);
    }
  });
});
req.write(payload);
req.end();
