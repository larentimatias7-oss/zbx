import fs from 'fs';

const raw = fs.readFileSync('C:/Users/matias.larenti/.gemini/antigravity-ide/brain/6fbfee05-6baf-48cb-bcd2-b875fc8d47ee/.system_generated/steps/2810/output.txt', 'utf8');
const lines = raw.split('\n').slice(1).join('\n');
const items = JSON.parse(lines);
console.log('Total items on SRO-DCO01:', items.length);

const types = { '0': 'NUM_FLOAT', '1': 'STR', '2': 'LOG', '3': 'NUM_UINT', '4': 'TEXT' };

items.forEach(i => {
  console.log(`[${types[i.value_type] || i.value_type}] [Status: ${i.status}] [ID: ${i.itemid}] "${i.name}" -> ${i.key_}`);
});
