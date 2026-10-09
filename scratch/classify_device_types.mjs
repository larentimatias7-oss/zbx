import fs from 'fs';

function parseToolOutput(path) {
  const content = fs.readFileSync(path, 'utf8');
  const lines = content.split('\n');
  const startIdx = lines.findIndex(l => l.trim() === '[');
  return JSON.parse(lines.slice(startIdx).join('\n'));
}

const rawHosts = parseToolOutput('C:/Users/matias.larenti/.gemini/antigravity-ide/brain/cc9dd136-6a4b-4468-890d-48b93061f177/.system_generated/steps/984/output.txt');
const enabledHosts = rawHosts.filter(h => h.status === '0');

function classifyDeviceType(h) {
  const name = (h.name || h.host || '').toUpperCase();
  // 1. Firewalls / Perímetro / WAN
  if (name.startsWith('FTG_')) return 'firewall';
  // 2. Wireless / APs Aruba
  if (name.startsWith('AP ')) return 'wifi';
  // 3. Energía / UPS
  if (name.startsWith('UPS ')) return 'ups';
  // 4. Switches de Red / Conectividad
  if (name.includes('CORE') || name.includes('DIS01') || name.includes('ACC') || name.includes('SW ') || name.includes('SWADM') || name.includes('P2P') || name.includes('D03')) return 'switch';
  // 5. Almacenamiento & Virtualización
  if (name.includes('STO02') || name.includes('NAS01') || name.includes('VCENTER') || name.includes('HPV01') || name.startsWith('172.30.70.')) return 'storage';
  // 6. Bases de Datos & SAP Presea
  if (name.includes('SQL') || name.includes('SAPR') || name.includes('APP01') || name.includes('APP02') || name.includes('APP03') || name.includes('SLI-APP')) return 'database';
  // 7. Servidores Core & Dominio
  return 'server';
}

const byType = {};
enabledHosts.forEach(h => {
  const t = classifyDeviceType(h);
  if (!byType[t]) byType[t] = [];
  byType[t].push(h.name || h.host);
});

for (const [t, list] of Object.entries(byType)) {
  console.log(`\n=== TIPO: ${t.toUpperCase()} (${list.length} hosts) ===`);
  list.forEach(n => console.log('  -', n));
}
