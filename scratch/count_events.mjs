import fs from 'fs';
import https from 'https';

const token = fs.readFileSync('C:\\ProgramData\\Milicic\\Zabbix\\codex_audit_token.bin', 'utf8').trim();

async function zabbixCall(method, params) {
  const body = JSON.stringify({
    jsonrpc: '2.0',
    method: method,
    params: params,
    auth: token,
    id: 1
  });

  return new Promise((resolve, reject) => {
    const req = https.request('https://zabbix.mlccnet.local/api_jsonrpc.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json-rpc',
        'Content-Length': Buffer.byteLength(body)
      },
      rejectUnauthorized: false
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        const parsed = JSON.parse(data);
        if (parsed.error) reject(parsed.error);
        else resolve(parsed.result);
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const now = Math.floor(Date.now() / 1000);
const from30d = now - 30 * 86400;
const from7d = now - 7 * 86400;

console.log('Now:', new Date(now * 1000).toISOString());
console.log('From 30d:', new Date(from30d * 1000).toISOString());

// 1. Get all eventlog items on DCs
const items = await zabbixCall('item.get', {
  filter: { host: ['SRO-DCO01', 'SRO-DCO02', 'SSJ-DCO01'] },
  search: { key_: 'eventlog' },
  output: ['itemid', 'name', 'key_', 'hostid', 'value_type']
});

console.log('\n--- Eventlog Items Found ---');
for (const it of items) {
  // Query history count in last 30d
  const hist30 = await zabbixCall('history.get', {
    history: parseInt(it.value_type),
    itemids: [it.itemid],
    time_from: from30d,
    time_till: now,
    countOutput: true
  });

  const hist7 = await zabbixCall('history.get', {
    history: parseInt(it.value_type),
    itemids: [it.itemid],
    time_from: from7d,
    time_till: now,
    countOutput: true
  });

  console.log(`Host: ${it.hostid === '10699' ? 'SRO-DCO01' : it.hostid === '10701' ? 'SRO-DCO02' : 'SSJ-DCO01'} | Item ${it.itemid} (${it.key_}): 7d = ${hist7} | 30d = ${hist30}`);
}
