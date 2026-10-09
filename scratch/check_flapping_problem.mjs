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
      schema: 13,
      group: { filter: '/.*/' },
      host: { filter: 'SRO-G01-P100-ACC01' },
      options: { minSeverity: 0, problems: 'all' }
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
      frames.forEach((f, i) => {
        console.log(`\nFrame ${i}:`);
        const fieldNames = f.schema.fields.map(x => x.name);
        console.log('Fields:', fieldNames);
        const nameIdx = fieldNames.indexOf('name');
        const hostIdx = fieldNames.indexOf('hosts');
        const sevIdx = fieldNames.indexOf('severity');
        const timeIdx = fieldNames.indexOf('timestamp');
        const grpIdx = fieldNames.indexOf('groups');
        if (nameIdx !== -1) {
          f.data.values[nameIdx].forEach((val, rowIdx) => {
            console.log(`  Row ${rowIdx}: [${f.data.values[sevIdx]?.[rowIdx]}] ${f.data.values[hostIdx]?.[rowIdx]} | ${val} | Group: ${JSON.stringify(f.data.values[grpIdx]?.[rowIdx])}`);
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
