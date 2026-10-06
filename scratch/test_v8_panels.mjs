import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const ds = { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' };

async function testQuery(name, target, from = 'now-15m', to = 'now') {
  const payload = JSON.stringify({
    queries: [{ refId: 'A', datasource: ds, schema: 12, ...target }],
    from,
    to
  });

  return new Promise((resolve) => {
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
          const data = JSON.parse(b);
          const r = data.results?.A;
          if (r?.error) {
            console.log(`[FAIL] ${name}: ${r.error}`);
          } else {
            const frames = r?.frames || [];
            console.log(`[OK] ${name}: ${frames.length} frames returned`);
            if (frames.length > 0) {
              const f = frames[0];
              console.log(`     Fields: ${f.schema?.fields?.map(x => x.name).join(', ')} (rows: ${f.data?.values?.[0]?.length || 0})`);
              if (frames.length > 1) {
                console.log(`     Sample frame names: ${frames.slice(0, 3).map(x => x.schema?.name).join(' | ')}`);
              }
            }
          }
        } catch (e) {
          console.log(`[ERR] ${name}: Parse error ${e.message}`);
        }
        resolve();
      });
    });
    req.on('error', err => {
      console.log(`[ERR] ${name}: ${err.message}`);
      resolve();
    });
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('=== VERIFICANDO QUERIES DE PANELES ===');
  
  // 1. Zabbix Server Ping
  await testQuery('Zabbix Server Ping', {
    queryType: '0',
    group: { filter: 'Zabbix servers' },
    host: { filter: 'Zabbix server' },
    item: { filter: 'Zabbix agent ping' },
    resultFormat: 'time_series'
  });

  // 2. All ping (Nodes count & Availability)
  await testQuery('All ping', {
    queryType: '0',
    group: { filter: '/.*/' },
    host: { filter: '/.*/' },
    item: { filter: '/(ICMP ping|agent.ping)/' },
    resultFormat: 'time_series',
    options: { showDisabledItems: false }
  });

  // 3. FortiGate Ping
  await testQuery('FortiGate Ping', {
    queryType: '0',
    group: { filter: 'FortiGate' },
    host: { filter: '/.*/' },
    item: { filter: 'ICMP ping' },
    resultFormat: 'time_series'
  });

  // 4. Servers Ping
  await testQuery('Servers Ping', {
    queryType: '0',
    group: { filter: '/(Zabbix servers|Datacenter|AD|Backup|Servers)/' },
    host: { filter: '/.*/' },
    item: { filter: '/(agent.ping|ICMP ping)/' },
    resultFormat: 'time_series'
  });

  // 5. Aruba APs & Switches Ping
  await testQuery('Aruba & Switches Ping', {
    queryType: '0',
    group: { filter: '/(ARUBA APs|switch)/' },
    host: { filter: '/.*/' },
    item: { filter: 'ICMP ping' },
    resultFormat: 'time_series'
  });

  // 6. UPS Voltage / Ping
  await testQuery('UPS Voltage', {
    queryType: '0',
    group: { filter: 'UPS' },
    host: { filter: '/.*/' },
    item: { filter: '/Ups Input Voltage/' },
    resultFormat: 'time_series'
  });

  // 7. CPU Utilization
  await testQuery('CPU Utilization', {
    queryType: '0',
    group: { filter: '/(Zabbix servers|Servers|Datacenter|FortiGate)/' },
    host: { filter: '/.*/' },
    item: { filter: '/(CPU utilization|CPU usage)/' },
    resultFormat: 'time_series'
  });

  // 8. UPS Load
  await testQuery('UPS Load', {
    queryType: '0',
    group: { filter: 'UPS' },
    host: { filter: '/.*/' },
    item: { filter: '/UPS Load/' },
    resultFormat: 'time_series'
  });

  // 9. FortiGate Active Sessions
  await testQuery('FortiGate Active Sessions', {
    queryType: '0',
    group: { filter: 'FortiGate' },
    host: { filter: '/.*/' },
    item: { filter: '/IPv4 Active sessions/' },
    resultFormat: 'time_series'
  });
}

run();
