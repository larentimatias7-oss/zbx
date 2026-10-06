import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

function topFunc(n = 5, agg = 'last') {
  return [
    {
      def: {
        name: 'top',
        category: 'Filter',
        params: [
          { name: 'number', type: 'int' },
          { name: 'value', type: 'string' }
        ]
      },
      params: [n, agg]
    }
  ];
}

async function testQuery(name, group, host, item, fn = topFunc(5, 'last')) {
  const now = Date.now();
  const payload = JSON.stringify({
    from: String(now - 900000),
    to: String(now),
    queries: [{
      refId: 'A',
      schema: 13,
      queryType: '0',
      group: { filter: group },
      host: { filter: host || '/.*/' },
      item: { filter: item },
      functions: fn,
      resultFormat: 'time_series',
      datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
    }]
  });

  const res = await new Promise((resolve) => {
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

  const frames = res.results.A.frames;
  console.log(`\n=== ${name} (frames: ${frames ? frames.length : 0}) ===`);
  if (frames) {
    frames.forEach(f => {
      const vals = f.data.values[1].filter(x => x !== null);
      const last = vals.length > 0 ? vals[vals.length - 1] : null;
      console.log(`  ${f.schema.name} => ${last}`);
    });
  } else {
    console.log('Error:', res.results.A?.error);
  }
}

async function run() {
  await testQuery('1. CPU (avg)', '/(Windows_Server|Linux servers|Virtual machines|Hypervisors|Storage_Server|Backup_Server|Zabbix servers|AD)/', '/.*/', '/^CPU utilization$/', topFunc(5, 'avg'));
  await testQuery('2. RAM (last)', '/(Windows_Server|Linux servers|Virtual machines|Hypervisors|Storage_Server|Backup_Server|Zabbix servers|AD)/', '/.*/', 'Memory utilization', topFunc(5, 'last'));
  await testQuery('3. DISK (last)', '/(Windows_Server|Linux servers|AD|Backup_Server|Storage_Server|Virtual machines)/', '/.*/', '/FS \\[.*(:\\)|\\/$)\\].*Space: Used, in %/', topFunc(5, 'last'));
  await testQuery('4. UPS LOAD (last)', 'UPS', '/.*/', '/^(UPS Load \\(%\\)|Output Load Estimated)$/', topFunc(5, 'last'));
  await testQuery('5. WAN LATENCY (last)', '/(FortiGate|ANTENAS P2P)/', '/.*/', 'ICMP response time', topFunc(5, 'last'));
  await testQuery('6. WAN BANDWIDTH (last)', 'FortiGate', '/.*/', '/Interface (port14|port15|wan|internet|claro|tasa|rosario|telecom).*: Bits received/', topFunc(5, 'last'));
  await testQuery('7. WAN LOSS (last)', '/(FortiGate|ANTENAS P2P)/', '/.*/', 'ICMP loss', topFunc(5, 'last'));
  await testQuery('8. STORAGE IOPS (last)', '/(Storage_Server|Storage)/', '/.*/', '/Disk group .*: IOPS, total rate/', topFunc(5, 'last'));
}

run().catch(console.error);
