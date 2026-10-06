import http from 'http';
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
      group: { filter: 'FortiGate' },
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

async function run() {
  console.log('Testing ISP Traffic & HA Cluster metrics...');

  // 1. ISP In & Out traffic (Tasa & Claro)
  const isps = await queryGrafana([
    {
      item: '/Interface port1[45].*: Bits (received|sent)/'
    }
  ]);
  console.log('\n--- 1. ISP TRAFFIC IN / OUT ---');
  isps.results.A?.frames?.forEach(f => {
    const last = f.data.values[1].filter(x => x !== null).slice(-1)[0];
    console.log('  ', f.schema.name, '=>', (last / 1000000).toFixed(2), 'Mbps');
  });

  // 2. HA Nodes CPU & Mem
  const ha = await queryGrafana([
    {
      item: '/HA [12]: (CPU usage|Memory usage)/'
    }
  ]);
  console.log('\n--- 2. HA CLUSTER NODES ---');
  ha.results.A?.frames?.forEach(f => {
    const last = f.data.values[1].filter(x => x !== null).slice(-1)[0];
    console.log('  ', f.schema.name, '=>', last, '%');
  });

  // 3. Tunnels Status
  const tunnels = await queryGrafana([
    {
      item: '/VPN .*: Tunnel Status/'
    }
  ]);
  console.log('\n--- 3. IPSEC TUNNELS ---');
  tunnels.results.A?.frames?.forEach(f => {
    const last = f.data.values[1].filter(x => x !== null).slice(-1)[0];
    const statusText = last === 2 ? 'UP (2)' : last === 1 ? 'DOWN (1)' : last;
    console.log('  ', f.schema.name, '=>', statusText);
  });
}

run().catch(console.error);
