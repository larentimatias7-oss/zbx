import fs from 'fs';

const raw = fs.readFileSync('C:/Users/matias.larenti/.gemini/antigravity-ide/brain/6fbfee05-6baf-48cb-bcd2-b875fc8d47ee/.system_generated/steps/2828/output.txt', 'utf8');
const lines = raw.split('\n').slice(1).join('\n');
const triggers = JSON.parse(lines);
console.log('Total triggers on SRO-DCO01:', triggers.length);

triggers.forEach(t => {
  console.log(`[Sev: ${t.severity}] [Val: ${t.value}] [ID: ${t.triggerid}] "${t.description}" -> ${t.expression}`);
});
