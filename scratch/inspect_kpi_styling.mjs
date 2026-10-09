import fs from 'fs';

const dash = JSON.parse(fs.readFileSync('./dashboards/noc-zabbix-command-center.json', 'utf8'));
const kpiIds = [16, 3, 7, 4, 5, 2, 8, 9, 10, 11, 17, 28, 24];

for (const id of kpiIds) {
  const p = dash.panels.find(x => x.id === id);
  if (p) {
    console.log(`[ID ${p.id}] "${p.title}"`);
    console.log(`   Type: ${p.type} | textMode: ${p.options?.textMode} | colorMode: ${p.options?.colorMode} | graphMode: ${p.options?.graphMode}`);
    console.log(`   DisplayName: "${p.fieldConfig?.defaults?.displayName || ''}" | Unit: "${p.fieldConfig?.defaults?.unit || ''}"`);
    console.log(`   Description: "${p.description || ''}"`);
  }
}
