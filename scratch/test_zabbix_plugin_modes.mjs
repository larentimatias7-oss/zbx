import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const ds = { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' };

async function test(name, target) {
  const payload = JSON.stringify({
    queries: [{ refId: 'A', datasource: ds, schema: 12, ...target }],
    from: 'now-1h',
    to: 'now'
  });

  return new Promise(resolve => {
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
          const r = data.results?.A;
          console.log(`\n=== ${name} ===`);
          if (r?.error) {
            console.log('Error:', r.error);
          } else {
            const frames = r?.frames || [];
            console.log(`Frames: ${frames.length}`);
            frames.slice(0, 2).forEach((f, i) => {
              console.log(`Frame ${i}: name="${f.schema?.name}" fields=[${f.schema?.fields?.map(x => x.name).join(', ')}] rows=${f.data?.values?.[0]?.length || 0}`);
              if (f.data?.values?.[0]?.length > 0) {
                console.log('Sample row 0:', f.schema?.fields?.map((x, fi) => `${x.name}: ${f.data.values[fi][0]}`).join(' | '));
              }
            });
          }
        } catch (e) {
          console.log('Parse error:', e.message, b);
        }
        resolve();
      });
    });
    req.write(payload);
    req.end();
  });
}

async function run() {
  // Test queryType 4 with different modes
  await test('queryType 4, no mode', {
    queryType: '4',
    group: { filter: '/.*/' },
    host: { filter: '/.*/' },
    showProblems: 'problems',
    options: { minSeverity: 2, acknowledged: 2 }
  });

  await test('queryType 4, mode 0 (Triggers / Problems)', {
    queryType: '4',
    mode: 0,
    group: { filter: '/.*/' },
    host: { filter: '/.*/' },
    showProblems: 'problems',
    options: { minSeverity: 2, acknowledged: 2 }
  });

  await test('queryType 4, mode 1', {
    queryType: '4',
    mode: 1,
    group: { filter: '/.*/' },
    host: { filter: '/.*/' },
    showProblems: 'problems',
    options: { minSeverity: 2, acknowledged: 2 }
  });

  await test('queryType 4, mode 2', {
    queryType: '4',
    mode: 2,
    group: { filter: '/.*/' },
    host: { filter: '/.*/' },
    showProblems: 'problems',
    options: { minSeverity: 2, acknowledged: 2 }
  });

  await test('queryType 4, mode 3', {
    queryType: '4',
    mode: 3,
    group: { filter: '/.*/' },
    host: { filter: '/.*/' },
    showProblems: 'problems',
    options: { minSeverity: 2, acknowledged: 2 }
  });

  await test('queryType 4, mode 4 (Host Group Status)', {
    queryType: '4',
    mode: 4,
    group: { filter: '/.*/' },
    host: { filter: '/.*/' },
    showProblems: 'problems',
    options: { minSeverity: 2, acknowledged: 2 }
  });
}

run();
