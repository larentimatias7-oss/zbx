import http from 'http';
import { execSync } from 'child_process';

const token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();

http.get({
  hostname: '172.27.210.154',
  port: 3005,
  path: '/api/dashboards/uid/milicic-activedirectory-soc-v2',
  headers: { 'Authorization': 'Bearer ' + token }
}, res => {
  let b = ''; res.on('data', c => b += c);
  res.on('end', () => {
    const data = JSON.parse(b);
    console.log('=== V2 DASHBOARD AUDIT ===');
    console.log('Title:', data.dashboard.title);
    console.log('UID:', data.dashboard.uid);
    console.log('Version:', data.dashboard.version);
    console.log('\n--- HIERARCHY OF SECTIONS AND PANELS ---');
    data.dashboard.panels.forEach(p => {
      if (p.type === 'row') {
        console.log(`\n📂 [ROW] ${p.title} (y: ${p.gridPos.y})`);
      } else {
        console.log(`   └─ [${p.type}] "${p.title}" | pos: (x:${p.gridPos.x}, y:${p.gridPos.y}, w:${p.gridPos.w}, h:${p.gridPos.h}) | desc: "${p.description?.slice(0, 60) || ''}..."`);
      }
    });
  });
});
