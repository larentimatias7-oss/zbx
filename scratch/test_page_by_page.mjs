import http from 'http';
import fs from 'fs';
import path from 'path';

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
    req.write(payload);
    req.end();
  });
}

async function testUpdate(pagesToTest, label) {
  const initRes = await post({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'debugger', version: '1.0' }
    }
  });
  const sessionId = initRes.headers['mcp-session-id'];
  await post({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} }, { 'mcp-session-id': sessionId });

  console.log(`Testing [${label}] with ${pagesToTest.length} pages...`);
  const res = await post({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'zabbix_raw_api_call',
      arguments: {
        method: 'dashboard.update',
        params: {
          dashboardid: '411',
          name: 'Security Logs 2 - Active Directory Cyber SOC',
          pages: pagesToTest
        }
      }
    }
  }, { 'mcp-session-id': sessionId });

  const isErr = res.body.includes('"isError":true');
  console.log(`  Result for [${label}]: ${isErr ? 'FAIL' : 'SUCCESS'}`);
  if (isErr) {
    console.log('  Response:', res.body.slice(0, 300));
  }
  return !isErr;
}

async function run() {
  const updated = JSON.parse(fs.readFileSync('C:/zabbix_anti/.zabbix_context/dashboards/dashboard_411_updated.json', 'utf8'));
  const p3 = updated.pages[2];

  console.log(`Page 3 has ${p3.widgets.length} widgets. Testing each widget alone in Page 3...`);
  for (let i = 0; i < p3.widgets.length; i++) {
    const w = p3.widgets[i];
    const testPage = {
      name: p3.name,
      display_period: '30',
      widgets: [w]
    };
    await testUpdate([updated.pages[0], testPage], `Page 3 - Widget ${i+1}: "${w.name}" (${w.type})`);
  }
}

run().catch(console.error);
