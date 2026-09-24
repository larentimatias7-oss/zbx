import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function testServersPolystat() {
  const now = Date.now();
  const queryPayload = {
    from: String(now - 3600*1000),
    to: String(now),
    queries: [
      {
        refId: "Ping",
        schema: 12,
        queryType: "0",
        group: { filter: "/.*/" },
        host: { filter: "/^(?!FTG_).*(DCO|FIL|BKP|APP|SQL|NAS|STO|Zabbix).*/" },
        item: { filter: "/(Zabbix agent ping|ICMP ping)/" },
        resultFormat: "time_series",
        datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" }
      }
    ]
  };
  const data = JSON.stringify(queryPayload);
  const res = await new Promise(resolve => {
    const req = http.request({
      hostname: '172.27.210.154', port: 3005, path: '/api/ds/query', method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, r => {
      let b = '';
      r.on('data', c => b += c);
      r.on('end', () => resolve({ status: r.statusCode, body: JSON.parse(b) }));
    });
    req.write(data); req.end();
  });

  const frames = res.body?.results?.Ping?.frames || [];
  console.log(`Frames retornados para Servers ping: ${frames.length}`);
  frames.forEach(f => {
    console.log(`- Frame: ${f.schema?.name || f.schema?.fields?.[1]?.name}`);
  });
}

testServersPolystat();
