import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const payload = JSON.stringify({
  queries: [
    {
      refId: 'PROBLEMS',
      datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
      queryType: '5',
      schema: 12,
      group: { filter: '/.*/' },
      host: { filter: '/.*/' },
      showProblems: 'problems',
      options: {
        minSeverity: 2,
        severities: [2, 3, 4, 5],
        sortProblems: 'priority',
        useTimeRange: false
      }
    }
  ],
  from: 'now-1h',
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
      const frames = json.results?.PROBLEMS?.frames || [];
      console.log('Total frames:', frames.length);
      frames.forEach((f, i) => {
        const fieldNames = f.schema.fields.map(x => x.name);
        console.log(`Frame ${i} fields:`, fieldNames);
        const nameIdx = fieldNames.indexOf('name');
        const hostIdx = fieldNames.indexOf('hosts');
        const sevIdx = fieldNames.indexOf('severity');
        const grpIdx = fieldNames.indexOf('groups');
        const timeIdx = fieldNames.indexOf('timestamp');
        const count = f.data.values[0]?.length || 0;
        console.log(`Rows in frame ${i}:`, count);
        for (let r = 0; r < count; r++) {
          const h = f.data.values[hostIdx]?.[r];
          const n = f.data.values[nameIdx]?.[r];
          const s = f.data.values[sevIdx]?.[r];
          const g = f.data.values[grpIdx]?.[r];
          console.log(`  [Row ${r}] Host: "${h}" | Sev: ${s} | Problem: "${n}" | Groups: ${JSON.stringify(g)}`);
        }
      });
    } catch(e) {
      console.error('Error:', e, b);
    }
  });
});
req.write(payload);
req.end();
