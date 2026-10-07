import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

function queryGrafana(query) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      queries: [
        {
          datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
          schema: 12,
          refId: "A",
          ...query
        }
      ],
      from: "now-7d",
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
  const types = ["0", "2", "4"];
  for (const qt of types) {
    console.log(`\n--- Testing queryType: ${qt} for 'locked.user' ---`);
    const r = await queryGrafana({
      queryType: qt,
      group: { filter: "/.*/" },
      host: { filter: "SRO-DCO01" },
      item: { filter: "User locked Name" },
      resultFormat: "table"
    });
    const resA = r.results && r.results.A;
    console.log(`qt ${qt} frames count:`, resA && resA.frames ? resA.frames.length : 0);
    if (resA && resA.frames && resA.frames.length > 0) {
      console.log('Fields:', resA.frames[0].schema.fields.map(f => f.name));
      console.log('Sample rows:', resA.frames[0].data.values);
    }
  }

  for (const qt of types) {
    console.log(`\n--- Testing queryType: ${qt} for Group changes ---`);
    const r = await queryGrafana({
      queryType: qt,
      group: { filter: "/.*/" },
      host: { filter: "SRO-DCO01" },
      item: { filter: "Eventlog: Modificación de Grupos Privilegiados (4728, 4732, 4756)" },
      resultFormat: "table"
    });
    const resA = r.results && r.results.A;
    console.log(`qt ${qt} frames count:`, resA && resA.frames ? resA.frames.length : 0);
    if (resA && resA.frames && resA.frames.length > 0) {
      console.log('Fields:', resA.frames[0].schema.fields.map(f => f.name));
      console.log('Sample rows:', resA.frames[0].data.values);
    }
  }
}

run().catch(console.error);
