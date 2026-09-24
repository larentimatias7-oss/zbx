import http from 'http';

function zabbixApi(method, params) {
  const payload = JSON.stringify({
    jsonrpc: '2.0',
    method: method,
    params: params,
    auth: 'zmcp_6673ac9995fe59ae960e5597530912bdebdd76bbf56e6e1007ac6755a9eb545e',
    id: 1
  });

  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 8080,
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer zmcp_6673ac9995fe59ae960e5597530912bdebdd76bbf56e6e1007ac6755a9eb545e'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.result);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  const targetHostIds = [
    "10697", // FTG border1
    "10708", // CORE01
    "10722", // CORE02
    "10724", // CORE03
    "10796", // ACC01 EG
    "10797", // ACC02 EG
    "10726", // D03 E03
    "10799", // DIS01 G01
    "10798", // ACC01 G01
    "10800", // ACC02 G01
    "10711", // D01 E01
    "10803", // P2P G06
    "10820", // POR-P2P01
    "10804", // AP Master SAP
    "10792", // UPS SRO CORE
    "10801", // UPS Ed Gris PB
    "10802", // UPS E02 PA
    "10819", // UPS GALPON 01
    "10704", // SRO-ESX01
    "10705", // SRO-ESX02
    "10706", // SRO-STO01
    "10699", // SRO-DCO01
    "10701", // SRO-DCO02
    "10703", // SRO-BKP01
    "10784"  // SRO-SQL01
  ];

  console.log("=== INSPECTING HOST ITEMS & TRIGGERS ===");
  for (const hid of targetHostIds) {
    const hostInfo = await zabbixApi('host.get', {
      hostids: [hid],
      output: ['hostid', 'host', 'name']
    });
    const hname = hostInfo?.[0]?.name || hid;

    const items = await zabbixApi('item.get', {
      hostids: [hid],
      output: ['itemid', 'name', 'key_', 'lastvalue', 'units', 'status'],
      filter: { status: '0' }
    });

    console.log(`\n--- [${hid}] ${hname} (${items?.length || 0} active items) ---`);
    if (items) {
      // Find CPU, Ping, Uptime, Memory, PoE, Battery
      const interesting = items.filter(it => 
        it.key_.includes('ping') || 
        it.key_.includes('cpu') || 
        it.key_.includes('uptime') || 
        it.key_.includes('poe') || 
        it.key_.includes('battery') || 
        it.key_.includes('voltage') || 
        it.key_.includes('charge') || 
        it.key_.includes('memory') ||
        it.name.toLowerCase().includes('ping') ||
        it.name.toLowerCase().includes('cpu') ||
        it.name.toLowerCase().includes('poe') ||
        it.name.toLowerCase().includes('battery')
      );
      for (const it of interesting) {
        console.log(`  Key: ${it.key_} | Name: ${it.name} | LastVal: ${it.lastvalue} ${it.units}`);
      }
    }
  }
}

main().catch(console.error);
