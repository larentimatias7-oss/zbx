import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function queryGrafana(q) {
  const now = Date.now();
  const payload = JSON.stringify({
    from: String(now - 3600000),
    to: String(now),
    queries: [{
      refId: 'A',
      schema: 12,
      queryType: '0',
      group: { filter: q.group || '/.*/' },
      host: { filter: q.host || '/.*/' },
      item: { filter: q.item },
      resultFormat: 'time_series',
      datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
    }]
  });

  return new Promise((resolve, reject) => {
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
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function processTop5(frames, regex, replacement, unitFn) {
  if (!frames || frames.length === 0) return [];
  const re = new RegExp(regex);
  const items = frames.map(f => {
    const raw = f.schema.name;
    const vals = f.data.values[1].filter(v => v !== null);
    const val = vals.length > 0 ? vals[vals.length - 1] : 0;
    const clean = raw.replace(re, replacement);
    return { clean, val };
  }).filter(x => !isNaN(x.val));
  items.sort((a, b) => b.val - a.val);
  return items.slice(0, 5).map(x => ({ ...x, display: unitFn ? unitFn(x.val) : x.val }));
}

async function testAll() {
  console.log('--- 1. CPU ---');
  let res = await queryGrafana({
    group: '/(Windows_Server|Linux servers|Virtual machines|Hypervisors|Storage_Server|Backup_Server|Zabbix servers|AD)/',
    item: '/^CPU utilization$/'
  });
  let top = processTop5(res.results.A.frames, '(.*):.*', '$1', v => v.toFixed(2) + '%');
  top.forEach(t => console.log(`  ${t.clean}: ${t.display}`));

  console.log('--- 2. RAM ---');
  res = await queryGrafana({
    group: '/(Windows_Server|Linux servers|Virtual machines|Hypervisors|Storage_Server|Backup_Server|Zabbix servers|AD)/',
    item: 'Memory utilization'
  });
  top = processTop5(res.results.A.frames, '(.*):.*', '$1', v => v.toFixed(1) + '%');
  top.forEach(t => console.log(`  ${t.clean}: ${t.display}`));

  console.log('--- 3. DISK ---');
  res = await queryGrafana({
    group: '/(Windows_Server|Linux servers|Virtual machines|Hypervisors|Storage_Server|Backup_Server|Zabbix servers|AD)/',
    item: '/FS \\[.*]: Space: Used, in %/'
  });
  top = processTop5(res.results.A.frames, '^(.*?):\\s*FS\\s*\\[(.*?)\\]:.*', '$1 [$2]', v => v.toFixed(1) + '%');
  top.forEach(t => console.log(`  ${t.clean}: ${t.display}`));

  console.log('--- 4. UPS LOAD ---');
  res = await queryGrafana({
    group: 'UPS',
    item: '/^(UPS Load \\(%\\)|Output Load Estimated)$/'
  });
  top = processTop5(res.results.A.frames, '(.*):.*', '$1', v => v.toFixed(1) + '%');
  top.forEach(t => console.log(`  ${t.clean}: ${t.display}`));

  console.log('--- 5. WAN LATENCY ---');
  res = await queryGrafana({
    group: '/(FortiGate|ANTENAS P2P)/',
    item: 'ICMP response time'
  });
  top = processTop5(res.results.A.frames, '^(FTG_|)(.*?)(_SNMP|):.*', '$2', v => (v * 1000).toFixed(1) + ' ms');
  top.forEach(t => console.log(`  ${t.clean}: ${t.display}`));

  console.log('--- 6. WAN BANDWIDTH ---');
  res = await queryGrafana({
    group: 'FortiGate',
    item: '/Interface (port14|port15|wan|internet|claro|tasa|rosario|telecom).*: Bits received/'
  });
  top = processTop5(res.results.A.frames, '^(?:FTG_)?(.*?)(?:_SNMP)?: Interface (.*?):.*', '$1 - $2', v => (v / 1000000).toFixed(1) + ' Mbps');
  top.forEach(t => console.log(`  ${t.clean}: ${t.display}`));

  console.log('--- 7. WAN PACKET LOSS ---');
  res = await queryGrafana({
    group: '/(FortiGate|ANTENAS P2P)/',
    item: 'ICMP loss'
  });
  top = processTop5(res.results.A.frames, '^(FTG_|)(.*?)(_SNMP|):.*', '$2', v => v.toFixed(1) + '%');
  top.forEach(t => console.log(`  ${t.clean}: ${t.display}`));

  console.log('--- 8. SAN STORAGE IOPS ---');
  res = await queryGrafana({
    group: '/(Storage_Server|Storage)/',
    item: '/Disk group .*: IOPS, total rate/'
  });
  top = processTop5(res.results.A.frames, '^(.*?): Disk group \\[(.*?)\\]:.*', '$1 - $2', v => v.toFixed(0) + ' IOPS');
  top.forEach(t => console.log(`  ${t.clean}: ${t.display}`));
}

testAll().catch(console.error);
