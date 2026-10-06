import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function queryGrafana(queries) {
  const now = Date.now();
  const payload = JSON.stringify({
    from: String(now - 900000),
    to: String(now),
    queries: queries.map((q, i) => ({
      refId: q.refId || String.fromCharCode(65 + i),
      schema: 13,
      queryType: '0',
      group: { filter: q.group || 'FortiGate' },
      host: { filter: q.host || '/milicic_border1/' },
      item: { filter: q.item },
      resultFormat: 'time_series',
      datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
    }))
  });

  return new Promise((resolve) => {
    const req = http.request({
      hostname: '172.27.210.154',
      port: 3005,
      path: '/api/ds/query',
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
    req.write(payload);
    req.end();
  });
}

async function testFortinetPanels() {
  console.log('--- 1. Test ISP In/Out queries ---');
  const ispRes = await queryGrafana([
    {
      refId: 'Inbound',
      item: '/Interface port1[45].*: Bits received/'
    },
    {
      refId: 'Outbound',
      item: '/Interface port1[45].*: Bits sent/'
    }
  ]);
  console.log('Inbound frames:', ispRes.results.Inbound?.frames?.length);
  ispRes.results.Inbound?.frames?.forEach(f => {
    const last = f.data.values[1].filter(x => x !== null).slice(-1)[0];
    console.log('  IN: ', f.schema.name, '=>', (last / 1000000).toFixed(1), 'Mbps');
  });
  console.log('Outbound frames:', ispRes.results.Outbound?.frames?.length);
  ispRes.results.Outbound?.frames?.forEach(f => {
    const last = f.data.values[1].filter(x => x !== null).slice(-1)[0];
    console.log('  OUT: ', f.schema.name, '=>', (last / 1000000).toFixed(1), 'Mbps');
  });

  console.log('\n--- 2. Test IPsec Tunnels query ---');
  const tunRes = await queryGrafana([
    {
      item: '/VPN (sap-pri|ros1sj1|ros1sj2|ros2sj1|ros2sj2|sap-bkp).*: Tunnel Status/'
    }
  ]);
  console.log('Tunnel frames:', tunRes.results.A?.frames?.length);
  tunRes.results.A?.frames?.forEach(f => {
    const last = f.data.values[1].filter(x => x !== null).slice(-1)[0];
    console.log('  ', f.schema.name, '=>', last === 2 ? 'UP (2)' : 'STANDBY/DOWN (' + last + ')');
  });
}

testFortinetPanels().catch(console.error);
