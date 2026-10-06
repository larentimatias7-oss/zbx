import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function testZabbixFunction(fnObj) {
  const now = Date.now();
  const payload = JSON.stringify({
    from: String(now - 900000),
    to: String(now),
    queries: [{
      refId: 'A',
      schema: 13,
      queryType: '0',
      group: { filter: '/(Windows_Server|Linux servers|AD|Backup_Server|Storage_Server|Virtual machines)/' },
      host: { filter: '/.*/' },
      item: { filter: '/FS \\[.*(:\\)|\\/$)\\].*Space: Used, in %/' },
      functions: fnObj,
      resultFormat: 'time_series',
      datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
    }]
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
  console.log('Testing top(5, "last") function in Zabbix query...');
  const res = await testZabbixFunction([
    {
      def: {
        name: 'top',
        category: 'Filter',
        params: [
          { name: 'number', type: 'int' },
          { name: 'value', type: 'string' }
        ]
      },
      params: [5, 'last']
    }
  ]);

  const frames = res.results.A.frames;
  console.log('Returned frames:', frames ? frames.length : 0);
  if (frames) {
    frames.forEach(f => {
      const vals = f.data.values[1].filter(x => x !== null);
      console.log('  ', f.schema.name, '=>', vals.slice(-1)[0]);
    });
  } else {
    console.log('Error / Result:', res.results.A);
  }
}

run().catch(console.error);
