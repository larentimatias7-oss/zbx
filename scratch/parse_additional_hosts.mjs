import fs from 'fs';

const raw = fs.readFileSync('C:\\Users\\matias.larenti\\.gemini\\antigravity-ide\\brain\\6fbfee05-6baf-48cb-bcd2-b875fc8d47ee\\.system_generated\\steps\\3168\\output.txt', 'utf8');
const jsonStr = raw.replace(/^\[System:[^\]]+\]\s*/, '');
const items = JSON.parse(jsonStr);

const hostNames = {
  "10784": "SRO-SQL01",
  "10703": "SRO-BKP01",
  "10680": "vCenter",
  "10824": "JumpServer",
  "10084": "Zabbix server"
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
    const k = (it.key_ || '').toLowerCase();
    const n = (it.name || '').toLowerCase();
    if (k.includes('ping') || k.includes('cpu') || k.includes('uptime') || k.includes('memory') || k.includes('util') || n.includes('ping') || n.includes('cpu') || n.includes('memoria') || n.includes('uptime')) {
      console.log(`  - [${it.itemid}] ${it.name.padEnd(45)} | Key: "${it.key_}" | Val: "${it.lastvalue}" ${it.units || ''}`);
    }
  }
}
