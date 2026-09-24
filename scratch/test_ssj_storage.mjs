import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();

const tests = [
  { host: 'SSJ-HPV01', item: '/FS \\[.*\\]: Space: Used, in %/' },
  { host: 'SSJ-FIL01', item: '/FS \\[.*\\]: Space: Used, in %/' },
  { host: 'SSJ-BKP01', item: '/FS \\[.*\\]: Space: Used, in %/' },
  { host: 'SSJ-DCO01', item: '/FS \\[.*\\]: Space: Used, in %/' }
];

const queries = tests.map((t, idx) => ({
  refId: 'Q' + idx,
  datasource: { uid: 'efz4nzx8r30g0c', type: 'alexanderzobnin-zabbix-datasource' },
  schema: 12,
  queryType: '0',
  group: { filter: '/.*/' },
  host: { filter: t.host },
  item: { filter: t.item },
  resultFormat: 'time_series'
}));

const req = http.request({
  hostname: '172.27.210.154',
  port: 3005,
  path: '/api/ds/query',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const r = JSON.parse(d);
    tests.forEach((t, idx) => {
      const frames = r.results['Q' + idx]?.frames || [];
      console.log(t.host, 'frames:', frames.length);
      frames.forEach(f => {
        const valArr = f.data?.values?.[1] || [];
        console.log('  -', f.schema?.name, 'last:', valArr[valArr.length - 1]);
      });
    });
  });
});

req.write(JSON.stringify({ from: 'now-1h', to: 'now', queries }));
req.end();
