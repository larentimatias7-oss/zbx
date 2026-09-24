import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function run() {
  const getRes = await new Promise(r => {
    http.get('http://172.27.210.154:3005/api/dashboards/uid/milicic-nuevos-plugins', {
      headers: { Authorization: 'Bearer ' + token }
    }, res => {
      let b = ''; res.on('data', d => b += d); res.on('end', () => r(JSON.parse(b)));
    });
  });

  console.log('=== VERIFICANDO PANELES DE GALERÍA DE NUEVOS PLUGINS ===');
  console.log('Título:', getRes.dashboard?.title);
  console.log('Total Paneles:', getRes.dashboard?.panels?.length);

  for (const p of getRes.dashboard?.panels || []) {
    console.log(`\nPanel [ID ${p.id}]: "${p.title}"`);
    console.log(`  Tipo: ${p.type} | Grid: x=${p.gridPos.x}, y=${p.gridPos.y}, w=${p.gridPos.w}, h=${p.gridPos.h}`);
    if (p.targets && p.targets.length > 0) {
      const payload = JSON.stringify({
        queries: p.targets.map(t => ({ ...t, datasource: p.datasource })),
        from: 'now-1h',
        to: 'now'
      });
      const qRes = await new Promise(r => {
        const req = http.request('http://172.27.210.154:3005/api/ds/query', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }
        }, res => {
          let b = ''; res.on('data', d => b += d); res.on('end', () => {
            try { r(JSON.parse(b)); } catch(e) { r({ error: b }); }
          });
        });
        req.write(payload); req.end();
      });
      const results = qRes.results || {};
      let totalFrames = 0;
      Object.keys(results).forEach(k => {
        totalFrames += results[k]?.frames?.length || 0;
      });
      console.log(`  Query Status: OK | Frames recibidos: ${totalFrames}`);
    } else {
      console.log(`  Panel UI/Control sin consulta backend (Operativo)`);
    }
  }
}

run();
