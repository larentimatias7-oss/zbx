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

async function testWanTable() {
  console.log('Querying all FortiGate sites for Ping, Latency, Loss and Sessions...');
  const res = await queryGrafana([
    { refId: 'Ping', group: 'FortiGate', item: 'ICMP ping' },
    { refId: 'Latency', group: 'FortiGate', item: 'ICMP response time' },
    { refId: 'Loss', group: 'FortiGate', item: 'ICMP loss' },
    { refId: 'Sessions', group: 'FortiGate', item: '/IPv4 Active sessions/' }
  ]);

  const map = new Map();

  function getHost(name) {
    const match = name.match(/^(?:FTG_)?(.*?)(?:_SNMP)?:/);
    return match ? match[1] : name;
  }

  // Ping
  res.results.A?.frames?.forEach(f => {
    const host = getHost(f.schema.name);
    const last = f.data.values[1].filter(x => x !== null).slice(-1)[0];
    if (!map.has(host)) map.set(host, {});
    map.get(host).ping = last;
  });

  // Latency
  res.results.B?.frames?.forEach(f => {
    const host = getHost(f.schema.name);
    const last = f.data.values[1].filter(x => x !== null).slice(-1)[0];
    if (!map.has(host)) map.set(host, {});
    map.get(host).latency = last !== undefined ? (last * 1000).toFixed(1) + ' ms' : '-';
  });

  // Loss
  res.results.C?.frames?.forEach(f => {
    const host = getHost(f.schema.name);
    const last = f.data.values[1].filter(x => x !== null).slice(-1)[0];
    if (!map.has(host)) map.set(host, {});
    map.get(host).loss = last !== undefined ? last.toFixed(0) + '%' : '-';
  });

  // Sessions
  res.results.D?.frames?.forEach(f => {
    const host = getHost(f.schema.name);
    const last = f.data.values[1].filter(x => x !== null).slice(-1)[0];
    if (!map.has(host)) map.set(host, {});
    map.get(host).sessions = last !== undefined ? last : '-';
  });

  console.log('\n=== MATRIZ WAN CONSOLIDADA DE SEDES (TELEMETRÍA CRUZADA) ===');
  console.log('Total sedes detectadas:', map.size);
  for (const [host, data] of map.entries()) {
    const status = data.ping === 1 ? 'ONLINE (1)' : 'OFFLINE (0)';
    console.log(`- ${host.padEnd(25)} | Estado: ${status.padEnd(12)} | Latencia: ${(data.latency || '-').padEnd(10)} | Pérdida: ${(data.loss || '-').padEnd(6)} | Sesiones: ${data.sessions}`);
  }
}

testWanTable().catch(console.error);
