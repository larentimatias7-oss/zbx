import fs from 'fs';
const raw = fs.readFileSync('C:/Users/matias.larenti/.gemini/antigravity-ide/brain/6fbfee05-6baf-48cb-bcd2-b875fc8d47ee/.system_generated/steps/1745/output.txt', 'utf8');
const items = JSON.parse(raw.replace(/^\[System:.*?\n/, ''));
items.forEach((it, idx) => console.log(`[${idx+1}] ${it.name || 'unnamed'} || ${it.key_}`));
