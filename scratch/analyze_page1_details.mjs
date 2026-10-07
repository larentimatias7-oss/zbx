import fs from 'fs';

let content = fs.readFileSync('raw/dashboard-411.json', 'utf8').replace(/^\uFEFF/, '');
const raw = JSON.parse(content);
const d = raw.result[0];

for (let pIdx = 0; pIdx < 2; pIdx++) {
  const page = d.pages[pIdx];
  console.log(`================================================================`);
  console.log(`PAGE ${pIdx + 1}: "${page.name}" (Widgets: ${page.widgets.length})`);
  console.log(`================================================================`);
  
  page.widgets.forEach((w, wIdx) => {
    console.log(`\n[Widget ${wIdx + 1}] "${w.name || '(Sin título)'}"`);
    console.log(`  Tipo: ${w.type} | Posición: [x:${w.x}, y:${w.y}, w:${w.width}, h:${w.height}]`);
    
    const fieldMap = {};
    for (const f of w.fields) {
      if (!fieldMap[f.name]) fieldMap[f.name] = [];
      fieldMap[f.name].push(f.value);
    }
    
    for (const [k, v] of Object.entries(fieldMap)) {
      if (v.length === 1) {
        console.log(`  - ${k}: ${v[0]}`);
      } else {
        console.log(`  - ${k}: [${v.join(', ')}]`);
      }
    }
  });
  console.log('\n');
}
