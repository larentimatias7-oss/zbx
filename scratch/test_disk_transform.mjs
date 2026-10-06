import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function testDiskTransforms() {
  const now = Date.now();
  const payload = JSON.stringify({
    from: String(now - 3600000),
    to: String(now),
    queries: [
      {
        refId: 'A',
        schema: 12,
        queryType: '0',
        group: { filter: '/(Windows_Server|Linux servers|AD|Backup_Server|Storage_Server|Virtual machines)/' },
        host: { filter: '/.*/' },
        item: { filter: '/FS \\[.*]: Space: Used, in %/' },
        resultFormat: 'time_series',
        datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
      }
    ]
  });

  const res = await new Promise((resolve, reject) => {
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

  const frames = res.results.A.frames;
  console.log(`Found ${frames.length} frames.`);
  
  // Sort by last value descending
  const list = frames.map(f => {
    const rawName = f.schema.name;
    const lastVal = f.data.values[1].filter(x => x !== null).slice(-1)[0] || 0;
    // Regex rename test
    // format is "HOST: FS [DRIVE]: Space: Used, in %"
    const match = rawName.match(/^(.*?):\s*FS\s*\[(.*?)\]/);
    const cleanName = match ? `${match[1]}: ${match[2]}` : rawName;
    return { rawName, cleanName, lastVal };
  }).sort((a, b) => b.lastVal - a.lastVal);

  console.log('TOP 5 DISKS:');
  list.slice(0, 5).forEach(x => console.log(`  ${x.cleanName} -> ${x.lastVal.toFixed(1)}%`));
}

testDiskTransforms().catch(console.error);
