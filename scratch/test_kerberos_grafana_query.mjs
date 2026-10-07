import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

function queryGrafana(queries) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      queries: queries.map((q, idx) => ({
        datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
        schema: 12,
        refId: String.fromCharCode(65 + idx),
        ...q
      })),
      from: "now-1h",
      to: "now"
    });

    const req = http.request('http://172.27.210.154:3005/api/ds/query', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + grafanaToken,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(b));
        } catch (e) {
          reject(new Error(b));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  const res = await queryGrafana([
    {
      queryType: "2",
      group: { filter: "AD" },
      host: { filter: "SRO-DCO01" },
      item: { filter: "User locked Name" },
      resultFormat: "time_series"
    }
  ]);
  console.log(JSON.stringify(res.results, null, 2));
}

run().catch(console.error);
