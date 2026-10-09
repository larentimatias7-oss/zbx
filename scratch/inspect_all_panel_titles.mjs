import fs from 'fs';

const dash = JSON.parse(fs.readFileSync('./dashboards/noc-zabbix-command-center.json', 'utf8'));

dash.panels.forEach(p => {
  if (p.type === 'row') {
    console.log(`\n=== ROW: ${p.title} ===`);
  } else {
    const title = p.title || p.fieldConfig?.defaults?.displayName || '(Sin título)';
    const legend = p.options?.legend ? `${p.options.legend.displayMode} (${p.options.legend.placement})` : 'none';
    console.log(`[ID ${p.id}] ${title} | Tipo: ${p.type} | Legend: ${legend}`);
  }
});
