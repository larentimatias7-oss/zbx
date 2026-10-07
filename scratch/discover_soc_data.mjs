import fs from 'fs';

const text = fs.readFileSync('C:/Users/matias.larenti/.gemini/antigravity-ide/brain/e67bbee2-130d-42e8-b9bf-e254d2fa5cbe/.system_generated/steps/2092/output.txt', 'utf8');
const firstBracket = text.indexOf('[');
const secondBracket = text.indexOf('[', firstBracket + 1);
const json = JSON.parse(text.slice(secondBracket));

console.log('Total 4625 samples:', json.length);
json.slice(0, 2).forEach((e, idx) => {
  console.log(`\n=== 4625 Sample #${idx+1} | ${new Date(e.clock*1000).toLocaleString()} ===`);
  console.log(e.value);
});
