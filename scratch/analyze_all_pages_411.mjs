import fs from 'fs';

const raw = fs.readFileSync('raw/dashboard-411.json', 'utf8').replace(/^\uFEFF/, '');
const d = JSON.parse(raw).result[0];

console.log(`=== DASHBOARD 411: ${d.name} ===`);
console.log(`Total Pages: ${d.pages.length}\n`);

d.pages.forEach((p, idx) => {
  console.log(`Page ${idx + 1}: "${p.name}" (Widgets: ${p.widgets.length})`);
  p.widgets.forEach(w => {
    console.log(`  - [${w.type.padEnd(13)}] "${w.name || '(Sin título)'}"`);
    if (w.fields) {
      const items = w.fields.filter(f => f.name.includes('itemid'));
      if (items.length > 0) {
        console.log(`      Items: ${items.map(i => i.value).join(', ')}`);
      }
    }
  });
  console.log('');
});
