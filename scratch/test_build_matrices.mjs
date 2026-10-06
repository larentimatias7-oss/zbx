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
  console.log('Testing SSL VPN Users query...');
  const vpn = await queryGrafana([
    { group: 'FortiGate', host: '/milicic_border1/', item: 'Active SSL VPN users' }
  ]);
  const vpnVal = vpn.results.A.frames?.[0]?.data?.values?.[1]?.slice(-1)[0];
  console.log('Active SSL VPN Users:', vpnVal);

  console.log('\nTesting WAN Traffic Trend query...');
  const wanTrend = await queryGrafana([
    {
      group: 'FortiGate',
      host: '/(milicic_border1|rio_tinto|sierra_grande|san_luis|YPF|lima)/',
      item: '/Interface (port14|port15|wan1|wan).*: Bits received/'
    }
  ]);
  console.log('WAN Trend series count:', wanTrend.results.A.frames?.length);
  wanTrend.results.A.frames?.forEach(f => {
    const last = f.data.values[1].filter(x => x !== null).slice(-1)[0];
    console.log('  ', f.schema.name, '=>', (last / 1000000).toFixed(1) + ' Mbps');
  });

  console.log('\nTesting UPS Battery Autonomy...');
  const upsBat = await queryGrafana([
    { group: 'UPS', host: '/.*/', item: 'Battery Time Remaining' }
  ]);
  upsBat.results.A.frames?.forEach(f => {
    const last = f.data.values[1].filter(x => x !== null).slice(-1)[0];
    console.log('  ', f.schema.name, '=>', last, 'minutos');
  });
}

run().catch(console.error);
