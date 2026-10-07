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
  console.log('=== AUDITING LINK DOWN EVENTS IN THE LAST 7 DAYS ===');
  const now = Math.floor(Date.now() / 1000);
  const sevenDaysAgo = now - 7 * 86400;

  const events = await zabbixRequest('event.get', {
    time_from: sevenDaysAgo,
    search: { name: 'Link down' },
    output: ['eventid', 'name', 'severity', 'clock', 'objectid'],
    selectHosts: ['host', 'name'],
    limit: 1000
  });

  const switchPortCounts = {};
  for (const e of events.result || []) {
    const hostName = e.hosts && e.hosts[0] ? e.hosts[0].name : 'Unknown';
    const key = `${hostName} :: ${e.name}`;
    switchPortCounts[key] = (switchPortCounts[key] || 0) + 1;
  }

  const sorted = Object.entries(switchPortCounts).sort((a, b) => b[1] - a[1]);
  console.log('Top 15 Flapping Ports (Past 7d):');
  for (const [k, count] of sorted.slice(0, 15)) {
    console.log(`  ${count} caídas -> ${k}`);
  }
}

main().catch(console.error);
