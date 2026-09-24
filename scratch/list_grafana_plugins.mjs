import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const req = http.request('http://172.27.210.154:3005/api/plugins?embedded=0', {
  headers: { 'Authorization': 'Bearer ' + token }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    try {
      const plugins = JSON.parse(b);
      console.log('Total plugins en catálogo/instalados:', plugins.length);
      const installed = plugins.filter(p => p.installed);
      console.log(`Instalados (${installed.length}):`);
      installed.forEach(p => console.log(` [${p.type}] ${p.id} - ${p.name} (v${p.info?.version})`));
      
      const panels = plugins.filter(p => p.type === 'panel');
      console.log(`\nTodos los paneles soportados (${panels.length}):`);
      panels.forEach(p => console.log(` - ${p.id}: ${p.name}`));
    } catch(e) {
      console.log('Error:', b.slice(0, 300));
    }
  });
});
req.end();
