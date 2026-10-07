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

async function inspectPage1() {
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

  // Query dashboard 411 but only page 1 or specific fields
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

  // Parse SSE stream body
  const lines = res.body.split('\n');
  let fullData = '';
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      fullData += line.slice(6);
    }
  }

  const parsed = JSON.parse(fullData);
  const rawText = parsed.result.content[0].text;
  const preambleEnd = rawText.indexOf('instructions.]');
  const jsonStart = rawText.indexOf('[', preambleEnd);
  const jsonEnd = rawText.lastIndexOf(']');
  const dashboards = JSON.parse(rawText.slice(jsonStart, jsonEnd + 1));

  const d = dashboards[0];
  console.log(`Dashboard: "${d.name}" (Pages: ${d.pages.length})`);
  
  const page1 = d.pages[0];
  console.log(`\n=== PAGE 1: "${page1.name}" (Widgets: ${page1.widgets?.length}) ===`);
  
  for (const w of page1.widgets) {
    console.log(`\n--- WIDGET: "${w.name}" (type: ${w.type}, x:${w.x}, y:${w.y}, w:${w.width}, h:${w.height}) ---`);
    console.log(`Fields:`, JSON.stringify(w.fields, null, 2));
  }

  // Also search all pages for 4740 or 4728 or 4732 or 4756 or "Bloqueo" or "Grupos"
  console.log('\n=== SEARCHING ALL PAGES FOR FORENSIC / AUDIT WIDGETS ===');
  for (const p of d.pages) {
    for (const w of p.widgets || []) {
      const match = (w.name || '').match(/4740|4728|4732|4756|Bloqueo|Grupo|Forense|Audit/i);
      if (match) {
        console.log(`Found on Page "${p.name}": Widget "${w.name}" (Type: ${w.type})`);
        console.log(`Fields:`, JSON.stringify(w.fields, null, 2));
      }
    }
  }
}

inspectPage1().catch(console.error);
