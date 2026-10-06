import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function searchDashboards() {
  const req = http.request('http://172.27.210.154:3005/api/search?type=dash-db', {
    headers: { 'Authorization': 'Bearer ' + token }
  }, res => {
    let b = '';
    res.on('data', c => b += c);
    res.on('end', async () => {
      const list = JSON.parse(b);
      console.log(`Searching across ${list.length} dashboards for alexanderzobnin-zabbix-triggers-panel...`);
      for (const d of list) {
        await checkDash(d.uid, d.title);
      }
    });
  });
  req.end();
}

function checkDash(uid, title) {
  return new Promise(resolve => {
    http.get(`http://172.27.210.154:3005/api/dashboards/uid/${uid}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          const dash = JSON.parse(b);
          const panels = dash.dashboard?.panels || [];
          const matches = panels.filter(p => p.type === 'alexanderzobnin-zabbix-triggers-panel');
          if (matches.length > 0) {
            console.log(`\n*** FOUND in "${title}" (uid: ${uid}): ${matches.length} panels ***`);
            matches.forEach(m => {
              console.log(`Panel "${m.title}":`);
              console.log(JSON.stringify({
                type: m.type,
                targets: m.targets,
                options: m.options
              }, null, 2));
            });
          }
        } catch {}
        resolve();
      });
    });
  });
}

searchDashboards();
