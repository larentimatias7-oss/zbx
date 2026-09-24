import fs from 'fs';

const raw = fs.readFileSync('C:\\Users\\matias.larenti\\.gemini\\antigravity-ide\\brain\\6fbfee05-6baf-48cb-bcd2-b875fc8d47ee\\.system_generated\\steps\\3108\\output.txt', 'utf8');
const jsonStr = raw.replace(/^\[System:[^\]]+\]\s*/, '');
const result = JSON.parse(jsonStr);

const map = result[0];
console.log(`=== MAP VERIFICATION ===`);
console.log(`ID: ${map.sysmapid} | Name: "${map.name}" | Size: ${map.width}x${map.height}`);
console.log(`Selements: ${map.selements?.length || 0}`);
console.log(`Links: ${map.links?.length || 0}`);
console.log(`Shapes: ${map.shapes?.length || 0}`);

console.log(`\n--- Macrozonas (Shapes) ---`);
for (const s of map.shapes) {
  console.log(`  - Shape [${s.x},${s.y} ${s.width}x${s.height}]: "${s.text}"`);
}

console.log(`\n--- Elementos de Hosts y Grupos (Selements) ---`);
for (const se of map.selements) {
  const elem = se.elements?.[0] || {};
  const target = elem.hostid ? `HostID: ${elem.hostid}` : `GroupID: ${elem.groupid}`;
  const labelFirstLine = se.label.split('\n')[0];
  console.log(`  - [ID: ${se.selementid.padEnd(3)}] at (${se.x},${se.y}) | ${target.padEnd(16)} | Label: "${labelFirstLine}"`);
}

console.log(`\n--- Links con Telemetría y Triggers ---`);
for (const l of map.links) {
  const trigs = l.linktriggers?.length || 0;
  console.log(`  - Link [${l.selementid1} <-> ${l.selementid2}] Color: ${l.color} | Triggers: ${trigs} | Label: "${l.label ? l.label.replace(/\n/g, ' | ') : 'None'}"`);
}
