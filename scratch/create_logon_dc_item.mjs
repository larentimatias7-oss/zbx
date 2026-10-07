process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
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
  console.log("=== 1. CHECK IF logon.dc ALREADY EXISTS ===");
  const existing = await zabbixApi("item.get", {
    filter: { key_: "logon.dc" },
    selectHosts: ["hostid", "host"]
  });
  console.log("Existing logon.dc items:", existing.result?.length);

  const dcs = [
    { hostid: '10699', host: 'SRO-DCO01', master: '83715' },
    { hostid: '10701', host: 'SRO-DCO02', master: '96713' },
    { hostid: '10715', host: 'SSJ-DCO01', master: '101380' }
  ];

  for (const dc of dcs) {
    const found = existing.result?.find(it => it.hosts[0].hostid === dc.hostid);
    if (!found) {
      console.log(`Creating logon.dc on ${dc.host}...`);
      const createRes = await zabbixApi("item.create", {
        hostid: dc.hostid,
        name: "Controlador de Dominio Fallo Logon",
        key_: "logon.dc",
        type: 18, // dependent
        master_itemid: dc.master,
        value_type: 4, // text
        history: "14d",
        preprocessing: [
          {
            type: "21", // JavaScript
            params: `return '${dc.host}';`,
            error_handler: "0",
            error_handler_params: ""
          }
        ]
      });
      console.log(`Created on ${dc.host}:`, createRes.result);
    } else {
      console.log(`logon.dc already exists on ${dc.host} (ID ${found.itemid})`);
    }
  }

  // Get itemid for logon.dc on SRO-DCO01
  const dco01Items = await zabbixApi("item.get", {
    hostids: ['10699'],
    filter: { key_: "logon.dc" }
  });
  const dcItemid = dco01Items.result[0]?.itemid;
  console.log("SRO-DCO01 logon.dc itemid:", dcItemid);

  // Get timestamps of logon.user history on SRO-DCO01
  const userHist = await zabbixApi("history.get", {
    itemids: ["104331"], // logon.user
    history: 4, // text
    limit: 100,
    sortfield: "clock",
    sortorder: "DESC"
  });
  console.log(`Fetched ${userHist.result.length} historical user failure events for SRO-DCO01`);

  // Check if history.push is available
  if (dcItemid && userHist.result.length > 0) {
    const samplePush = await zabbixApi("history.push", [
      {
        itemid: dcItemid,
        value: "SRO-DCO01",
        clock: userHist.result[0].clock,
        ns: userHist.result[0].ns
      }
    ]);
    console.log("history.push test response:", samplePush);
    if (samplePush.result && !samplePush.error) {
      console.log("history.push supported! Pushing all historical clocks for SRO-DCO01...");
      const batch = userHist.result.map(h => ({
        itemid: dcItemid,
        value: "SRO-DCO01",
        clock: h.clock,
        ns: h.ns
      }));
      const pushRes = await zabbixApi("history.push", batch);
      console.log("Pushed batch result:", pushRes.result);
    }
  }
}

main().catch(console.error);
