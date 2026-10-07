import fs from 'fs';

const raw = fs.readFileSync('.zabbix_context/dashboards/milicic-activedirectory-soc-live.json', 'utf8');
const d = JSON.parse(raw).dashboard;

console.log(`Title: ${d.title} | Panels count: ${d.panels.length}`);
const forensicPanels = d.panels.filter(p => p.id >= 50);
forensicPanels.forEach(p => {
  console.log(`ID ${p.id}: [${p.type.padEnd(8)}] "${p.title}" (x:${p.gridPos.x}, y:${p.gridPos.y}, w:${p.gridPos.w}, h:${p.gridPos.h})`);
  if (p.targets) {
    p.targets.forEach(t => {
      console.log(`    Ref: ${t.refId} | Item: "${t.item?.filter}" | Host: "${t.host?.filter}" | QueryType: ${t.queryType}`);
    });
  }
});
