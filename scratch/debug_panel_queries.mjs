import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

function queryGrafana(queries, timeFrom = "now-24h") {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      queries: queries.map((q, idx) => ({
        datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
        schema: 12,
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

async function main() {
  console.log('=== 1. TESTING 4625 ITEMS QUERY (USER, IP, STATUS) ===');
  // Let's test querying logon items
  const rLogon = await queryGrafana([
    {
      queryType: "2",
      group: { filter: "AD" },
      host: { filter: "SRO-DCO01" },
      item: { filter: "Usuario con Fallo de Logon" },
      resultFormat: "time_series"
    },
    {
      queryType: "2",
      group: { filter: "AD" },
      host: { filter: "SRO-DCO01" },
      item: { filter: "IP Origen con Fallo de Logon" },
      resultFormat: "time_series"
    },
    {
      queryType: "2",
      group: { filter: "AD" },
      host: { filter: "SRO-DCO01" },
      item: { filter: "Código Sub-Status Fallo Logon" },
      resultFormat: "time_series"
    }
  ]);
  console.log('Logon results keys:', Object.keys(rLogon.results));
  for (const [k, v] of Object.entries(rLogon.results)) {
    console.log(`Target ${k}: error=${v.error}, frames=${v.frames?.length}`);
    if (v.frames && v.frames[0]) {
      console.log('  Schema name:', v.frames[0].schema?.name);
      console.log('  Fields:', v.frames[0].schema?.fields?.map(f => f.name));
      console.log('  Data rows count:', v.frames[0].data?.values?.[0]?.length);
      console.log('  Last 3 values:', v.frames[0].data?.values?.[1]?.slice(-3));
    }
  }

  console.log('\n=== 2. TESTING PANEL 161 (LINK FLAPPING PROBLEMS QUERY) ===');
  const rFlap = await queryGrafana([
    {
      queryType: "5",
      group: { filter: "/.*/" },
      host: { filter: "/.*/" },
      options: {
        minSeverity: 2,
        problems: "all"
      }
    }
  ], "now-7d");
  console.log('Flap query result:', rFlap.results?.A?.error || 'OK');
  console.log('Flap frames count:', rFlap.results?.A?.frames?.length);

  console.log('\n=== 3. TESTING PANEL 162 (SD-WAN ITEMS QUERY) ===');
  const rSdwan = await queryGrafana([
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
  ], "now-15m");
  console.log('SD-WAN Loss frames count:', rSdwan.results?.A?.frames?.length);
  console.log('SD-WAN Latency frames count:', rSdwan.results?.B?.frames?.length);
  if (rSdwan.results?.A?.frames?.[0]) {
    console.log('Sample SD-WAN Loss frame name:', rSdwan.results.A.frames[0].schema?.name);
  }
}

main().catch(console.error);
