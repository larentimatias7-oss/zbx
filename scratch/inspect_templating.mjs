import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const uids = ['milicic-servers-overview', 'milicic-fortigate-sdwan', 'milicic-switches-core'];

for (const uid of uids) {
  http.get(`http://172.27.210.154:3005/api/dashboards/uid/${uid}`, {
    headers: { Authorization: `Bearer ${token}` }
  }, res => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      try {
        const json = JSON.parse(d);
        console.log(`\n=== TEMPLATING FOR ${json.dashboard?.title} (${uid}) ===`);
        console.log(JSON.stringify(json.dashboard?.templating?.list, null, 2));
      } catch (e) {
        console.error(e);
      }
    });
  });
}
