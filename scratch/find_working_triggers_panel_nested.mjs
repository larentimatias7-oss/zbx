import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

http.get('http://172.27.210.154:3005/api/search?type=dash-db', {
  headers: { 'Authorization': 'Bearer ' + token }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', async () => {
    const list = JSON.parse(b);
    for (const d of list) {
      await new Promise(r => {
        http.get(`http://172.27.210.154:3005/api/dashboards/uid/${d.uid}`, {
          headers: { 'Authorization': 'Bearer ' + token }
        }, rres => {
          let db = '';
          rres.on('data', c => db += c);
          rres.on('end', () => {
            try {
              const dash = JSON.parse(db);
              const allPanels = [];
              dash.dashboard?.panels?.forEach(p => {
                allPanels.push(p);
                if (p.panels) allPanels.push(...p.panels);
              });
              const matches = allPanels.filter(p => p.type === 'alexanderzobnin-zabbix-triggers-panel');
              if (matches.length > 0) {
                console.log(`\n*** FOUND in "${d.title}" (${d.uid}): ${matches.length} panels ***`);
                console.log('Sample Panel:');
                console.log(JSON.stringify({
                  title: matches[0].title,
                  type: matches[0].type,
                  targets: matches[0].targets,
                  options: matches[0].options
                }, null, 2));
              }
            } catch {}
            r();
          });
        });
      });
    }
    console.log('Finished search.');
  });
});
