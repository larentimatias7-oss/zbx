import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function queryGrafana(queries) {
  const payload = JSON.stringify({
    queries: queries.map((q, idx) => ({
      refId: String.fromCharCode(65 + idx),
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      queryType: "0",
      schema: 12,
      resultFormat: "time_series",
      ...q
    })),
    from: "now-1h",
    to: "now"
  });

  return new Promise((resolve, reject) => {
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
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('--- Probando Redes: WAN e Internet ---');
  const resWan = await queryGrafana([
    {
      group: { filter: "firewall|FortiGate" },
      host: { filter: "FTG_milicic_border1_SNMP" },
      item: { filter: "/Interface port14\\(tasa\\): Bits (received|sent)/" }
    }
  ]);
  const wanFrames = resWan.results?.A?.frames || [];
  console.log('WAN frames:', wanFrames.map(f => f.schema?.name));

  console.log('\n--- Probando Redes: Trunks Discards ---');
  const resDrops = await queryGrafana([
    {
      group: { filter: "switch" },
      host: { filter: "SRO-E02-PB00-CORE01" },
      item: { filter: "/Interface (Te1/0/\\d+|Po\\d+): Inbound packets discarded/" }
    }
  ]);
  const dropFrames = resDrops.results?.A?.frames || [];
  console.log('Drop frames:', dropFrames.map(f => f.schema?.name));

  console.log('\n--- Probando Cómputo: Disk Queue y Latencia ---');
  const resDisk = await queryGrafana([
    {
      group: { filter: "server|Servidor|Windows" },
      host: { filter: "SRO-DC01|SRO-DC02" },
      item: { filter: "/Average disk (read|write) queue length/" }
    },
    {
      group: { filter: "server|Servidor|Windows" },
      host: { filter: "SRO-DC01|SRO-DC02" },
      item: { filter: "/Disk (read|write) request avg waiting time/" }
    }
  ]);
  console.log('Disk Queue frames:', (resDisk.results?.A?.frames || []).map(f => f.schema?.name));
  console.log('Disk Latency frames:', (resDisk.results?.B?.frames || []).map(f => f.schema?.name));

  console.log('\n--- Probando Facilities: Potencia y Batería ---');
  const resUps = await queryGrafana([
    {
      group: { filter: "ups|power|facilities" },
      host: { filter: "UPS SRO CORE" },
      item: { filter: "/Power Consumption|Battery Time/" }
    },
    {
      group: { filter: "ups|power|facilities" },
      host: { filter: "UPS Edificio Gris PB" },
      item: { filter: "/Load|Battery/" }
    }
  ]);
  console.log('UPS Core frames:', (resUps.results?.A?.frames || []).map(f => f.schema?.name));
  console.log('UPS PB frames:', (resUps.results?.B?.frames || []).map(f => f.schema?.name));
}

run().catch(console.error);
