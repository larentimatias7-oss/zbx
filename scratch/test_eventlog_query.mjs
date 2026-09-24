import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const payload = JSON.stringify({
  queries: [
    {
      refId: "Q_Bloqueos_Table",
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      schema: 12,
      queryType: "0",
      group: { filter: "AD" },
      host: { filter: "SRO-DCO01" },
      item: { filter: "Eventlog by Zabbix agent: User locked" },
      resultFormat: "table"
    },
    {
      refId: "Q_Bloqueos_TS",
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      schema: 12,
      queryType: "0",
      group: { filter: "AD" },
      host: { filter: "SRO-DCO01" },
      item: { filter: "Eventlog by Zabbix agent: User locked" },
      resultFormat: "time_series"
    },
    {
      refId: "Q_Groups_Table",
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      schema: 12,
      queryType: "0",
      group: { filter: "AD" },
      host: { filter: "SRO-DCO01" },
      item: { filter: "Eventlog: Modificación de Grupos Privilegiados (4728, 4732, 4756)" },
      resultFormat: "table"
    },
    {
      refId: "Q_Problems",
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      schema: 12,
      queryType: "5",
      group: { filter: "AD" },
      host: { filter: "/.*/" },
      trigger: { filter: "/.*/" },
      options: { acknowledged: 2, minSeverity: 2 }
    }
  ],
  from: "now-30d",
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
    console.log('Body:', b);
  });
});
req.write(payload);
req.end();
