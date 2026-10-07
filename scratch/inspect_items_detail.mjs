import http from 'http';

function mcpCall(tool, args) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: {
        name: tool,
        arguments: args
      }
    });

    const req = http.request("http://127.0.0.1:8080/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "Authorization": "Bearer zmcp_6673ac9995fe59ae960e5597530912bdebdd76bbf56e6e1007ac6755a9eb545e",
        "Content-Length": Buffer.byteLength(payload)
      }
    }, res => {
      let b = "";
      res.on("data", d => b += d);
      res.on("end", () => {
        try {
          const resp = JSON.parse(b);
          if (resp.error) return reject(resp.error);
          const text = resp.result.content[0].text;
          const lines = text.split('\n');
          const startIdx = lines.findIndex(l => l.trim().startsWith('[') || l.trim().startsWith('{'));
          if (startIdx !== -1) {
            resolve(JSON.parse(lines.slice(startIdx).join('\n')));
          } else {
            resolve(text);
          }
        } catch (e) {
          reject(new Error(b.slice(0, 300)));
        }
      });
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  // 1. Get info on specific items: 83820, 83821, 96736, 96737
  console.log("=== ITEMS 83820, 83821, 96736, 96737 ===");
  const items = await mcpCall("item_get", {
    itemids: ["83820", "83821", "96736", "96737"],
    output: ["itemid", "hostid", "name", "key_", "value_type", "lastvalue", "status", "preprocessing"]
  });
  console.log(JSON.stringify(items, null, 2));

  // 2. Search for all items matching 4740 or 4728 or 4732 or 4756 on DCs (10699, 10701, 10715)
  console.log("\n=== SEARCH ALL SECURITY EVENT ITEMS ON DCS ===");
  const allSecItems = await mcpCall("item_get", {
    hostids: ["10699", "10701", "10715"],
    search: {
      key_: "eventlog"
    },
    output: ["itemid", "hostid", "name", "key_", "value_type", "lastvalue", "status"]
  });
  console.log(`Found ${allSecItems.length} eventlog items across DCs:`);
  allSecItems.forEach(i => {
    console.log(`[Host ${i.hostid}] [Item ${i.itemid}] "${i.name}" -> key: ${i.key_} (lastvalue: ${JSON.stringify(i.lastvalue ? i.lastvalue.slice(0, 60) : '')})`);
  });

  // Also search items with name containing Bloqueo or Grupo or Forense or 4740 or 4728
  const depItems = await mcpCall("item_get", {
    hostids: ["10699", "10701", "10715"],
    filter: {
      type: "18" // Dependent items
    },
    output: ["itemid", "hostid", "name", "key_", "master_itemid", "preprocessing"]
  });
  console.log(`\nFound ${depItems.length} dependent items across DCs:`);
  depItems.forEach(i => {
    console.log(`[Host ${i.hostid}] [Item ${i.itemid}] "${i.name}" (master: ${i.master_itemid}) -> key: ${i.key_}`);
    if (i.preprocessing) {
      console.log(`   preprocessing:`, JSON.stringify(i.preprocessing));
    }
  });
}

main().catch(console.error);
