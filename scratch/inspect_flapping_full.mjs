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
  console.log('--- 1. HOST SRO-G01-P100-ACC01 ---');
  const hosts = await zabbixRequest('host.get', {
    filter: { host: 'SRO-G01-P100-ACC01' },
    selectGroups: ['groupid', 'name']
  });
  console.log('Host info:', JSON.stringify(hosts.result, null, 2));

  console.log('\n--- 2. ACTIVE PROBLEMS ON SRO-G01-P100-ACC01 ---');
  const problems = await zabbixRequest('problem.get', {
    hostids: hosts.result.map(h => h.hostid),
    output: 'extend'
  });
  console.log('Active problems:', JSON.stringify(problems.result, null, 2));

  console.log('\n--- 3. TRIGGER 35011 ---');
  const triggers = await zabbixRequest('trigger.get', {
    triggerids: ['35011'],
    output: 'extend'
  });
  console.log('Trigger 35011:', JSON.stringify(triggers.result, null, 2));
}

main().catch(console.error);
