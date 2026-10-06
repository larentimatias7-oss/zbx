import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

http.get('http://172.27.210.154:3005/public/plugins/alexanderzobnin-zabbix-triggers-panel/module.js', {
  headers: { Authorization: `Bearer ${token}` }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    // Search for how queries are formed or what methods are called on datasource
    const terms = ['getProblems', 'showProblems', 'getTriggers', 'queryType'];
    for (const term of terms) {
      let idx = 0;
      let count = 0;
      while ((idx = d.indexOf(term, idx)) !== -1 && count < 3) {
        console.log(`=== Term "${term}" at ${idx} ===`);
        console.log(d.substring(Math.max(0, idx - 100), Math.min(d.length, idx + 200)));
        idx += term.length;
        count++;
      }
    }
  });
});
