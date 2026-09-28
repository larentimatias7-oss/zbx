import { execSync } from 'child_process';

const token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();

async function main() {
  const r = await fetch('http://172.27.210.154:3005/api/frontend/settings', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const d = await r.json();
  console.log('Grafana buildInfo:', d.buildInfo?.version);
}
main();
