import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

http.get('http://172.27.210.154:3005/api/plugins', {
  headers: { 'Authorization': 'Bearer ' + grafanaToken }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    try {
      const plugins = JSON.parse(b);
      console.log(`Total plugins instalados: ${plugins.length}`);
      plugins.forEach(p => {
        console.log(`- [${p.type.padEnd(10)}] ${p.id.padEnd(35)} v${p.info?.version} (${p.name})`);
      });
    } catch (e) {
      console.error(b);
    }
  });
});
