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
    // Search for panel options migration, default options, schemaVersion, layout
    console.log("Searching for options in module.js...");
    const regexes = [
      /schemaVersion/g,
      /defaultPanelOptions/gi,
      /showTriggers/g,
      /sortProblems/g,
      /triggerSeverity/g,
      /queryType/g
    ];
    for (const r of regexes) {
      const match = d.match(r);
      console.log(`Pattern ${r}: found ${match ? match.length : 0}`);
    }

    // Extract default options or panel definition snippet
    const idx = d.indexOf('schemaVersion');
    if (idx !== -1) {
      console.log("Snippet around schemaVersion:");
      console.log(d.substring(idx - 200, idx + 400));
    }
  });
});
