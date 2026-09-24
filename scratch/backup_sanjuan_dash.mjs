import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();

http.get({
  hostname: '172.27.210.154',
  port: 3005,
  path: '/api/dashboards/uid/milicic-sanjuan-infra',
  headers: { 'Authorization': 'Bearer ' + token }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    fs.writeFileSync('c:/zabbix_anti/scratch/backup_milicic_sanjuan_infra.json', d, 'utf8');
    console.log('✅ Backup of old San Juan dashboard saved to scratch/backup_milicic_sanjuan_infra.json');
  });
});
