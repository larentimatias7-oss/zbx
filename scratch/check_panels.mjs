import fs from 'fs';

['milicic-soc-overview.json', 'milicic-sanjuan-infra.json', 'milicic-switches-core.json'].forEach(f => {
  try {
    const d = JSON.parse(fs.readFileSync('c:/zabbix_anti/.zabbix_context/dashboards/' + f, 'utf8'));
    console.log(`=== ${f} (${d.panels.length} panels) ===`);
    d.panels.forEach(p => {
      console.log(`  - ID: ${p.id} | Type: ${p.type.padEnd(16)} | Title: "${p.title}" | Grid: x=${p.gridPos.x}, y=${p.gridPos.y}, w=${p.gridPos.w}, h=${p.gridPos.h}`);
    });
  } catch (e) {
    console.error(f, e.message);
  }
});
