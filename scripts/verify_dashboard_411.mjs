import http from 'http';

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

async function verify() {
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
          selectPages: ['dashboard_pageid', 'name', 'display_period']
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

  console.log(`=== DASHBOARD 411 LIVE VERIFICATION ===`);
  console.log(`ID: ${dashboards[0].dashboardid}`);
  console.log(`Name: ${dashboards[0].name}`);
  console.log(`Total Pages: ${dashboards[0].pages.length}`);

  dashboards[0].pages.forEach((p, idx) => {
    console.log(`Page ${idx + 1}: "${p.name}" (pageid: ${p.dashboard_pageid}, display_period: ${p.display_period}s)`);
  });
}

verify().catch(console.error);
