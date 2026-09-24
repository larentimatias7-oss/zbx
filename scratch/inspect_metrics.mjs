import http from 'http';

const token = 'zmcp_6673ac9995fe59ae960e5597530912bdebdd76bbf56e6e1007ac6755a9eb545e';

async function callZabbixMcp(toolName, args) {
  return new Promise((resolve, reject) => {
    const initPayload = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "inspector", version: "1.0" }
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
              const lines = callBody.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  resolve(JSON.parse(line.substring(6)));
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
          params: { name: toolName, arguments: args }
        }));
        callReq.end();
      });
    });

    initReq.write(initPayload);
    initReq.end();
  });
}

async function inspectHostItems(hostid, label) {
  const res = await callZabbixMcp("item_get", { hostids: [String(hostid)], output: "extend", filter: { status: "0" } });
  const text = res.result.content[0].text;
  const items = JSON.parse(text.replace(/\[System:[^\]]*\]\s*/g, ''));
  console.log(`\n=== HOST: ${label} (ID: ${hostid}) - Items Activos: ${items.length} ===`);
  items.slice(0, 25).forEach(it => {
    console.log(`  - [${it.key_}] ${it.name} (units: ${it.units || 'none'})`);
  });
}

async function main() {
  await inspectHostItems("10697", "FTG_milicic_border1_SNMP (FortiGate)");
  await inspectHostItems("10771", "FTG_ar-223-rio_tinto_SNMP (FortiGate Remote)");
  await inspectHostItems("10801", "UPS Edificio Gris PB");
  await inspectHostItems("10703", "SRO-BKP01 (Veeam Backup)");
  await inspectHostItems("10786", "SER-SAPR (SAP)");
}

main().catch(console.error);
