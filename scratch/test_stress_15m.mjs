import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function test15mStress() {
  const now = Date.now();
  const from = String(now - 900000); // 15 minutes!
  const to = String(now);

  console.log('Sending 20 concurrent queries over 15m range...');
  const promises = [];

  for (let i = 0; i < 20; i++) {
    const payload = JSON.stringify({
      from,
      to,
      queries: [
        {
          refId: 'A',
          schema: 13,
          queryType: '0',
          group: { filter: '/.*/' },
          host: { filter: '/.*/' },
          item: { filter: i % 2 === 0 ? 'ICMP ping' : '/CPU utilization/' },
          resultFormat: 'time_series',
          datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
        }
      ]
    });

    promises.push(new Promise((resolve) => {
      const req = http.request({
        hostname: '172.27.210.154',
        port: 3005,
        path: `/api/ds/query?ds_type=alexanderzobnin-zabbix-datasource&requestId=STRESS_15M_${i}`,
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      }, res => {
        let b = '';
        res.on('data', c => b += c);
        res.on('end', () => resolve({ index: i, statusCode: res.statusCode }));
      });
      req.on('error', err => resolve({ index: i, error: err.message }));
      req.write(payload);
      req.end();
    }));
  }

  const results = await Promise.all(promises);
  const success = results.filter(r => r.statusCode === 200).length;
  const failed = results.filter(r => r.statusCode !== 200).length;
  console.log(`Results: ${success} successes, ${failed} failures.`);
}

test15mStress().catch(console.error);
