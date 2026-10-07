import http from 'http';
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
  const res = await zabbixRequest('history.get', {
    itemids: ['83820', '83821', '96714', '96715'],
    history: 4,
    sortfield: 'clock',
    sortorder: 'DESC',
    limit: 30
  });

  const byClock = {};
  for (const row of res.result) {
    if (!byClock[row.clock]) {
      const d = new Date(row.clock * 1000);
      byClock[row.clock] = {
        clock: row.clock,
        date: d.toISOString().replace('T', ' ').substring(0, 19),
        dc: (row.itemid === '83820' || row.itemid === '83821') ? 'SRO-DCO01' : 'SRO-DCO02'
      };
    }
    if (row.itemid === '83820' || row.itemid === '96714') byClock[row.clock].user = row.value;
    if (row.itemid === '83821' || row.itemid === '96715') byClock[row.clock].pc = row.value;
  }

  console.table(Object.values(byClock));
}

main().catch(console.error);
