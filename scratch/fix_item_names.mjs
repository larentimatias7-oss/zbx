import fs from 'fs';
import https from 'https';

const token = fs.readFileSync('C:\\ProgramData\\Milicic\\Zabbix\\codex_audit_token.bin', 'utf8').trim();

const updates = [
  { itemid: "104287", name: "Acción de Modificación de Grupo" },
  { itemid: "104288", name: "Operador de Modificación de Grupo" },
  { itemid: "104291", name: "Acción de Modificación de Grupo" },
  { itemid: "104292", name: "Operador de Modificación de Grupo" },
  { itemid: "104295", name: "Acción de Modificación de Grupo" },
];

function zabbixCall(method, params) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      jsonrpc: "2.0",
      method,
      params,
      auth: token,
      id: Date.now()
    });

    const req = https.request('https://zabbix.mlccnet.local/api_jsonrpc.php', {
      method: 'POST',
      rejectUnauthorized: false,
      headers: {
        'Content-Type': 'application/json-rpc',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(JSON.parse(b)));
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  for (const u of updates) {
    const res = await zabbixCall('item.update', u);
    console.log(`Updated ${u.itemid} (${u.name}):`, res.result || res.error);
  }
}

run();
