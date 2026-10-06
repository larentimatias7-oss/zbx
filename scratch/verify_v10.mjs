import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

http.get('http://172.27.210.154:3005/api/dashboards/uid/noc-zabbix-command-center', {
  headers: { Authorization: `Bearer ${token}` }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const data = JSON.parse(d);
    console.log("Dashboard title:", data.dashboard.title, "Version:", data.dashboard.version);
    console.log("\nPanels summary:");
    data.dashboard.panels?.forEach(p => {
      console.log(`- Panel ID ${p.id} [${p.type}]: "${p.title}" (gridPos: x:${p.gridPos.x}, y:${p.gridPos.y}, w:${p.gridPos.w}, h:${p.gridPos.h})`);
      if (p.id === 12) {
        console.log("  Panel 12 options:", JSON.stringify({
          type: p.type,
          layout: p.options?.layout,
          hostField: p.options?.hostField,
          severityField: p.options?.severityField,
          showSearchFilter: p.options?.showSearchFilter,
          targetQueryType: p.targets?.[0]?.queryType
        }));
      }
    });
  });
});
