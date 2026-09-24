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

// Format bytes to bps / Mbps
function formatBps(val) {
  const n = parseFloat(val);
  if (isNaN(n)) return '0 bps';
  if (n >= 1000000000) return (n / 1000000000).toFixed(2) + ' Gbps';
  if (n >= 1000000) return (n / 1000000).toFixed(2) + ' Mbps';
  if (n >= 1000) return (n / 1000).toFixed(2) + ' Kbps';
  return n.toFixed(0) + ' bps';
}

async function main() {
  const targetHosts = [
    { hid: "10708", name: "SRO-E02-PB00-CORE01" },
    { hid: "10722", name: "SRO-E02-PB00-CORE02" },
    { hid: "10724", name: "SRO-E02-PB00-CORE03" },
    { hid: "10726", name: "SRO-E03-P00-D03" },
    { hid: "10799", name: "SRO-G01-P100-DIS01" },
    { hid: "10798", name: "SRO-G01-P100-ACC01" },
    { hid: "10800", name: "SRO-G01-P000-ACC2" },
    { hid: "10711", name: "SRO-E01-P00-D01" },
    { hid: "10803", name: "SRO-P2P-G06" },
    { hid: "10820", name: "POR-P2P01" },
    { hid: "10796", name: "SRO-E02-PB00-ACC01" },
    { hid: "10797", name: "SW Ed Gris PB" },
    { hid: "10819", name: "UPS GALPON 01" }
  ];

  console.log("=== SCANNING INTERFACE TRAFFIC ITEMS ===");
  for (const th of targetHosts) {
    console.log(`\n================== ${th.name} (${th.hid}) ==================`);
    const items = await zabbixApi('item.get', {
      hostids: [th.hid],
      output: ['itemid', 'name', 'key_', 'lastvalue', 'units'],
      filter: { status: '0' }
    });

    if (!items || items.length === 0) {
      console.log('  No active items found');
      continue;
    }

    const ifItems = items.filter(it => 
      it.key_.startsWith('net.if.in') || 
      it.key_.startsWith('net.if.out') ||
      it.key_.includes('traffic') ||
      it.name.toLowerCase().includes('bits') ||
      it.name.toLowerCase().includes('traffic') ||
      it.name.toLowerCase().includes('octets')
    );

    for (const it of ifItems) {
      if (it.key_.startsWith('net.if.in[') || it.key_.startsWith('net.if.out[')) {
        console.log(`  - [${it.itemid}] ${it.name} | Key: ${it.key_} | Val: ${formatBps(it.lastvalue)}`);
      }
    }

    // Also check UPS items if relevant
    if (th.name.includes('UPS')) {
      for (const it of items) {
        console.log(`  - [UPS ITEM] [${it.itemid}] ${it.name} | Key: ${it.key_} | Val: ${it.lastvalue} ${it.units}`);
      }
    }
  }
}

main().catch(console.error);
