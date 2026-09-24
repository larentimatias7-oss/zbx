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
  const hosts = await zabbixApi('host.get', {
    output: ['hostid', 'host', 'name', 'status'],
    selectInterfaces: ['ip'],
    selectGroups: ['groupid', 'name'],
    selectTags: ['tag', 'value'],
    filter: { status: '0' }
  });

  console.log(`Total active hosts: ${hosts.length}`);
  const sroHosts = hosts.filter(h => h.name.startsWith('SRO') || h.name.startsWith('FTG_milicic_border1') || h.name.includes('Aruba') || h.name.includes('UPS') || h.name.includes('Edificio') || h.name.includes('GALPON'));
  
  console.log("=== SRO & Rosario Related Hosts ===");
  for (const h of sroHosts) {
    const ip = h.interfaces?.[0]?.ip || 'No IP';
    const groups = h.groups?.map(g => g.name).join(', ') || '';
    console.log(`[${h.hostid}] ${h.name} (${ip}) - Groups: [${groups}]`);
  }
}

main().catch(console.error);
