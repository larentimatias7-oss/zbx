import fs from 'fs';

const content = fs.readFileSync('C:/Users/matias.larenti/.gemini/antigravity-ide/brain/6fbfee05-6baf-48cb-bcd2-b875fc8d47ee/.system_generated/steps/527/output.txt', 'utf8');
const lines = content.split('\n');
const startIdx = lines.findIndex(l => l.trim() === '[');
const logs = JSON.parse(lines.slice(startIdx).join('\n'));
logs.forEach(l => {
  const d = new Date(l.clock * 1000).toISOString();
  console.log(`[${d}] User: ${l.username} (${l.ip}) -> Action: ${l.action} on ${l.resourcename} (type: ${l.resourcetype})`);
});
