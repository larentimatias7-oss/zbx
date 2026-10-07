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
  console.log('=== 1. AUDITING MOST FREQUENT ACTIVE & RESOLVED PROBLEMS (LAST 14 DAYS) ===');
  const now = Math.floor(Date.now() / 1000);
  const fourteenDaysAgo = now - 14 * 86400;

  const events = await zabbixRequest('event.get', {
    time_from: fourteenDaysAgo,
    value: '1', // Problem events
    output: ['eventid', 'name', 'severity', 'clock', 'objectid'],
    selectHosts: ['host', 'name'],
    limit: 1000
  });

  const nameCounts = {};
  const hostCounts = {};
  for (const e of events.result || []) {
    nameCounts[e.name] = (nameCounts[e.name] || 0) + 1;
    const h = e.hosts && e.hosts[0] ? e.hosts[0].name : 'Unknown';
    hostCounts[h] = (hostCounts[h] || 0) + 1;
  }

  const sortedProblems = Object.entries(nameCounts).sort((a, b) => b[1] - a[1]);
  console.log('Top 15 Problem Types (Past 14d):');
  console.log(sortedProblems.slice(0, 15));

  console.log('\nTop 10 Hosts with Most Events:');
  console.log(Object.entries(hostCounts).sort((a, b) => b[1] - a[1]).slice(0, 10));

  console.log('\n=== 2. AUDITING FAILED LOGONS (EVENT 4625) FORENSICS ===');
  // Let's inspect Event 4625 on SRO-DCO01 and SRO-DCO02
  const failedLogons = await zabbixRequest('history.get', {
    itemids: ['96736', '96737'], // Master 4625 eventlogs
    history: 2, // Log
    limit: 100,
    sortfield: 'clock',
    sortorder: 'DESC'
  });

  console.log('Sample 4625 log entries:', failedLogons.result?.length || 0);
  if (failedLogons.result && failedLogons.result.length > 0) {
    // Let's check most frequent failure reasons / substatus in 4625
    const reasons = {};
    const targetUsers = {};
    const callerComputers = {};
    for (const l of failedLogons.result) {
      const v = l.value;
      const userMatch = v.match(/Account For Which Logon Failed:[\s\S]*?Account Name:\s+([^\r\n]+)/) || v.match(/TargetUserName">([^<]+)/);
      const ipMatch = v.match(/Source Network Address:\s*([0-9\.]+)/) || v.match(/IpAddress">([^<]+)/);
      const subStatusMatch = v.match(/Sub Status:\s*(0x[0-9a-fA-F]+)/) || v.match(/SubStatus">([^<]+)/);

      if (userMatch) targetUsers[userMatch[1]] = (targetUsers[userMatch[1]] || 0) + 1;
      if (ipMatch) callerComputers[ipMatch[1]] = (callerComputers[ipMatch[1]] || 0) + 1;
      if (subStatusMatch) reasons[subStatusMatch[1]] = (reasons[subStatusMatch[1]] || 0) + 1;
    }
    console.log('Top 4625 Target Users:', Object.entries(targetUsers).sort((a, b) => b[1] - a[1]).slice(0, 10));
    console.log('Top 4625 Source IPs:', Object.entries(callerComputers).sort((a, b) => b[1] - a[1]).slice(0, 10));
    console.log('Top 4625 SubStatus codes:', Object.entries(reasons).sort((a, b) => b[1] - a[1]).slice(0, 10));
  }

  console.log('\n=== 3. AUDITING NETWORK INTERFACE DISCARDS / ERRORS ===');
  const errorItems = await zabbixRequest('item.get', {
    search: { key_: 'net.if.in.errors' },
    filter: { status: '0' },
    output: ['itemid', 'hostid', 'key_', 'name', 'lastvalue'],
    selectHosts: ['name'],
    limit: 50
  });
  const highErrors = errorItems.result?.filter(it => parseFloat(it.lastvalue) > 0) || [];
  console.log('Interfaces with input errors > 0:', highErrors.map(it => ({ host: it.hosts[0].name, if: it.name, val: it.lastvalue })));

  const discardItems = await zabbixRequest('item.get', {
    search: { key_: 'net.if.in.discards' },
    filter: { status: '0' },
    output: ['itemid', 'hostid', 'key_', 'name', 'lastvalue'],
    selectHosts: ['name'],
    limit: 50
  });
  const highDiscards = discardItems.result?.filter(it => parseFloat(it.lastvalue) > 100) || [];
  console.log('Interfaces with discards > 100:', highDiscards.slice(0, 10).map(it => ({ host: it.hosts[0].name, if: it.name, val: it.lastvalue })));
}

main().catch(console.error);
