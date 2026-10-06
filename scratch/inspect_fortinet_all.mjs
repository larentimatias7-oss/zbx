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
      host: { filter: q.host || '/.*/' },
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
  console.log('Searching all Fortinet metrics in Zabbix...');

  // Search 1: VPN metrics (IPsec, SSL, Tunnels)
  const vpn = await queryGrafana([
    { item: '/(VPN|tunnel|IPsec|ssl.vpn|tunnels)/' }
  ]);
  console.log('--- 1. VPN Metrics ---');
  console.log('Found frames:', vpn.results.A.frames?.length || 0);
  vpn.results.A.frames?.forEach(f => {
    const last = f.data.values[1].filter(x => x !== null).slice(-1)[0];
    console.log('  ', f.schema.name, '=>', last);
  });

  // Search 2: SD-WAN & SLA
  const sdwan = await queryGrafana([
    { item: '/(SD-WAN|SLA|jitter|packet loss|latency|delay)/' }
  ]);
  console.log('\n--- 2. SD-WAN & SLA Metrics ---');
  console.log('Found frames:', sdwan.results.A.frames?.length || 0);
  sdwan.results.A.frames?.slice(0, 15).forEach(f => {
    const last = f.data.values[1].filter(x => x !== null).slice(-1)[0];
    console.log('  ', f.schema.name, '=>', last);
  });

  // Search 3: HA (High Availability) & Cluster
  const ha = await queryGrafana([
    { item: '/(HA|cluster|sync|failover|standby|primary|secondary|peer)/' }
  ]);
  console.log('\n--- 3. High Availability / HA Metrics ---');
  console.log('Found frames:', ha.results.A.frames?.length || 0);
  ha.results.A.frames?.forEach(f => {
    const last = f.data.values[1].filter(x => x !== null).slice(-1)[0];
    console.log('  ', f.schema.name, '=>', last);
  });

  // Search 4: Sessions rate, concurrent sessions, drop
  const sessions = await queryGrafana([
    { item: '/(session|rate|drop|packet|connection)/' }
  ]);
  console.log('\n--- 4. Session & Traffic Rate Metrics ---');
  console.log('Found frames:', sessions.results.A.frames?.length || 0);
  sessions.results.A.frames?.slice(0, 15).forEach(f => {
    const last = f.data.values[1].filter(x => x !== null).slice(-1)[0];
    console.log('  ', f.schema.name, '=>', last);
  });
}

run().catch(console.error);
