import fs from 'fs';

function parseToolOutput(path) {
  let content = fs.readFileSync(path, 'utf8');
  const lines = content.split('\n');
  const startIdx = lines.findIndex(l => l.trim() === '[');
  return JSON.parse(lines.slice(startIdx).join('\n'));
}

const hosts = parseToolOutput('C:/Users/matias.larenti/.gemini/antigravity-ide/brain/cc9dd136-6a4b-4468-890d-48b93061f177/.system_generated/steps/984/output.txt');
const triggers = parseToolOutput('C:/Users/matias.larenti/.gemini/antigravity-ide/brain/cc9dd136-6a4b-4468-890d-48b93061f177/.system_generated/steps/998/output.txt');

console.log('Total hosts returned:', hosts.length);
console.log('Total active triggers:', triggers.length);

const enabledHosts = hosts.filter(h => h.status === '0');
console.log('Enabled hosts:', enabledHosts.length);

// Map triggers to hostid
const hostTriggers = {};
triggers.forEach(t => {
  const h = t.hosts?.[0];
  if (!h) return;
  if (!hostTriggers[h.hostid]) hostTriggers[h.hostid] = [];
  hostTriggers[h.hostid].push(t);
});

console.log('Hosts with at least one active problem:', Object.keys(hostTriggers).length);

function detectSede(h) {
  const name = (h.name || h.host || '').toUpperCase();
  const ip = h.interfaces?.[0]?.ip || '';
  
  if (name.includes('SSJ') || name.includes('SAN JUAN') || ip.startsWith('172.29.')) return 'SSJ';
  if (name.startsWith('FTG_AR-') || name.includes('OBRADOR') || name.includes('MINERA') || name.includes('CAMPAMENTO') || name.includes('VELADERO') || name.includes('JOSEMARIA') || name.includes('GUACOLDA') || name.includes('ACUEDUCTO') || name.includes('SAL DE VIDA') || name.includes('ALUMBRERA')) return 'OBRADOR';
  return 'SRO';
}

function detectTier(h) {
  const name = (h.name || h.host || '').toUpperCase();
  if (name.includes('CORE')) return 'Core';
  if (name.startsWith('FTG_')) return 'Perimeter';
  if (name.includes('DIS')) return 'Distribution';
  if (name.includes('ACC') || name.startsWith('SW ') || name.startsWith('AP ')) return 'Access';
  if (name.includes('STO') || name.includes('NAS')) return 'Storage';
  if (name.includes('SQL') || name.includes('SAPR')) return 'Database';
  if (name.includes('VCENTER') || name.includes('HPV')) return 'Virtualization';
  if (name.includes('UPS')) return 'Facilities';
  return 'Service';
}

const bySede = { SRO: [], SSJ: [], OBRADOR: [] };
enabledHosts.forEach(h => {
  const sede = detectSede(h);
  const tier = detectTier(h);
  const trs = hostTriggers[h.hostid] || [];
  bySede[sede].push({
    id: h.hostid,
    name: h.name || h.host,
    ip: h.interfaces?.[0]?.ip,
    tier,
    problemsCount: trs.length,
    maxPri: trs.length ? Math.max(...trs.map(t => parseInt(t.priority))) : 0,
    triggers: trs
  });
});

for (const [s, list] of Object.entries(bySede)) {
  console.log(`\n=== SEDE: ${s} (${list.length} hosts) ===`);
  list.forEach(item => {
    console.log(`  - [${item.id}] ${item.name} (${item.ip || 'no ip'}) [Tier: ${item.tier}] -> ${item.problemsCount} problems (max pri: ${item.maxPri})`);
    if (item.triggers.length > 0) {
      item.triggers.forEach(t => console.log(`      • [Pri ${t.priority}] ${t.description}`));
    }
  });
}

