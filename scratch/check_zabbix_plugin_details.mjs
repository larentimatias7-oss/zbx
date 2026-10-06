import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function check(path) {
  return new Promise(resolve => {
    http.get('http://172.27.210.154:3005' + path, {
      headers: { 'Authorization': 'Bearer ' + token }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          const data = JSON.parse(b);
          console.log(`\n=== GET ${path} === (Status: ${res.statusCode})`);
          console.log(JSON.stringify(data, null, 2).slice(0, 800));
        } catch {
          console.log(`\n=== GET ${path} === (Status: ${res.statusCode})`, b.slice(0, 300));
        }
        resolve();
      });
    });
  });
}

async function run() {
  await check('/api/plugins/alexanderzobnin-zabbix-app');
  await check('/api/plugins/alexanderzobnin-zabbix-triggers-panel');
  await check('/api/plugins/alexanderzobnin-zabbix-datasource');
}

run();
