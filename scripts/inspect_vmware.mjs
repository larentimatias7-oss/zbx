import https from 'https';

const token = "zmcp_6673ac9995fe59ae960e5597530912bdebdd76bbf56e6e1007ac6755a9eb545e";

function callZabbix(method, params) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      jsonrpc: "2.0",
      method,
      params,
      auth: token,
      id: 1
    });

    const req = https.request("https://zabbix.mlccnet.local/api_jsonrpc.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json-rpc",
        "Content-Length": Buffer.byteLength(data)
      },
      rejectUnauthorized: false
    }, (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.error) reject(parsed.error);
          else resolve(parsed.result);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log("=== Querying VMware Hosts ===");
  const hosts = await callZabbix("host.get", {
    output: ["hostid", "host", "name", "status"],
    selectGroups: ["groupid", "name"],
    search: { name: ["vCenter", "172.30.70", "ESXi", "Cluster"] },
    searchByAny: true
  });
  console.log("Found hosts:", hosts.map(h => ({ id: h.hostid, host: h.host, name: h.name, groups: h.groups.map(g => g.name) })));

  const hostIds = hosts.map(h => h.hostid);

  console.log("\n=== Checking VMware / Hypervisor Items ===");
  const items = await callZabbix("item.get", {
    hostids: hostIds,
    output: ["itemid", "hostid", "name", "key_", "units", "lastvalue"],
    search: { key_: "vmware" }
  });

  console.log(`Found ${items.length} vmware items:`);
  items.slice(0, 30).forEach(it => {
    console.log(`- [Host ${it.hostid}] ${it.name} (${it.key_}) = ${it.lastvalue} ${it.units}`);
  });

  // Check for datastore items specifically
  const dsItems = items.filter(it => it.key_.includes("datastore") || it.name.toLowerCase().includes("datastore"));
  console.log(`\n=== Datastore Items (${dsItems.length}) ===`);
  dsItems.slice(0, 20).forEach(it => {
    console.log(`- [Host ${it.hostid}] ${it.name} | Key: ${it.key_} | Val: ${it.lastvalue} ${it.units}`);
  });

  // Check for hv / cluster items
  const hvItems = items.filter(it => it.key_.includes("hv.") || it.key_.includes("cluster.") || it.name.toLowerCase().includes("cpu") || it.name.toLowerCase().includes("memory"));
  console.log(`\n=== Hypervisor / Cluster CPU/Mem Items (${hvItems.length}) ===`);
  hvItems.slice(0, 20).forEach(it => {
    console.log(`- [Host ${it.hostid}] ${it.name} | Key: ${it.key_} | Val: ${it.lastvalue} ${it.units}`);
  });
}

main().catch(console.error);
