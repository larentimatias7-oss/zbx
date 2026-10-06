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

async function testServerMatrix() {
  const srvGroup = '/(Windows_Server|Linux servers|AD|Backup_Server|Storage_Server|Virtual machines)/';
  console.log('Querying Servers for Ping, CPU, RAM and C: drive...');
  const res = await queryGrafana([
    { refId: 'Ping', group: srvGroup, item: 'ICMP ping' },
    { refId: 'CPU', group: srvGroup, item: '/^CPU utilization$/' },
    { refId: 'RAM', group: srvGroup, item: 'Memory utilization' },
    { refId: 'Disk', group: srvGroup, item: '/FS \\[.*(\\(C:\\)|\\/$)\\].*Space: Used, in %/' }
  ]);

  const map = new Map();
  function getHost(name) {
    const match = name.match(/^(.*?):/);
    return match ? match[1] : name;
  }

  res.results.A?.frames?.forEach(f => {
    const host = getHost(f.schema.name);
    const last = f.data.values[1].filter(x => x !== null).slice(-1)[0];
    if (!map.has(host)) map.set(host, {});
    map.get(host).ping = last;
  });

  res.results.B?.frames?.forEach(f => {
    const host = getHost(f.schema.name);
    const last = f.data.values[1].filter(x => x !== null).slice(-1)[0];
    if (!map.has(host)) map.set(host, {});
    map.get(host).cpu = last !== undefined ? last.toFixed(1) + '%' : '-';
  });

  res.results.C?.frames?.forEach(f => {
    const host = getHost(f.schema.name);
    const last = f.data.values[1].filter(x => x !== null).slice(-1)[0];
    if (!map.has(host)) map.set(host, {});
    map.get(host).ram = last !== undefined ? last.toFixed(1) + '%' : '-';
  });

  res.results.D?.frames?.forEach(f => {
    const host = getHost(f.schema.name);
    const last = f.data.values[1].filter(x => x !== null).slice(-1)[0];
    if (!map.has(host)) map.set(host, {});
    map.get(host).disk = last !== undefined ? last.toFixed(1) + '%' : '-';
  });

  console.log('\n=== MATRIZ DE SALUD DE SERVIDORES (CPU, RAM, DISCO) ===');
  console.log('Total servidores:', map.size);
  for (const [host, data] of map.entries()) {
    const status = data.ping === 1 ? 'OK' : 'DOWN';
    console.log(`- ${host.padEnd(16)} | Ping: ${status.padEnd(4)} | CPU: ${(data.cpu || '-').padEnd(7)} | RAM: ${(data.ram || '-').padEnd(7)} | Disco C: ${data.disk || '-'}`);
  }
}

testServerMatrix().catch(console.error);
