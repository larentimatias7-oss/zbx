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

async function test4771Regex() {
  const res = await zabbixRequest('history.get', {
    itemids: ['96738'],
    history: 2,
    limit: 5
  });

  const reUser = /Account Information:[\s\S]*?Account Name:\s+([^\r\n]+)/;
  const reIp = /Client Address:\s*(?:::ffff:)?([0-9\.]+)/;
  const reCode = /Failure Code:\s+([^\r\n]+)/;

  console.log('Testing 4771 extraction:');
  for (const row of res.result) {
    const uMatch = row.value.match(reUser);
    const ipMatch = row.value.match(reIp);
    const cMatch = row.value.match(reCode);
    console.log({
      clock: row.clock,
      user: uMatch ? uMatch[1].trim() : 'FAIL',
      ip: ipMatch ? ipMatch[1].trim() : 'FAIL',
      code: cMatch ? cMatch[1].trim() : 'FAIL'
    });
  }
}

test4771Regex().catch(console.error);
