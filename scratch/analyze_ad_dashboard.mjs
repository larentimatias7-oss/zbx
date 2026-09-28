import fs from 'fs';

const data = JSON.parse(fs.readFileSync('c:/zabbix_anti/scratch/ad_dashboard_raw.json', 'utf8'));

console.log(`=== DASHBOARD GENERAL ANALYSIS ===`);
console.log(`Title: ${data.dashboard.title}`);
console.log(`Variables:`);
data.dashboard.templating.list.forEach(v => {
  console.log(`  - ${v.name} (${v.type}): query="${v.query}", current="${v.current.text}"`);
});

console.log(`\nRows & Panels:`);
let currentRow = "Root";
data.dashboard.panels.forEach(p => {
  if (p.type === 'row') {
    currentRow = p.title;
    console.log(`\n[ROW] ${currentRow}`);
  } else {
    const targets = (p.targets || []).map(t => `${t.refId}: host=${t.host?.filter}, item=${t.item?.filter}, qType=${t.queryType}`).join(' | ');
    console.log(`  Panel ${p.id} [${p.type}] "${p.title}" (w:${p.gridPos.w}, h:${p.gridPos.h}) -> timeFrom:${p.timeFrom || 'default'} -> ${targets}`);
  }
});
