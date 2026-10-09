import fs from 'fs';

const d = JSON.parse(fs.readFileSync('dashboards/zabbix-matrixmax.json', 'utf8'));
const p10 = d.panels.find(p => p.id === 10);
const c = p10.options.content;

const mWarn = c.match(/<a class="cell-tile warning"[^>]+>/);
console.log('Sample Warning Cell:\n', mWarn ? mWarn[0] : 'None');

const mDisaster = c.match(/<a class="cell-tile disaster"[^>]+>/);
console.log('\nSample Disaster Cell:\n', mDisaster ? mDisaster[0] : 'None');

const mHost = c.match(/<a class="td-host"[^>]+>/);
console.log('\nSample Host Link:\n', mHost ? mHost[0] : 'None');
