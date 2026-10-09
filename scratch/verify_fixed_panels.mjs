import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function testQuery(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request('http://172.27.210.154:3005/api/ds/query', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(b) });
        } catch(e) {
          resolve({ status: res.statusCode, raw: b });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function getDashboard() {
  return new Promise((resolve, reject) => {
    http.get('http://172.27.210.154:3005/api/dashboards/uid/milicic-sla-executive-monthly', {
      headers: { 'Authorization': 'Bearer ' + token }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(JSON.parse(b)));
    }).on('error', reject);
  });
}

async function main() {
  const dashData = await getDashboard();
  const panels = dashData.dashboard.panels;
  console.log(`Retrieved dashboard: "${dashData.dashboard.title}" (Version ${dashData.dashboard.version})`);

  const p31 = panels.find(p => p.id === 31);
  const p40 = panels.find(p => p.id === 40);

  console.log('\n--- VERIFYING PANEL 31 (ITIL Severity Distribution) ---');
  console.log('Title:', p31.title);
  console.log('Datasource:', p31.datasource);
  const res31 = await testQuery({
    queries: p31.targets,
    from: 'now-30d',
    to: 'now'
  });
  console.log('Query status:', res31.status);
  const f31 = res31.body?.results?.A?.frames || [];
  console.log('Frames returned:', f31.length);
  f31.forEach(f => {
    console.log('Fields:', f.schema.fields.map(field => field.name));
    console.log('Values:', f.data.values);
  });

  console.log('\n--- VERIFYING PANEL 40 (Storage Capacity) ---');
  console.log('Title:', p40.title);
  console.log('Datasource:', p40.datasource);
  console.log('TimeFrom:', p40.timeFrom);
  const res40 = await testQuery({
    queries: p40.targets,
    from: 'now-1h',
    to: 'now'
  });
  console.log('Query status:', res40.status);
  ['A', 'B', 'C', 'D'].forEach(ref => {
    const f = res40.body?.results?.[ref]?.frames || [];
    console.log(`Target ${ref}: ${f.length} frames`);
    f.forEach(frame => {
      const host = frame.schema.fields[1]?.labels?.host;
      const item = frame.schema.fields[1]?.labels?.item;
      const lastVal = frame.data.values[1]?.slice(-1)[0];
      console.log(`   * [${host}] ${item} => ${lastVal ? lastVal.toFixed(1) + '%' : 'N/A'}`);
    });
  });
}

main().catch(console.error);
