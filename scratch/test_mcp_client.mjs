import http from 'http';

const MCP_URL = 'http://127.0.0.1:8080/mcp';
const MCP_TOKEN = 'zmcp_6673ac9995fe59ae960e5597530912bdebdd76bbf56e6e1007ac6755a9eb545e';
let sessionId = null;

function post(data, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request(MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Authorization': `Bearer ${MCP_TOKEN}`,
        'Content-Length': Buffer.byteLength(payload),
        ...extraHeaders
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

export async function initMcp() {
  if (sessionId) return sessionId;
  const res = await post({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'milicic-exec-builder', version: '1.0' }
    }
  });
  sessionId = res.headers['mcp-session-id'];
  if (!sessionId) throw new Error('Could not obtain mcp-session-id');
  await post({
    jsonrpc: '2.0',
    method: 'notifications/initialized',
    params: {}
  }, { 'mcp-session-id': sessionId });
  return sessionId;
}

export async function callMcpTool(name, args = {}) {
  const sid = await initMcp();
  const res = await post({
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: { name, arguments: args }
  }, { 'mcp-session-id': sid });

  // Parse SSE data
  const lines = res.body.split('\n');
  const dataLine = lines.find(l => l.startsWith('data: '));
  if (!dataLine) throw new Error('Invalid MCP response: ' + res.body);
  const parsed = JSON.parse(dataLine.slice(6));
  if (parsed.error) throw new Error('MCP Error: ' + JSON.stringify(parsed.error));
  const textContent = parsed.result?.content?.[0]?.text;
  if (parsed.result?.isError) throw new Error('Tool Error: ' + textContent);
  try {
    return JSON.parse(textContent);
  } catch (e) {
    return textContent;
  }
}

async function test() {
  console.log('Testing callMcpTool with host_get...');
  const hosts = await callMcpTool('host_get', {
    filter: { status: '0' },
    output: 'extend'
  });
  console.log('Success! Total enabled hosts:', hosts.length);
}

test().catch(console.error);
