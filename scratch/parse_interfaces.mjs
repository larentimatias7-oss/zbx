import fs from 'fs';

const raw = fs.readFileSync('C:\\Users\\matias.larenti\\.gemini\\antigravity-ide\\brain\\6fbfee05-6baf-48cb-bcd2-b875fc8d47ee\\.system_generated\\steps\\3122\\output.txt', 'utf8');
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

const byHost = {};
for (const it of items) {
  if (!it || !it.hostid) continue;
  if (!byHost[it.hostid]) byHost[it.hostid] = [];
  byHost[it.hostid].push(it);
}

const hostNames = {
  "10708": "SRO-E02-PB00-CORE01 (Dell N4032)",
  "10722": "SRO-E02-PB00-CORE02 (Dell N4032)",
  "10724": "SRO-E02-PB00-CORE03 (Aruba 1930 48G)",
  "10726": "SRO-E03-P00-D03 (Aruba 1930 8G)",
  "10799": "SRO-G01-P100-DIS01 (HP Comware)",
  "10798": "SRO-G01-P100-ACC01 (HP Comware)",
  "10800": "SRO-G01-P000-ACC2 (HP Comware)",
  "10711": "SRO-E01-P00-D01 (HP 2530)",
  "10796": "SRO-E02-PB00-ACC01",
  "10797": "SW Ed Gris PB (ACC02)",
  "10803": "SRO-P2P-G06",
  "10820": "POR-P2P01",
  "10819": "UPS GALPON 01"
};

for (const [hid, list] of Object.entries(byHost)) {
  console.log(`\n=================== ${hostNames[hid] || hid} (Total ${list.length} traffic items) ===================`);
  for (const it of list) {
    if (!it.key_) continue;
    if (it.key_.startsWith('net.if.in[') || it.key_.startsWith('net.if.out[')) {
      console.log(`  - [${it.itemid}] ${it.name.padEnd(55)} | Key: ${it.key_.padEnd(35)} | Val: ${formatBps(it.lastvalue)}`);
    }
  }
}
