import fs from 'fs';

const text = fs.readFileSync('C:/Users/matias.larenti/.gemini/antigravity-ide/brain/e67bbee2-130d-42e8-b9bf-e254d2fa5cbe/.system_generated/steps/1172/output.txt', 'utf8');
const jsonStart = text.indexOf('[\n  {');
const items = JSON.parse(text.slice(jsonStart));

console.log('Total items on FTG_milicic_border1_SNMP:', items.length);

const vpn = [];
const sessions = [];
const system = [];
const hardware = [];
const ifaces = [];

items.forEach(it => {
  const n = it.name;
  if (/vpn|tunnel|ipsec/i.test(n) || /vpn|tunnel|ipsec/i.test(it.key_)) vpn.push(it);
  else if (/session|connection/i.test(n) || /session|connection/i.test(it.key_)) sessions.push(it);
  else if (/cpu|memory|load|uptime/i.test(n)) system.push(it);
  else if (/sensor|fan|temp|psu|vol/i.test(n)) hardware.push(it);
  else if (/interface|bits|bytes|packet/i.test(n)) ifaces.push(it);
});

console.log('\n--- VPN ITEMS ---');
vpn.forEach(x => console.log(`  ${x.name} (key: ${x.key_}) => ${x.lastvalue} ${x.units}`));

console.log('\n--- SESSIONS ITEMS ---');
sessions.forEach(x => console.log(`  ${x.name} (key: ${x.key_}) => ${x.lastvalue} ${x.units}`));

console.log('\n--- SYSTEM ITEMS ---');
system.forEach(x => console.log(`  ${x.name} (key: ${x.key_}) => ${x.lastvalue} ${x.units}`));

console.log('\n--- HARDWARE & SENSORS ITEMS ---');
hardware.forEach(x => console.log(`  ${x.name} (key: ${x.key_}) => ${x.lastvalue} ${x.units}`));

console.log('\n--- SAMPLE INTERFACES ---');
ifaces.slice(0, 15).forEach(x => console.log(`  ${x.name} (key: ${x.key_}) => ${x.lastvalue} ${x.units}`));
