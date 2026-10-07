import fs from 'fs';

const src = fs.readFileSync('scratch/zabbix_plugin_module.js', 'utf8');

// Search for queryType or text query handling
const matches = [];
const regex = /queryType\s*===?\s*['"]?(\w+)['"]?/g;
let m;
while ((m = regex.exec(src)) !== null) {
  const start = Math.max(0, m.index - 100);
  const end = Math.min(src.length, m.index + 200);
  matches.push(src.slice(start, end));
}

console.log('Matches count:', matches.length);
matches.forEach((snippet, i) => {
  console.log(`\n--- Match #${i+1} ---`);
  console.log(snippet.replace(/\n/g, ' '));
});
