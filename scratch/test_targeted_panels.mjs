import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function checkPanels(uid) {
  const getRes = await new Promise(r => {
    http.get('http://172.27.210.154:3005/api/dashboards/uid/' + uid, { headers: { Authorization: 'Bearer ' + token } }, res => {
      let b = ''; res.on('data', d => b += d); res.on('end', () => r(JSON.parse(b)));
    });
  });
  console.log('Dashboard:', uid, 'Total panels:', getRes.dashboard.panels.length);
  for (const p of getRes.dashboard.panels) {
    if (['grafana-polystat-panel', 'marcusolsson-treemap-panel', 'marcusolsson-hourly-heatmap-panel', 'marcusolsson-calendar-panel'].includes(p.type)) {
      console.log('  Testing Panel:', p.id, p.title, '(' + p.type + ')');
      const targets = p.targets.map(t => {
        const copy = JSON.parse(JSON.stringify(t));
        if (copy.host?.filter) {
          copy.host.filter = copy.host.filter.replace('${server:regex}', '.*');
        }
        return { ...copy, datasource: p.datasource };
      });
      const payload = JSON.stringify({
        queries: targets,
        from: 'now-1h',
        to: 'now'
      });
      const qRes = await new Promise(r => {
        const req = http.request('http://172.27.210.154:3005/api/ds/query', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }
        }, res => {
          let b = ''; res.on('data', d => b += d); res.on('end', () => r(JSON.parse(b)));
        });
        req.write(payload); req.end();
      });
      const results = qRes.results || {};
      let totalFrames = 0;
      Object.keys(results).forEach(k => {
        totalFrames += results[k]?.frames?.length || 0;
      });
      console.log('    Result frames:', totalFrames);
    }
  }
}

async function run() {
  await checkPanels('milicic-switches-core');
  await checkPanels('milicic-sanjuan-infra');
  await checkPanels('milicic-servers-overview');
}
run();
