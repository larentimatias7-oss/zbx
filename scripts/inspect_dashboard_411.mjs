import fs from 'fs';

const content = fs.readFileSync('C:/Users/matias.larenti/.gemini/antigravity-ide/brain/6fbfee05-6baf-48cb-bcd2-b875fc8d47ee/.system_generated/steps/609/output.txt', 'utf8');
const lines = content.split('\n');
const startIdx = lines.findIndex(l => l.trim() === '[');
const dashboards = JSON.parse(lines.slice(startIdx).join('\n'));
const d = dashboards[0];
console.log('Dashboard ID:', d.dashboardid, '| Name:', d.name);
console.log('Pages count:', d.pages.length);
d.pages.forEach((p, idx) => {
  console.log(`Page ${idx+1}: "${p.name || 'unnamed'}" (widgets: ${p.widgets.length})`);
  p.widgets.forEach(w => {
    console.log(`   - Widget: "${w.name || 'no-name'}" [type: ${w.type}] at (${w.x}, ${w.y}) [${w.width}x${w.height}]`);
    if (w.fields && w.fields.length > 0) {
      console.log('     fields:', JSON.stringify(w.fields));
    }
  });
});
