import https from 'https';
import { execSync } from 'child_process';

const ps = 'Add-Type -AssemblyName System.Security; $cipher = [IO.File]::ReadAllBytes(\'C:\\\\ProgramData\\\\Milicic\\\\Zabbix\\\\codex_audit_token.bin\'); $plainBytes = [Security.Cryptography.ProtectedData]::Unprotect($cipher, [Text.Encoding]::UTF8.GetBytes(\'Milicic-Zabbix-Audit-v1\'), [Security.Cryptography.DataProtectionScope]::LocalMachine); [Text.Encoding]::UTF8.GetString($plainBytes)';
const token = execSync('powershell.exe -NoProfile -Command \"' + ps + '\"', { encoding: 'utf8' }).trim();

async function zabbixRequest(method, params) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 });
    const req = https.request({
      hostname: 'zabbix.mlccnet.local',
      port: 443,
      path: '/api_jsonrpc.php',
      method: 'POST',
      rejectUnauthorized: false,
      headers: {
        'Content-Type': 'application/json-rpc',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('=== 1. INFORMACIÓN DEL TRIGGER 39513 ===');
  const trg = await zabbixRequest('trigger.get', {
    triggerids: ['39513'],
    selectItems: ['itemid', 'key_', 'name', 'lastvalue'],
    selectHosts: ['hostid', 'host', 'name'],
    output: 'extend'
  });
  console.log(JSON.stringify(trg.result, null, 2));

  console.log('\n=== 2. HISTORIAL RECIENTE DEL ITEM 81334 (ifOperStatus.49156) ===');
  const now = Math.floor(Date.now() / 1000);
  const history = await zabbixRequest('history.get', {
    itemids: ['81334'],
    time_from: now - (4 * 3600), // últimas 4 horas
    history: 3, // numeric unsigned
    sortfield: 'clock',
    sortorder: 'DESC',
    limit: 50
  });
  console.log(`Muestras en últimas 4h (${history.result.length}):`);
  history.result.forEach(h => {
    const d = new Date(h.clock * 1000).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
    const estado = h.value === '1' ? 'UP (1)' : (h.value === '2' ? 'DOWN (2)' : h.value);
    console.log(`  ${d} -> ${estado}`);
  });

  console.log('\n=== 3. DATOS DE INTERFAZ 1/0/4 (ALIAS, VELOCIDAD, ERRORES) ===');
  const items = await zabbixRequest('item.get', {
    hostids: ['10798'],
    search: { name: '1/0/4' },
    output: ['itemid', 'name', 'key_', 'lastvalue', 'lastclock']
  });
  console.log(JSON.stringify(items.result, null, 2));
}

main().catch(console.error);
