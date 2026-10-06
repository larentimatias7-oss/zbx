import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

// Check items matching space utilization or disk utilization
const queries = [
  { name: "Windows/Linux FS utilization", filter: "/(space utilization|percentage of used space|Disk space utilization)/" },
  { name: "Storage pool / disk space", filter: "/(Pool.*space is low|Disk group.*space|space util|used.*percent)/" },
  { name: "All items with 'utilization' on Windows", group: "Windows_Server" },
  { name: "All items on Storage", group: "Storage_Server" }
];

async function checkItems(group, searchPattern) {
  const payload = JSON.stringify({
    queries: [{
      refId: 'A',
      datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
      schema: 12,
      queryType: '0',
      group: { filter: group },
      host: { filter: '/.*/' },
      item: { filter: searchPattern },
      resultFormat: 'time_series'
    }],
    from: 'now-15m',
    to: 'now'
  });

  return new Promise(resolve => {
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
        try {
          const json = JSON.parse(b);
          const frames = json.results?.A?.frames || [];
          console.log(`Group: ${group} | Pattern: ${searchPattern} -> Frames: ${frames.length}`);
          frames.slice(0, 10).forEach(f => {
            const vals = f.data?.values?.[1] || [];
            const lastVal = vals[vals.length - 1];
            console.log(`  - ${f.schema?.name} = ${lastVal}`);
          });
        } catch (e) {
          console.error(e);
        }
        resolve();
      });
    });
    req.write(payload);
    req.end();
  });
}

async function run() {
  await checkItems('Windows_Server', '/space utilization/');
  await checkItems('Linux servers', '/space utilization/');
  await checkItems('Storage_Server', '/.*/');
}

run();
