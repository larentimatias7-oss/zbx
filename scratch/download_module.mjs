import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const req = http.request('http://172.27.210.154:3005/public/plugins/alexanderzobnin-zabbix-datasource/module.js', {
  headers: { 'Authorization': 'Bearer ' + token }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    console.log('Module.js size:', b.length);
    fs.writeFileSync('scratch/zabbix_plugin_module.js', b);
    console.log('Saved to scratch/zabbix_plugin_module.js');
  });
});
req.end();
