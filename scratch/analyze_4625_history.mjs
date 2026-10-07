import https from 'https';
import { execSync } from 'child_process';

const ps = `Add-Type -AssemblyName System.Security; $cipher = [IO.File]::ReadAllBytes('C:\\ProgramData\\Milicic\\Zabbix\\codex_audit_token.bin'); $plainBytes = [Security.Cryptography.ProtectedData]::Unprotect($cipher, [Text.Encoding]::UTF8.GetBytes('Milicic-Zabbix-Audit-v1'), [Security.Cryptography.DataProtectionScope]::LocalMachine); [Text.Encoding]::UTF8.GetString($plainBytes)`;
const token = execSync('powershell.exe -NoProfile -Command "' + ps + '"', { encoding: 'utf8' }).trim();

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
  // Query last 50 events from 83715 (DCO01) and 96713 (DCO02)
  const res = await zabbixRequest('history.get', {
    itemids: ['83715', '96713'],
    history: 2, // log
    sortfield: 'clock',
    sortorder: 'DESC',
    limit: 100
  });

  console.log(`Retrieved ${res.result.length} 4625 log events.`);

  const stats = {
    users: {},
    ips: {},
    reasons: {},
    logonTypes: {}
  };

  const parsedEvents = [];

  for (const log of res.result) {
    const text = log.value;
    // Extract target account
    // Account For Which Logon Failed: ... Account Name:\t\t<user>
    const userMatch = text.match(/Account For Which Logon Failed:[\s\S]*?Account Name:\s*([^\r\n]+)/i);
    const user = userMatch ? userMatch[1].trim() : 'Unknown';

    // Extract IP
    const ipMatch = text.match(/Source Network Address:\s*([^\r\n]+)/i);
    const ip = ipMatch ? ipMatch[1].trim() : 'Unknown';

    // Extract Workstation
    const wsMatch = text.match(/Workstation Name:\s*([^\r\n]+)/i);
    const ws = wsMatch ? wsMatch[1].trim() : '-';

    // Extract Failure Reason / SubStatus
    const statusMatch = text.match(/Sub Status:\s*([^\r\n]+)/i);
    const subStatus = statusMatch ? statusMatch[1].trim() : '-';

    // Extract Logon Type
    const typeMatch = text.match(/Logon Type:\s*([^\r\n]+)/i);
    const lType = typeMatch ? typeMatch[1].trim() : '-';

    stats.users[user] = (stats.users[user] || 0) + 1;
    stats.ips[ip] = (stats.ips[ip] || 0) + 1;
    stats.reasons[subStatus] = (stats.reasons[subStatus] || 0) + 1;
    stats.logonTypes[lType] = (stats.logonTypes[lType] || 0) + 1;

    parsedEvents.push({
      date: new Date(log.clock * 1000).toISOString().replace('T', ' ').substring(0, 19),
      user,
      ip,
      ws,
      subStatus,
      lType
    });
  }

  console.log('\n--- TOP TARGETED / FAILING USERS ---');
  console.table(Object.entries(stats.users).sort((a,b)=>b[1]-a[1]).slice(0, 10));

  console.log('\n--- TOP SOURCE IPS ---');
  console.table(Object.entries(stats.ips).sort((a,b)=>b[1]-a[1]).slice(0, 10));

  console.log('\n--- FAILURE CODES (Sub Status) ---');
  console.table(Object.entries(stats.reasons).sort((a,b)=>b[1]-a[1]));

  console.log('\n--- LAST 10 LOGON FAILURES ---');
  console.table(parsedEvents.slice(0, 10));
}

main().catch(console.error);
