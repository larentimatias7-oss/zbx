import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const payload = JSON.stringify({
  queries: [
    {
      refId: 'FLAP',
      datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
      queryType: '5',
      schema: 12,
      showProblems: 'problems',
      group: { filter: '/.*switch.*/' },
      host: { filter: '/.*/' },
      options: {
        minSeverity: 2,
        severities: [2, 3, 4, 5],
        sortProblems: 'priority'
      }
    }
  ],
  from: 'now-7d',
  to: 'now'
});

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
      const json = JSON.parse(b);
      const frames = json.results?.FLAP?.frames || [];
      console.log('Frames count:', frames.length);
      frames.forEach(f => {
        console.log('Schema fields:', f.schema.fields.map(x => x.name));
        const nameIdx = f.schema.fields.findIndex(x => x.name === 'name');
        const hostIdx = f.schema.fields.findIndex(x => x.name === 'hosts');
        if (nameIdx !== -1) {
          f.data.values[nameIdx].forEach((n, idx) => {
            console.log(`  Row ${idx}: Host: ${f.data.values[hostIdx]?.[idx]} | Name: ${n}`);
          });
        }
      });
    } catch(e) {
      console.error(b);
    }
  });
});
req.write(payload);
req.end();
