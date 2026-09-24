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

async function run() {
  console.log('Sending initialize...');
  const initRes = await post({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'agent', version: '1.0' }
    }
  });
  console.log('Init status:', initRes.status);
  console.log('Init headers:', initRes.headers);
  console.log('Init body:', initRes.body);

  const sessionId = initRes.headers['mcp-session-id'];
  if (sessionId) {
    console.log('Session ID obtained:', sessionId);
    // Send initialized notification
    await post({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
      params: {}
    }, { 'mcp-session-id': sessionId });

    // Send a test tool call (e.g. host_get)
    console.log('Testing tool call with session ID...');
    const toolRes = await post({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'host_get',
        arguments: {
          hostids: ['10699'],
          output: ['hostid', 'host']
        }
      }
    }, { 'mcp-session-id': sessionId });
    console.log('Tool call status:', toolRes.status);
    console.log('Tool call body:', toolRes.body);
  }
}

run().catch(console.error);
