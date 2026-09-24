import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.resolve(__dirname, '../.zabbix_context/dashboards/network_sro_v2.json');
const mapData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const mcpPayload = JSON.stringify({
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "map_update",
    arguments: {
      params: mapData
    }
  }
});

const req = http.request("http://127.0.0.1:8080/mcp", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream",
    "Authorization": "Bearer zmcp_6673ac9995fe59ae960e5597530912bdebdd76bbf56e6e1007ac6755a9eb545e",
    "Content-Length": Buffer.byteLength(mcpPayload)
  }
}, res => {
  let body = "";
  res.on("data", d => body += d);
  res.on("end", () => {
    console.log("STATUS:", res.statusCode);
    console.log("RESPONSE:", body);
  });
});

req.on("error", console.error);
req.write(mcpPayload);
req.end();
