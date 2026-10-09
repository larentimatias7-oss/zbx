import fs from 'fs';

const panels = JSON.parse(fs.readFileSync('./scratch/detailed_noc_panels.json', 'utf8'));

let currentSection = '';
let out = '';

for (let i = 0; i < panels.length; i++) {
  const p = panels[i];
  if (p.row !== currentSection) {
    currentSection = p.row;
    out += `\n======================================================\n`;
    out += `## ${currentSection}\n`;
    out += `======================================================\n\n`;
  }
  out += `### ${p.title} (ID: ${p.id})\n`;
  out += `- **Tipo:** \`${p.type}\`\n`;
  if (p.description) out += `- **Descripción:** ${p.description}\n`;
  if (p.unit) out += `- **Unidad:** \`${p.unit}\`\n`;
  if (p.thresholds && p.thresholds.steps) {
    const steps = p.thresholds.steps.map(s => `${s.value !== null ? s.value : 'Base'} -> ${s.color}`).join(' | ');
    out += `- **Umbrales:** ${steps}\n`;
  }
  if (p.mappings && p.mappings.length > 0) {
    out += `- **Mapeos de Valor:** ${JSON.stringify(p.mappings)}\n`;
  }
  out += `- **Métricas / Targets Zabbix:**\n`;
  p.targets.forEach(t => {
    out += `  * [queryType=${t.queryType}] Group: \`${t.group || '*'}\` | Host: \`${t.host || '*'}\` | Item: \`${t.item || '*'}\`\n`;
  });
  out += `\n`;
}

fs.writeFileSync('./scratch/panels_raw_dump.txt', out, 'utf8');
console.log('Saved to ./scratch/panels_raw_dump.txt. Total length:', out.length);
