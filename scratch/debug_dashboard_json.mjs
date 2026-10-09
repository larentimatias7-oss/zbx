import fs from 'fs';

const d = JSON.parse(fs.readFileSync('dashboards/zabbix-matrixmax.json', 'utf8'));
const p15 = d.panels.find(p => p.id === 15);
const p10 = d.panels.find(p => p.id === 10);

console.log('Panel 15 Title:', p15.title);
console.log('Panel 10 Title:', p10.title);

// Search for 10790
const c = p15.options.content;
const start = c.indexOf('data-name="sro-sip01"');
const end = c.indexOf('</tr>', start);
console.log('--- ENTIRE SRO-SIP01 ROW IN P15 ---');
console.log(c.slice(start - 20, end + 5));

