import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  try {
    token = execSync("powershell.exe -NoProfile -Command \"[System.Environment]::GetEnvironmentVariable('GRAFANA_SERVICE_ACCOUNT_TOKEN', 'User')\"", { encoding: 'utf8' }).trim();
  } catch (e) {}
}

const grafanaHost = '172.27.210.154';
const grafanaPort = 3005;

function grafanaRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = http.request({
      hostname: grafanaHost,
      port: grafanaPort,
      path: path,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(b) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: b });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('Testing Grafana DS query for storage items...');
  const queryPayload = {
    queries: [
      {
        refId: 'A',
        datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
        schema: 12,
        queryType: '0',
        group: { filter: '/.*/' },
        host: { filter: 'SRO-SQL01' },
        item: { filter: '/Space: Used, in %/' },
        options: { showDisabledItems: false }
      },
      {
        refId: 'B',
        datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
        schema: 12,
        queryType: '0',
        group: { filter: '/.*/' },
        host: { filter: 'SRO-APP03' },
        item: { filter: '/Space: Used, in %/' },
        options: { showDisabledItems: false }
      },
      {
        refId: 'C',
        datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
        schema: 12,
        queryType: '0',
        group: { filter: '/.*/' },
        host: { filter: 'SRO-FIL01' },
        item: { filter: '/Space: Used, in %/' },
        options: { showDisabledItems: false }
      }
    ],
    from: 'now-30d',
    to: 'now'
  };

  const res = await grafanaRequest('POST', '/api/ds/query', queryPayload);
  console.log('Query response status:', res.status);
  ['A', 'B', 'C'].forEach(ref => {
    const f = res.data?.results?.[ref]?.frames || [];
    console.log(`Ref ${ref}: ${f.length} frames returned`);
    f.forEach(fr => {
      console.log(`   - Name: "${fr.schema?.name}" | Last Value: ${fr.data?.values?.[1]?.slice(-1)[0]}`);
    });
  });
}

main().catch(console.error);
