import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

// Test /api/ds/query for Panel 3 (Event 4625) which we know has data in Zabbix!
const body = JSON.stringify({
  from: "now-6h",
  to: "now",
  queries: [
    {
      refId: "A",
      datasource: {
        type: "alexanderzobnin-zabbix-datasource",
        uid: "efz4nzx8r30g0c"
      },
      group: { filter: "AD" },
      host: { filter: "/(SRO-DCO01|SRO-DCO02|SSJ-DCO01)/" },
      item: { filter: "Eventlog by Zabbix agent: Failed Login" },
      queryType: "2",
      resultFormat: "table",
      schema: 12
    }
  ]
});

const req = http.request(`http://172.27.210.154:3005/api/ds/query`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + grafanaToken,
    'Content-Type': 'application/json'
  }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    try {
      const resJson = JSON.parse(b);
      console.log('Response:', JSON.stringify(resJson, null, 2).slice(0, 1500));
    } catch (e) {
      console.log('Raw body:', b);
    }
  });
});
req.write(body);
req.end();
