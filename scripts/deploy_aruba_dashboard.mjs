import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Obtener token de entorno o del registro de usuario de Windows
let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken) {
  try {
    grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
  } catch (err) {
    console.error('Error al obtener token de usuario de Windows:', err.message);
  }
}

if (!grafanaToken) {
  console.error('ERROR: No se encontró GRAFANA_SERVICE_ACCOUNT_TOKEN');
  process.exit(1);
}

const dashboardPath = path.resolve(__dirname, '../.zabbix_context/dashboards/aruba-wifi-switching-overview.json');
const rawData = fs.readFileSync(dashboardPath, 'utf8');
const dashboard = JSON.parse(rawData);

const payload = JSON.stringify({
  dashboard,
  folderUid: 'milicic-observability',
  overwrite: true
});

const options = {
  hostname: '172.27.210.154',
  port: 3005,
  path: '/api/dashboards/db',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${grafanaToken}`,
    'Content-Length': Buffer.byteLength(payload)
  }
};

console.log(`Desplegando dashboard '${dashboard.title}' (UID: ${dashboard.uid}) en Grafana...`);

const req = http.request(options, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`RESPONSE: ${body}`);
    try {
      const respJson = JSON.parse(body);
      if (respJson.status === 'success') {
        console.log(`Dashboard creado exitosamente!`);
        console.log(`URL: http://172.27.210.154:3005${respJson.url}`);
      }
    } catch (e) {
      // noop
    }
  });
});

req.on('error', err => {
  console.error('Error en la solicitud HTTP:', err.message);
});

req.write(payload);
req.end();
