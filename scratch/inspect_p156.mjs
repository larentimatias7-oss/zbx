import http from 'http';
import { execSync } from 'child_process';

const token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();

async function inspectPanelQuery() {
  const res = await new Promise((resolve) => {
    http.get({
      hostname: '172.27.210.154',
      port: 3005,
      path: '/api/dashboards/uid/noc-zabbix-command-center',
      headers: { 'Authorization': 'Bearer ' + token }
    }, r => {
      let b = ''; r.on('data', c => b += c);
      r.on('end', () => resolve(JSON.parse(b)));
    });
  });

  const p156 = res.dashboard.panels.find(p => p.id === 156);
  console.log('Panel 156 Title:', p156.title);
  console.log('Panel 156 Targets:', p156.targets.map(t => ({ refId: t.refId, host: t.host.filter, item: t.item.filter, format: t.resultFormat })));
  console.log('Panel 156 Transformations:', JSON.stringify(p156.transformations, null, 2));
}

inspectPanelQuery().catch(console.error);
