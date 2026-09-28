import { execSync } from 'child_process';
const token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
console.log('Token length:', token.length, 'starts with:', token.slice(0, 10));
