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
  console.log('Testing Grafana DS query for Problems...');
  const queryPayload = {
    queries: [
      {
        refId: 'P',
        datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
        queryType: '5', // Problems
        schema: 12,
        group: { filter: '/.*/' },
        host: { filter: '/.*/' },
        application: { filter: '' },
        trigger: { filter: '' },
        options: {
          minSeverity: 3, // Average, High, Disaster
          problemFormat: 'table',
          showProblems: 'problems'
        }
      }
    ],
    from: 'now-30d',
    to: 'now'
  };

  const res = await grafanaRequest('POST', '/api/ds/query', queryPayload);
  console.log('Query response status:', res.status);
  if (res.data?.results?.P) {
    const frames = res.data.results.P.frames || [];
    console.log('Problem frames returned:', frames.length);
    if (frames.length > 0) {
      console.log('Fields:', frames[0].schema?.fields?.map(f => f.name));
      console.log('Rows count:', frames[0].data?.values?.[0]?.length);
    }
  } else {
    console.log('Response raw:', JSON.stringify(res.data).slice(0, 300));
  }
}

main().catch(console.error);
