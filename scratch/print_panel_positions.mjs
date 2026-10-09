import fs from 'fs';

const d = JSON.parse(fs.readFileSync('dashboards/zabbix-matrixmax.json', 'utf8'));
d.panels.forEach(p => {
  console.log(`ID: ${String(p.id).padEnd(4)} | Type: ${p.type.padEnd(30)} | y: ${String(p.gridPos.y).padEnd(3)} | h: ${String(p.gridPos.h).padEnd(3)} | Title: ${p.title}`);
});
