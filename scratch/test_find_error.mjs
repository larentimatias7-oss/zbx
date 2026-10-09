import fs from 'fs';

const content = fs.readFileSync('dashboards/zabbix-matrixmax.json', 'utf8');
const p15 = JSON.parse(content).panels.find(p => p.id === 15);
const html = p15.options.content;

const sipIdx = html.indexOf('SRO-SIP01');
console.log('SRO-SIP01 found at:', sipIdx);
if (sipIdx !== -1) {
  console.log('--- SNIPPET AROUND SRO-SIP01 ---');
  console.log(html.slice(sipIdx - 150, sipIdx + 800));
}
