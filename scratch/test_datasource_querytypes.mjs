import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function testQuery(name, q) {
  const payload = JSON.stringify({
    queries: [{
      ...q,
      datasource: {
        type: "alexanderzobnin-zabbix-datasource",
        uid: "efz4nzx8r30g0c"
      }
    }],
    from: "now-7d",
    to: "now"
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
        console.log(`\n=== [${name}] Status: ${res.statusCode} ===`);
        try {
          const data = JSON.parse(b);
          if (data.results) {
            for (const [k, v] of Object.entries(data.results)) {
              if (v.error) {
                console.log(`  ${k} ERROR:`, v.error);
              } else {
                console.log(`  ${k} OK, frames:`, (v.frames || []).length);
                if (v.frames && v.frames[0]) {
                  console.log(`    Fields:`, v.frames[0].schema?.fields?.map(f => f.name));
                  console.log(`    Row count:`, v.frames[0].data?.values?.[0]?.length);
                  if (v.frames[0].data?.values?.[0]?.length > 0) {
                    console.log(`    First val:`, v.frames[0].data.values.map(col => col[0]));
                  }
                }
              }
            }
          } else {
            console.log(b.slice(0, 200));
          }
        } catch(e) {
          console.log('Parse err:', b.slice(0, 200));
        }
        resolve();
      });
    });
    req.write(payload);
    req.end();
  });
}

async function main() {
  await testQuery('Problems query (queryType 1)', {
    refId: "A",
    queryType: "1",
    group: { filter: "AD" },
    host: { filter: "/.*/" },
    options: {
      minSeverity: 2,
      problems: "all"
    }
  });
}

main();
