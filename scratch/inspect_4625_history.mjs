process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import fs from 'fs';
import { execSync } from 'child_process';

const token = execSync('powershell.exe -NoProfile -Command "Add-Type -AssemblyName System.Security; $cipher = [IO.File]::ReadAllBytes(\'C:\\ProgramData\\Milicic\\Zabbix\\codex_audit_token.bin\'); $plain = [Security.Cryptography.ProtectedData]::Unprotect($cipher, [Text.Encoding]::UTF8.GetBytes(\'Milicic-Zabbix-Audit-v1\'), [Security.Cryptography.DataProtectionScope]::LocalMachine); [Text.Encoding]::UTF8.GetString($plain)"', { encoding: 'utf8' }).trim();

async function zabbixApi(method, params) {
  const payload = JSON.stringify({ jsonrpc: "2.0", method, params, auth: token, id: 1 });
  const res = await fetch("https://zabbix.mlccnet.local/api_jsonrpc.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload
  });
  return await res.json();
}

async function main() {
  const masterItems = await zabbixApi("item.get", {
    search: { key_: "eventlog[Security" },
    selectHosts: ["hostid", "host"],
    output: ["itemid", "name", "key_", "lastvalue", "lastclock", "status"]
  });
  console.log("Master items for eventlog[Security:");
  masterItems.result.forEach(m => {
    console.log(`${m.hosts[0].host} (ID ${m.itemid}): ${m.name} | ${m.key_} | status: ${m.status} | lastclock: ${new Date(m.lastclock*1000).toLocaleString()}`);
  });
}

main().catch(console.error);
