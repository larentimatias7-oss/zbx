import fs from 'fs';

const dash = JSON.parse(fs.readFileSync('./dashboards/noc-zabbix-command-center.json', 'utf8'));

console.log('Title:', dash.title);
console.log('Description:', dash.description || 'Sin descripción');

let currentRow = 'General / Cabecera';
const rows = [];
let currentGroup = { row: currentRow, panels: [] };
rows.push(currentGroup);

dash.panels.forEach((p, idx) => {
  if (p.type === 'row') {
    currentRow = p.title;
    currentGroup = { row: currentRow, panels: [] };
    rows.push(currentGroup);
  } else {
    currentGroup.panels.push({
      id: p.id,
      title: p.title,
      type: p.type,
      description: p.description,
      gridPos: p.gridPos,
      fieldConfig: p.fieldConfig,
      options: p.options,
      targets: p.targets
    });
  }
});

for (const r of rows) {
  if (r.panels.length === 0) continue;
  console.log(`\n========================================`);
  console.log(`SECCIÓN: ${r.row} (${r.panels.length} paneles)`);
  console.log(`========================================`);
  for (const p of r.panels) {
    console.log(`\n[ID: ${p.id}] "${p.title}" (Tipo: ${p.type})`);
    if (p.description) console.log(`  Descripción: ${p.description}`);
    if (p.targets && p.targets.length > 0) {
      console.log(`  Targets (${p.targets.length}):`);
      p.targets.forEach((t, i) => {
        const qType = t.queryType !== undefined ? `queryType=${t.queryType}` : '';
        const grp = t.group?.filter || t.group || '';
        const hst = t.host?.filter || t.host || '';
        const itm = t.item?.filter || t.item || '';
        const mode = t.mode !== undefined ? `mode=${t.mode}` : '';
        console.log(`    - T${i+1}: [${qType} ${mode}] Group: "${grp}" | Host: "${hst}" | Item: "${itm}"`);
      });
    }
    // thresholds or unit
    const unit = p.fieldConfig?.defaults?.unit;
    const thresholds = p.fieldConfig?.defaults?.thresholds;
    if (unit) console.log(`  Unidad: ${unit}`);
    if (thresholds?.steps) {
      console.log(`  Thresholds:`, thresholds.steps.map(s => `${s.value ?? 'base'} -> ${s.color}`).join(', '));
    }
  }
}
