import fs from 'fs';

const p = 'C:/Users/matias.larenti/.gemini/antigravity-ide/brain/cc9dd136-6a4b-4468-890d-48b93061f177/.system_generated/steps/875/output.txt';
const raw = fs.readFileSync(p, 'utf8');
const jsonStr = raw.substring(raw.indexOf('[' + '\n  {'));
const hosts = JSON.parse(jsonStr);

hosts.forEach(h => {
  console.log(`${h.hostid.padEnd(6)} | host: ${h.host.padEnd(35)} | name: ${h.name}`);
});
