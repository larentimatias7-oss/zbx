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
  const updateRes = await zabbixRequest('trigger.update', {
    triggerid: '39507',
    expression: 'last(/SRO-DCO01/sec.kerberos_preauth.rate_1h) > 100 and length(last(/SRO-DCO01/kerberos.user)) >= 0 and length(last(/SRO-DCO01/kerberos.ip)) >= 0',
    recovery_mode: 1,
    recovery_expression: 'last(/SRO-DCO01/sec.kerberos_preauth.rate_1h) < 30',
    opdata: 'Usuario: {ITEM.LASTVALUE2} | IP: {ITEM.LASTVALUE3} | Tasa: {ITEM.LASTVALUE1}'
  });
  console.log('Update res:', updateRes);

  // Also update SRO-DCO02 and SSJ-DCO01
  await zabbixRequest('trigger.update', {
    triggerid: '39508',
    expression: 'last(/SRO-DCO02/sec.kerberos_preauth.rate_1h) > 100 and length(last(/SRO-DCO02/kerberos.user)) >= 0 and length(last(/SRO-DCO02/kerberos.ip)) >= 0',
    recovery_mode: 1,
    recovery_expression: 'last(/SRO-DCO02/sec.kerberos_preauth.rate_1h) < 30',
    opdata: 'Usuario: {ITEM.LASTVALUE2} | IP: {ITEM.LASTVALUE3} | Tasa: {ITEM.LASTVALUE1}'
  });

  await zabbixRequest('trigger.update', {
    triggerid: '39509',
    expression: 'last(/SSJ-DCO01/sec.kerberos_preauth.rate_1h) > 100 and length(last(/SSJ-DCO01/kerberos.user)) >= 0 and length(last(/SSJ-DCO01/kerberos.ip)) >= 0',
    recovery_mode: 1,
    recovery_expression: 'last(/SSJ-DCO01/sec.kerberos_preauth.rate_1h) < 30',
    opdata: 'Usuario: {ITEM.LASTVALUE2} | IP: {ITEM.LASTVALUE3} | Tasa: {ITEM.LASTVALUE1}'
  });

  const check = await zabbixRequest('trigger.get', {
    triggerids: ['39507', '39508', '39509'],
    output: ['triggerid', 'description', 'expression', 'opdata', 'value', 'lastchange']
  });
  console.log('Triggers now:', JSON.stringify(check.result, null, 2));
}

main().catch(console.error);
