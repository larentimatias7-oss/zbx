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
      refId: String.fromCharCode(65 + i),
      schema: 13,
      queryType: '0',
      group: { filter: q.group || '/.*/' },
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
  console.log('Testing candidates for advanced NOC KPIs...');

  // 1. UPS Battery Time Remaining & Status
  const upsRes = await queryGrafana([
    { group: 'UPS', item: '/(Battery|Estimated charge|time remaining)/' }
  ]);
  console.log('--- 1. UPS Battery Metrics ---');
  upsRes.results.A?.frames?.forEach(f => {
    const last = f.data.values[1].filter(x => x !== null).slice(-1)[0];
    console.log('  ', f.schema.name, '=>', last);
  });

  // 2. Switch errors / discards
  const netRes = await queryGrafana([
    { group: '/(switch|CORE)/', item: '/(errors|discards|discard|drop)/' }
  ]);
  console.log('\n--- 2. Switch Errors / Discards ---');
  console.log('Found frames:', netRes.results.A?.frames?.length || 0);
  netRes.results.A?.frames?.slice(0, 10).forEach(f => {
    const last = f.data.values[1].filter(x => x !== null).slice(-1)[0];
    console.log('  ', f.schema.name, '=>', last);
  });

  // 3. FortiGate VPN / Tunnel status
  const vpnRes = await queryGrafana([
    { group: 'FortiGate', item: '/(VPN|tunnel|IPsec|link|status)/' }
  ]);
  console.log('\n--- 3. FortiGate VPN / Tunnels ---');
  console.log('Found frames:', vpnRes.results.A?.frames?.length || 0);
  vpnRes.results.A?.frames?.slice(0, 10).forEach(f => {
    const last = f.data.values[1].filter(x => x !== null).slice(-1)[0];
    console.log('  ', f.schema.name, '=>', last);
  });

  // 4. SQL Server / Active Directory / Backup specific items
  const srvRes = await queryGrafana([
    { host: '/(SRO-SQL01|SRO-DCO01|SRO-BKP01)/', item: '/(service|status|state|sessions|connections|backup)/' }
  ]);
  console.log('\n--- 4. Critical Servers Services ---');
  console.log('Found frames:', srvRes.results.A?.frames?.length || 0);
  srvRes.results.A?.frames?.slice(0, 10).forEach(f => {
    const last = f.data.values[1].filter(x => x !== null).slice(-1)[0];
    console.log('  ', f.schema.name, '=>', last);
  });
}

run().catch(console.error);
