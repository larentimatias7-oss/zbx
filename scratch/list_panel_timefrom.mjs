import fs from 'fs';

const raw = fs.readFileSync('dashboards/noc-zabbix-command-center.json', 'utf8');
const dash = JSON.parse(raw);

console.log(`Total panels: ${dash.panels.length}`);
dash.panels.forEach(p => {
  console.log(`ID: ${p.id.toString().padEnd(3)} | Type: ${p.type.padEnd(12)} | timeFrom: ${(p.timeFrom || 'inherited').padEnd(10)} | Title: ${p.title || '(no title)'}`);
});
