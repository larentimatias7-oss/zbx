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

async function checkOther4771() {
  const res = await zabbixRequest('history.get', {
    itemids: ['96738', '96739'], // Kerberos 4771 items
    history: 2, // log
    sortfield: 'clock',
    sortorder: 'DESC',
    limit: 100
  });

  const ipCount = {};
  const userCount = {};

  for (const row of (res.result || [])) {
    const ipMatch = row.value.match(/Client Address:\s*(?:::ffff:)?([0-9\.]+)/i);
    const userMatch = row.value.match(/Account Name:\s*([^\r\n]+)/i);
    const ip = ipMatch ? ipMatch[1].trim() : 'Unknown';
    const user = userMatch ? userMatch[1].trim() : 'Unknown';

    ipCount[ip] = (ipCount[ip] || 0) + 1;
    userCount[user] = (userCount[user] || 0) + 1;
  }

  console.log('--- TOP IPs WITH 4771 (KERBEROS PREAUTH FAILS) ---');
  console.table(Object.entries(ipCount).sort((a,b)=>b[1]-a[1]));

  console.log('--- TOP USERS ---');
  console.table(Object.entries(userCount).sort((a,b)=>b[1]-a[1]));
}

checkOther4771().catch(console.error);
