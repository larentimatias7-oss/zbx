import fs from 'fs';

const raw = fs.readFileSync('C:\\Users\\matias.larenti\\.gemini\\antigravity-ide\\brain\\6fbfee05-6baf-48cb-bcd2-b875fc8d47ee\\.system_generated\\steps\\3048\\output.txt', 'utf8');

// Strip system prefix
const jsonStr = raw.replace(/^\[System:[^\]]+\]\s*/, '');
const hosts = JSON.parse(jsonStr);

console.log(`Total active hosts: ${hosts.length}`);
console.log("\n=== HOSTS LIST ===");
for (const h of hosts) {
  const ip = h.interfaces?.[0]?.ip || 'No IP';
  const grps = h.groups?.map(g => g.name).join(', ');
  console.log(`ID: ${h.hostid.padEnd(6)} | Name: ${h.name.padEnd(30)} | Host: ${h.host.padEnd(30)} | IP: ${ip.padEnd(15)} | Groups: ${grps}`);
}
