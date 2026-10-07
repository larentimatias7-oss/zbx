import http from 'http';
import fs from 'fs';

function post(data, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request('http://127.0.0.1:8080/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Authorization': 'Bearer zmcp_6673ac9995fe59ae960e5597530912bdebdd76bbf56e6e1007ac6755a9eb545e',
        'Content-Length': Buffer.byteLength(payload),
        ...headers
      }
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function inspect411() {
  const initRes = await post({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'verifier', version: '1.0' }
    }
  });

  const sId = initRes.headers['mcp-session-id'];
  await post({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} }, { 'mcp-session-id': sId });

  const res = await post({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'zabbix_raw_api_call',
      arguments: {
        method: 'dashboard.get',
        params: {
          dashboardids: ['411'],
          selectPages: 'extend'
        }
      }
    }
  }, { 'mcp-session-id': sId });

  const sseLine = res.body.split('\n').find(l => l.startsWith('data: '));
  const data = JSON.parse(sseLine.slice(6));
  const rawText = data.result.content[0].text;
  const preambleEnd = rawText.indexOf('instructions.]');
  const jsonStart = rawText.indexOf('[', preambleEnd);
  const jsonEnd = rawText.lastIndexOf(']');
  const dashboards = JSON.parse(rawText.slice(jsonStart, jsonEnd + 1));

  fs.writeFileSync('scratch/dashboard_411_full.json', JSON.stringify(dashboards[0], null, 2), 'utf8');
  console.log('Saved dashboard 411 full structure to scratch/dashboard_411_full.json');

  const d = dashboards[0];
  for (const p of d.pages) {
    console.log(`\n=== PAGE: "${p.name}" (Widgets: ${p.widgets?.length || 0}) ===`);
    for (const w of p.widgets || []) {
      console.log(` - Widget: "${w.name || '(no name)'}" | Type: ${w.type} | Pos: [x:${w.x}, y:${w.y}, w:${w.width}, h:${w.height}]`);
      if (w.fields && w.fields.length > 0) {
        const itemFields = w.fields.filter(f => f.name.includes('item') || f.name.includes('host') || f.name.includes('filter'));
        if (itemFields.length > 0) {
          console.log(`   Fields:`, itemFields);
        }
      }
    }
  }
}

inspect411().catch(console.error);
