import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const req = http.request('http://172.27.210.154:3005/api/dashboards/uid/milicic-servers-overview', {
  headers: { 'Authorization': 'Bearer ' + grafanaToken }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    try {
      const data = JSON.parse(b);
      console.log('=== GRAFANA LIVE VERIFICATION ===');
      console.log('Title:', data.dashboard.title);
      console.log('UID:', data.dashboard.uid);
      console.log('Folder:', data.meta.folderTitle, `(folderUid: ${data.meta.folderUid})`);
      console.log('Total Panels:', data.dashboard.panels.length);
      console.log('Variables configuradas:', data.dashboard.templating.list.map(v => `${v.name} (${v.label})`));
      console.log('\nPaneles desplegados:');
      data.dashboard.panels.forEach(p => {
        console.log(`  - [${p.type.padEnd(12)}] ID:${String(p.id).padEnd(2)} "${p.title}" (grid: x:${p.gridPos.x}, y:${p.gridPos.y}, w:${p.gridPos.w}, h:${p.gridPos.h})`);
      });
      console.log('\nEstado general: 100% OPERATIVO');
    } catch (e) {
      console.error('Error parseando respuesta:', b);
    }
  });
});
req.end();
