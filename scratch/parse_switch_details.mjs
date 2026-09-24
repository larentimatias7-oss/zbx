import fs from 'fs';

const raw = fs.readFileSync('C:\\Users\\matias.larenti\\.gemini\\antigravity-ide\\brain\\6fbfee05-6baf-48cb-bcd2-b875fc8d47ee\\.system_generated\\steps\\3138\\output.txt', 'utf8');
const jsonStr = raw.replace(/^\[System:[^\]]+\]\s*/, '');
const items = JSON.parse(jsonStr);

function formatBps(val) {
  const n = parseFloat(val);
  if (isNaN(n) || n === 0) return '0 bps';
  if (n >= 1000000000) return (n / 1000000000).toFixed(2) + ' Gbps';
  if (n >= 1000000) return (n / 1000000).toFixed(2) + ' Mbps';
  if (n >= 1000) return (n / 1000).toFixed(2) + ' Kbps';
  return n.toFixed(0) + ' bps';
}

const hostNames = {
  "10711": "SRO-E01-P00-D01 (HP 2530)",
  "10726": "SRO-E03-P00-D03 (Aruba 1930 8G)",
  "10796": "SRO-E02-PB00-ACC01",
  "10797": "SW Ed Gris PB (ACC02)",
  "10800": "SRO-G01-P000-ACC2 (HP Comware)",
  "10803": "SRO-P2P-G06 (Ubiquiti)",
  "10820": "POR-P2P01 (Ubiquiti)",
  "10819": "UPS GALPON 01"
};

const byHost = {};
for (const it of items) {
  if (!it || !it.hostid) continue;
  if (!byHost[it.hostid]) byHost[it.hostid] = [];
  byHost[it.hostid].push(it);
}

for (const [hid, list] of Object.entries(byHost)) {
  console.log(`\n=================== ${hostNames[hid] || hid} (Total ${list.length} items) ===================`);
  for (const it of list) {
    console.log(`  - [${it.itemid}] ${it.name.padEnd(50)} | Key: "${it.key_}" | Val: "${it.lastvalue}" ${it.units || ''}`);
  }
}
