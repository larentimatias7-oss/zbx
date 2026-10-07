import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

function queryGrafana(queries, timeFrom = "now-15m") {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      queries: queries.map((q, idx) => ({
        datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
        schema: 13,
        refId: String.fromCharCode(65 + idx),
        ...q
      })),
      from: timeFrom,
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
      res.on('end', () => resolve(JSON.parse(b)));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('Testing SD-WAN queries:');
  const res = await queryGrafana([
    {
      queryType: "0",
      group: { filter: "FortiGate" },
      host: { filter: "/.*ar-.*/" },
      item: { filter: "/.*Packets loss.*/" },
      resultFormat: "time_series"
    },
    {
      queryType: "0",
      group: { filter: "FortiGate" },
      host: { filter: "/.*ar-.*/" },
      item: { filter: "/.*Latency.*/" },
      resultFormat: "time_series"
    }
  ]);

  const lossFrames = res.results?.A?.frames || [];
  const latFrames = res.results?.B?.frames || [];
  console.log(`Loss frames: ${lossFrames.length}, Latency frames: ${latFrames.length}`);

  if (lossFrames.length > 0) {
    console.log('Sample Loss frame name:', lossFrames[0].schema?.name);
    console.log('Sample Loss last value:', lossFrames[0].data?.values?.[1]?.slice(-1));
  }
}

main().catch(console.error);
