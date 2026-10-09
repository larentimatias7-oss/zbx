import fs from 'fs';

function parseToolOutput(path) {
  const content = fs.readFileSync(path, 'utf8');
  const lines = content.split('\n');
  const startIdx = lines.findIndex(l => l.trim() === '[');
  return JSON.parse(lines.slice(startIdx).join('\n'));
}

const items = parseToolOutput('C:/Users/matias.larenti/.gemini/antigravity-ide/brain/cc9dd136-6a4b-4468-890d-48b93061f177/.system_generated/steps/1177/output.txt');
console.log('vCenter items found:', items.length);
items.forEach(it => {
  console.log(`  - [ID: ${it.itemid}] Name: "${it.name}" | Key: "${it.key_}" | Units: "${it.units}" | Last: ${it.lastvalue}`);
});
