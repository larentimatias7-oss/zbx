import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const queries = [
  {
    name: "Panel 8: Perímetro FortiGates",
    query: {
      refId: 'A', schema: 12, queryType: '0',
      group: { filter: 'FortiGate' }, host: { filter: '/.*/' }, item: { filter: 'ICMP ping' },
      resultFormat: 'time_series'
    }
  },
  {
    name: "Panel 9A: Servidores ICMP",
    query: {
      refId: 'A', schema: 12, queryType: '0',
      group: { filter: '/(Windows_Server|Linux servers|Virtual machines|Hypervisors|Storage_Server|Backup_Server|AD|Datacenter|Applications)/' },
      host: { filter: '/.*/' }, item: { filter: 'ICMP ping' },
      resultFormat: 'time_series'
    }
  },
  {
    name: "Panel 9B: Servidores Agent Ping",
    query: {
      refId: 'B', schema: 12, queryType: '0',
      group: { filter: '/(Zabbix servers|Backup_Server|Applications)/' },
      host: { filter: '/(Zabbix server|SSJ-BKP01|SSJ-SVC01|JumpServer)/' },
      item: { filter: 'Zabbix agent ping' },
      resultFormat: 'time_series'
    }
  },
  {
    name: "Panel 10: Redes Switches & APs",
    query: {
      refId: 'A', schema: 12, queryType: '0',
      group: { filter: '/(switch|ARUBA APs|ANTENAS P2P)/' },
      host: { filter: '/.*/' }, item: { filter: 'ICMP ping' },
      resultFormat: 'time_series'
    }
  }
];

async function run() {
  for (const q of queries) {
    const payload = JSON.stringify({
      queries: [
        {
          datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
          ...q.query
        }
      ],
      from: 'now-15m',
      to: 'now'
    });

    await new Promise(resolve => {
      const req = http.request('http://172.27.210.154:3005/api/ds/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Length': Buffer.byteLength(payload)
        }
      }, res => {
        let b = '';
        res.on('data', d => b += d);
        res.on('end', () => {
          const json = JSON.parse(b);
          const frames = json.results?.[q.query.refId]?.frames || [];
          console.log(`=== ${q.name} ===`);
          console.log(`Total series returned: ${frames.length}`);
          const sample = frames.slice(0, 5).map(f => {
            const vals = f.data?.values?.[1] || [];
            const lastVal = vals[vals.length - 1];
            return `${f.schema?.name} = ${lastVal}`;
          });
          console.log(`Samples:`, sample.join(' | '));
          resolve();
        });
      });
      req.write(payload);
      req.end();
    });
  }
}

run();
