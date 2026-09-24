import fs from 'fs';

const raw = fs.readFileSync('C:\\Users\\matias.larenti\\.gemini\\antigravity-ide\\brain\\6fbfee05-6baf-48cb-bcd2-b875fc8d47ee\\.system_generated\\steps\\3062\\output.txt', 'utf8');
const jsonStr = raw.replace(/^\[System:[^\]]+\]\s*/, '');
const items = JSON.parse(jsonStr);

for (const it of items) {
  if (it.hostid === "10724" || it.hostid === "10726") {
    if (!it.key_.startsWith('net.if.in.discards') && !it.key_.startsWith('net.if.out.discards')) {
      console.log(`[${it.hostid}] [${it.itemid}] Key: "${it.key_}" | Name: "${it.name}" | Val: "${it.lastvalue}" ${it.units || ''}`);
    }
  }
}
