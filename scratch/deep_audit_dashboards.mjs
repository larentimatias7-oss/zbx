import fs from 'fs';
import path from 'path';

const files = fs.readdirSync('.zabbix_context/dashboards').filter(f => f.endsWith('.json'));

console.log(`Auditing ${files.length} dashboards from .zabbix_context/dashboards/...`);

files.forEach(file => {
  const filePath = path.join('.zabbix_context/dashboards', file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`\n======================================================`);
  console.log(`📊 Dashboard: "${data.title}" (${file}) [UID: ${data.uid}]`);
  console.log(`======================================================`);
  
  if (!data.panels) return;

  data.panels.forEach(p => {
    // 1. Status history check
    if (p.type === 'status-history') {
      console.log(`  ❌ [Panel ${p.id}] "${p.title}": type is 'status-history' -> RISK OF "Too many points" ERROR. Should be 'state-timeline'.`);
    }
    
    // 2. Table panel check with queryType 5 (problems)
    if (p.type === 'table' && p.targets && p.targets.some(t => t.queryType === '5')) {
      const hasExtract = p.transformations && p.transformations.some(tr => tr.id === 'extractFields');
      if (!hasExtract) {
        console.log(`  ⚠️  [Panel ${p.id}] "${p.title}": Problems table (queryType: 5) MISSING extractFields transformation! Will show raw JSON string.`);
      } else {
        console.log(`  ✅ [Panel ${p.id}] "${p.title}": Problems table correctly has extractFields transformation.`);
      }
    }

    // 3. Table panel with queryType 0 or 2 (metrics/text)
    if (p.type === 'table' && p.targets && p.targets.some(t => t.queryType === '0' || t.queryType === '2')) {
      const hasOrganize = p.transformations && p.transformations.some(tr => tr.id === 'organize');
      const excludesItem = hasOrganize && p.transformations.find(tr => tr.id === 'organize').options?.excludeByName?.Item;
      if (!excludesItem) {
        console.log(`  ℹ️  [Panel ${p.id}] "${p.title}": Table panel without 'Item' column exclusion (Item/Key may show in UI).`);
      }
    }

    // 4. Log items queried with queryType 0
    if (p.targets) {
      p.targets.forEach(t => {
        if (t.queryType === '0' && t.item && t.item.filter && /eventlog/i.test(t.item.filter)) {
          console.log(`  ❌ [Panel ${p.id}] "${p.title}": Target queries eventlog with queryType '0'! Should be '2' (Text).`);
        }
      });
    }
  });
});
