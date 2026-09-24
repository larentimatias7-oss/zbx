import fs from 'fs';

const raw = fs.readFileSync('C:\\Users\\matias.larenti\\.gemini\\antigravity-ide\\brain\\6fbfee05-6baf-48cb-bcd2-b875fc8d47ee\\.system_generated\\steps\\3062\\output.txt', 'utf8');
const jsonStr = raw.replace(/^\[System:[^\]]+\]\s*/, '');
const items = JSON.parse(jsonStr);

const byHost = {};
for (const it of items) {
  if (!it || !it.hostid) continue;
  if (!byHost[it.hostid]) byHost[it.hostid] = [];
  byHost[it.hostid].push(it);
}

for (const [hid, list] of Object.entries(byHost)) {
  console.log(`\n=================== HOSTID: ${hid} (Total ${list.length} items) ===================`);
  for (const it of list.slice(0, 15)) {
    console.log(`  - [${it.itemid}] Key: "${it.key_}" | Name: "${it.name}" | Val: "${it.lastvalue}" ${it.units || ''}`);
  }
}
