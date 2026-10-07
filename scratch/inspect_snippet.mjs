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
    if (payload) req.write(payload);
    req.end();
  });
}

async function inspectSnippet() {
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

  console.log('Status:', res.status);
  console.log('Body length:', res.body.length);
  console.log('Start of body:\n', res.body.slice(0, 500));
  console.log('\nEnd of body:\n', res.body.slice(Math.max(0, res.body.length - 500)));
}

inspectSnippet().catch(console.error);
