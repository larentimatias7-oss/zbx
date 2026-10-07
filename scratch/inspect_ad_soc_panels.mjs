import fs from 'fs';

const d = JSON.parse(fs.readFileSync('scratch/live_ad_soc.json', 'utf8'));

console.log('Title:', d.title);
console.log('Variables:', d.templating?.list?.map(v => `${v.name} (${v.type})`));
console.log('\n--- PANELS ---');
d.panels.forEach((p, idx) => {
  const rowInfo = p.type === 'row' ? '=== ROW ===' : `x:${p.gridPos.x}, y:${p.gridPos.y}, w:${p.gridPos.w}, h:${p.gridPos.h}`;
  console.log(`${idx + 1}. [ID: ${p.id}] [${p.type}] "${p.title}" | ${rowInfo}`);
});
