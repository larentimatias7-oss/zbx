import fs from 'fs';
const dash = JSON.parse(fs.readFileSync('.zabbix_context/dashboards/backups/noc-zabbix-command-center-backup-v34.json', 'utf8'));
const p25 = dash.panels.find(p => p.id === 25);
console.log('Panel 25:', JSON.stringify(p25, null, 2));
