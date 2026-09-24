import http from 'http';

const token = 'zmcp_6673ac9995fe59ae960e5597530912bdebdd76bbf56e6e1007ac6755a9eb545e';

async function callZabbixMcp(method, toolName, args) {
  return new Promise((resolve, reject) => {
    // initialize session first
    const initPayload = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "inventory-agent", version: "1.0" }
      }
    });

    const initReq = http.request('http://127.0.0.1:8080/mcp', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      }
    }, res => {
      let initBody = '';
      res.on('data', c => initBody += c);
      res.on('end', () => {
        const sessionId = res.headers['mcp-session-id'];
        
        // Notify initialized
        const notifReq = http.request('http://127.0.0.1:8080/mcp', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json',
            'mcp-session-id': sessionId
          }
        });
        notifReq.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }));
        notifReq.end();

        // Call tool
        const callReq = http.request('http://127.0.0.1:8080/mcp', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
            'mcp-session-id': sessionId
          }
        }, callRes => {
          let callBody = '';
          callRes.on('data', c => callBody += c);
          callRes.on('end', () => {
            try {
              // Parse SSE lines or plain json
              const lines = callBody.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const parsed = JSON.parse(line.substring(6));
                  resolve(parsed);
                  return;
                }
              }
              resolve(JSON.parse(callBody));
            } catch(e) {
              reject(e);
            }
          });
        });

        callReq.write(JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: {
            name: toolName,
            arguments: args
          }
        }));
        callReq.end();
      });
    });

    initReq.write(initPayload);
    initReq.end();
  });
}

async function main() {
  const groupsRes = await callZabbixMcp("tools/call", "hostgroup_get", { output: "extend", real_hosts: true });
  console.log("=== HOST GROUPS IN ZABBIX ===");
  const text = groupsRes.result.content[0].text;
  try {
    const groups = JSON.parse(text.replace(/\[System:[^\]]*\]\s*/g, ''));
    groups.sort((a,b) => a.name.localeCompare(b.name)).forEach(g => console.log(`[${g.groupid}] ${g.name}`));
  } catch(e) {
    console.error("Parse error:", e.message, text);
  }

  const hostsRes = await callZabbixMcp("tools/call", "host_get", { output: "extend" });
  const hostsText = hostsRes.result.content[0].text;
  const hosts = JSON.parse(hostsText.replace(/\[System:[^\]]*\]\s*/g, ''));
  console.log(`\n=== TOTAL HOSTS: ${hosts.length} ===`);
  console.log("Sample host:", hosts[0]);
  hosts.forEach(h => {
    const displayName = String(h.name || h.host || h.hostid);
    const hostCode = String(h.host || '');
    console.log(`[${h.hostid}] ${displayName.padEnd(35)} (host: ${hostCode}, status: ${h.status == '0' ? 'MONITORED' : 'UNMONITORED'})`);
  });
}

main().catch(console.error);
