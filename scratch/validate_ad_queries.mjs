import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}
const d = JSON.parse(fs.readFileSync('.zabbix_context/dashboards/milicic-activedirectory-soc.json', 'utf8'));

const allQueries = [];
d.panels.forEach(p => {
  if (p.targets) {
    p.targets.forEach((t, idx) => {
      if (t.queryType === '0') {
        const copy = JSON.parse(JSON.stringify(t));
        copy.host = { filter: 'SRO-DCO01' };
        copy.refId = 'P' + p.id + '_' + (t.refId || idx);
        copy.datasource = { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' };
        allQueries.push({ panel: p.title, query: copy });
      }
    });
  }
});

console.log('Total numeric metric queries to validate:', allQueries.length);

const testBatch = async (batch) => {
  const payload = JSON.stringify({
    queries: batch.map(b => b.query),
    from: String(Date.now() - 3600000),
    to: String(Date.now())
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
          batch.forEach(item => {
            const resData = data.results && data.results[item.query.refId];
            const hasData = resData && resData.frames && resData.frames.length > 0 && resData.frames[0].data?.values?.[0]?.length > 0;
            console.log(`[${hasData ? 'OK' : 'NO_DATA'}] Panel "${item.panel}" (item: "${item.query.item.filter}")`);
          });
        } catch(e) {
          console.log('Error in batch:', e.message);
        }
        resolve();
      });
    });
    req.write(payload);
    req.end();
  });
};

for (let i = 0; i < allQueries.length; i += 10) {
  await testBatch(allQueries.slice(i, i + 10));
}
