import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken || grafanaToken.length < 10) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

http.get({
  hostname: '172.27.210.154',
  port: 3005,
  path: '/api/dashboards/uid/milicic-sanjuan-infra',
  headers: { 'Authorization': 'Bearer ' + grafanaToken }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    try {
      const data = JSON.parse(d);
      console.log('Title:', data.dashboard.title);
      console.log('UID:', data.dashboard.uid);
      console.log('Templating variables:', (data.dashboard.templating?.list || []).map(v => ({ name: v.name, type: v.type, query: v.query })));
      console.log('Panels count:', data.dashboard.panels?.length);
      (data.dashboard.panels || []).forEach(p => {
        console.log(`- Panel ${p.id} [${p.type}] "${p.title}" (grid: ${JSON.stringify(p.gridPos)})`);
        if (p.targets) {
          p.targets.forEach(t => console.log(`    Target ${t.refId}: group=${JSON.stringify(t.group?.filter)} host=${JSON.stringify(t.host?.filter)} item=${JSON.stringify(t.item?.filter)}`));
        }
      });
    } catch(e) {
      console.error(e, d);
    }
  });
});
