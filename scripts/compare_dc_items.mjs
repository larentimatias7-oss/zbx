import fs from 'fs';
import http from 'http';

// Consulta MCP o JSON-RPC directo a Zabbix para verificar items de los 3 DCs
const mcpPayload = JSON.stringify({
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "item_get",
    arguments: {
      filter: {
        hostid: ["10699", "10701", "10715"]
      },
      output: ["itemid", "hostid", "name", "key_", "lastvalue", "status", "state"]
    }
  }
});

const req = http.request("http://127.0.0.1:8080/mcp", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream",
    "Authorization": "Bearer zmcp_6673ac9995fe59ae960e5597530912bdebdd76bbf56e6e1007ac6755a9eb545e",
    "Content-Length": Buffer.byteLength(mcpPayload)
  }
}, res => {
  let body = "";
  res.on("data", d => body += d);
  res.on("end", () => {
    try {
      const resp = JSON.parse(body);
      const text = resp.result.content[0].text;
      const lines = text.split('\n');
      const startIdx = lines.findIndex(l => l.trim() === '[');
      const items = JSON.parse(lines.slice(startIdx).join('\n'));
      
      const hostMap = { '10699': 'SRO-DCO01', '10701': 'SRO-DCO02', '10715': 'SSJ-DCO01' };
      const hosts = { '10699': [], '10701': [], '10715': [] };
      
      items.forEach(i => {
        if (hosts[i.hostid]) hosts[i.hostid].push(i);
      });
      
      Object.keys(hosts).forEach(hid => {
        console.log(`=== ${hostMap[hid]} (ID: ${hid}) Total Items: ${hosts[hid].length} ===`);
        const cpu = hosts[hid].find(i => i.key_ === 'system.cpu.util');
        const mem = hosts[hid].find(i => i.key_ === 'vm.memory.util');
        const uptime = hosts[hid].find(i => i.key_ === 'system.uptime');
        const ping = hosts[hid].find(i => i.key_ === 'icmpping');
        const diskC = hosts[hid].find(i => i.key_ && i.key_.includes('C:'));
        console.log(`  - CPU: ${cpu ? cpu.name + ' (' + cpu.lastvalue + '%)' : 'NO'}`);
        console.log(`  - Memoria: ${mem ? mem.name + ' (' + mem.lastvalue + '%)' : 'NO'}`);
        console.log(`  - Uptime: ${uptime ? uptime.name + ' (' + uptime.lastvalue + ')' : 'NO'}`);
        console.log(`  - Ping: ${ping ? ping.name + ' (' + ping.lastvalue + ')' : 'NO'}`);
        console.log(`  - Disco C: ${diskC ? diskC.name + ' (' + diskC.key_ + ' = ' + diskC.lastvalue + ')' : 'NO'}`);
      });
    } catch (e) {
      console.error('Error parsing:', e, body.slice(0, 300));
    }
  });
});

req.on("error", console.error);
req.write(mcpPayload);
req.end();
