import fs from 'fs';

const raw = fs.readFileSync('C:\\Users\\matias.larenti\\.gemini\\antigravity-ide\\brain\\6fbfee05-6baf-48cb-bcd2-b875fc8d47ee\\.system_generated\\steps\\3090\\output.txt', 'utf8');
const jsonStr = raw.replace(/^\[System:[^\]]+\]\s*/, '');
const images = JSON.parse(jsonStr);

console.log(`Total images: ${images.length}`);
const keywords = ['server', 'storage', 'ups', 'switch', 'router', 'firewall', 'satellite', 'cloud', 'rack', 'database'];

for (const kw of keywords) {
  console.log(`\n=== Iconos para '${kw}' ===`);
  const matches = images.filter(img => img.name.toLowerCase().includes(kw));
  for (const m of matches) {
    console.log(`  ID: ${m.imageid.padEnd(5)} | Name: "${m.name}"`);
  }
}
