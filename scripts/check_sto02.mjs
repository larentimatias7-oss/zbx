import fs from 'fs';

const content = fs.readFileSync('C:/Users/matias.larenti/.gemini/antigravity-ide/brain/6fbfee05-6baf-48cb-bcd2-b875fc8d47ee/.system_generated/steps/517/output.txt', 'utf8');
const lines = content.split('\n');
const startIdx = lines.findIndex(l => l.trim() === '[');
const items = JSON.parse(lines.slice(startIdx).join('\n'));

console.log('Total items on SRO-STO02:', items.length);
items.forEach(i => {
  const d = i.lastclock ? new Date(i.lastclock * 1000).toISOString() : 'never';
  console.log(`[${i.status == 0 ? 'ENABLED' : 'DISABLED'}] [${i.state == 0 ? 'SUPPORTED' : 'NOT_SUPPORTED'}] ${i.name} (${i.key_}) -> lastvalue: ${i.lastvalue} (at ${d}) ${i.error ? 'ERROR: ' + i.error : ''}`);
});
