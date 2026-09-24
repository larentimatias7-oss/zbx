import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.resolve(__dirname, '../.zabbix_context/dashboards/dashboard_411_updated.json');
const dashboardData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

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

async function deploy() {
  console.log('1. Initializing MCP session with initMAX server...');
  const initRes = await post({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'antigravity-ad-deployer', version: '1.0' }
    }
  });

  const sessionId = initRes.headers['mcp-session-id'];
  if (!sessionId) {
    throw new Error('Failed to obtain mcp-session-id from initMAX server');
  }
  console.log(`   Session established: ${sessionId}`);

  // Send initialized notification
  await post({
    jsonrpc: '2.0',
    method: 'notifications/initialized',
    params: {}
  }, { 'mcp-session-id': sessionId });

  console.log(`2. Deploying Dashboard 411 via zabbix_raw_api_call: "${dashboardData.name}" (${dashboardData.pages.length} pages)...`);
  const toolCallRes = await post({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'zabbix_raw_api_call',
      arguments: {
        method: 'dashboard.update',
        params: dashboardData
      }
    }
  }, { 'mcp-session-id': sessionId });

  console.log(`   Deploy response status: ${toolCallRes.status}`);
  console.log(`   Deploy response body:\n${toolCallRes.body}`);

  if (toolCallRes.body.includes('"isError":true')) {
    console.error('FAILED TO UPDATE DASHBOARD!');
    process.exit(1);
  } else {
    console.log('SUCCESS: Dashboard 411 updated cleanly in Zabbix production!');
  }
}

deploy().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
