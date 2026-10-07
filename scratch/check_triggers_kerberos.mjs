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

async function checkKerberosTriggers() {
  const res = await zabbixRequest('trigger.get', {
    hostids: ['10699', '10701', '10715'],
    search: { description: 'Kerberos' },
    output: ['triggerid', 'description', 'expression', 'priority', 'status', 'value']
  });

  console.log('Triggers found:', res.result);
}

checkKerberosTriggers().catch(console.error);
