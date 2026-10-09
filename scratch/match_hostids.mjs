import fs from 'fs';

const p = 'C:/Users/matias.larenti/.gemini/antigravity-ide/brain/cc9dd136-6a4b-4468-890d-48b93061f177/.system_generated/steps/875/output.txt';
const raw = fs.readFileSync(p, 'utf8');
const jsonStr = raw.substring(raw.indexOf('[' + '\n  {'));
const hosts = JSON.parse(jsonStr);

console.log('Total hosts fetched:', hosts.length);

const targetNames = [
  'AP PAÑOL',
  'FTG_ar-368-acueducto',
  'FTG_ar-376-veladero',
  'vCenter',
  'SRO-MDS01',
  'FTG_ar-ssj-predio',
  'FTG_milicic_border1',
  'FTG_ar-377-YPF',
  'FTG_ar-372-posco',
  'TP-LINK',
  'SRO-E02-PB00-ACC01',
  'SW Ed Gris PB',
  'SRO-G01-P100-DIS01',
  'SRO-SQL01',
  'SRO-SIP01',
  'SRO-FIL01',
  'SRO-APP02',
  'SRO-APP03',
  'SRO-DCO01',
  'SRO-DCO02',
  'SRO-SVC01',
  'UPS E02 PA',
  'SRO-E02-PB00-CORE01',
  'SRO-E02-PB00-CORE02',
  'SSJ-HPV01',
  'SRO-UPS-DC01'
];

const result = {};
targetNames.forEach(tn => {
  const match = hosts.find(h => 
    (h.host && h.host.toLowerCase().includes(tn.toLowerCase())) || 
    (h.name && h.name.toLowerCase().includes(tn.toLowerCase()))
  );
  if (match) {
    console.log(`"${tn}": { hostid: "${match.hostid}", host: "${match.host}" },`);
    result[tn] = { hostid: match.hostid, host: match.host };
  } else {
    console.log(`NO MATCH for "${tn}"`);
  }
});

fs.writeFileSync('scratch/host_matches.json', JSON.stringify(result, null, 2), 'utf8');
