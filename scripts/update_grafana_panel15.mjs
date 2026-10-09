import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function api(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: '172.27.210.154',
      port: 3005,
      path,
      method,
      headers: {
        'Authorization': 'Bearer ' + token,
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(b) });
        } catch(e) {
          resolve({ status: res.statusCode, raw: b });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('1. Obteniendo dashboard actual de Grafana...');
  const res = await api('/api/dashboards/uid/noc-zabbix-command-center');
  if (res.status !== 200) throw new Error('Error al obtener dashboard: ' + res.status);
  
  const dash = res.data.dashboard;
  console.log(`Versión actual: ${dash.version}`);
  
  // Guardar backup
  fs.writeFileSync(`./scratch/dash_backup_before_panel15_v${dash.version}.json`, JSON.stringify(dash, null, 2));

  // Buscar panel 15
  const pIdx = dash.panels.findIndex(p => p.id === 15);
  if (pIdx === -1) throw new Error('Panel 15 no encontrado');
  
  const p15 = dash.panels[pIdx];
  console.log('Panel 15 actual:', p15.title);

  // Actualizar thresholds y estilo de líneas en panel 15
  p15.description = "Sesiones IPv4 concurrentes cursadas por los firewalls de borde. Líneas de umbral: Preventivo en 18K y Crítico en 22K (calculado sobre el baseline histórico de 7 días).";

  if (!p15.fieldConfig) p15.fieldConfig = { defaults: {} };
  if (!p15.fieldConfig.defaults) p15.fieldConfig.defaults = {};
  if (!p15.fieldConfig.defaults.custom) p15.fieldConfig.defaults.custom = {};

  p15.fieldConfig.defaults.thresholds = {
    mode: "absolute",
    steps: [
      { color: "#73BF69", value: null },
      { color: "#F2CC0C", value: 18000 },
      { color: "#E02F44", value: 22000 }
    ]
  };

  p15.fieldConfig.defaults.custom.thresholdsStyle = {
    mode: "line"
  };

  console.log('2. Desplegando dashboard actualizado con líneas de umbral en Panel 15...');
  const deployRes = await api('/api/dashboards/db', 'POST', {
    dashboard: dash,
    overwrite: true,
    message: "Add visual 7d baseline threshold lines (18K Warning, 22K Critical) to active sessions panel 15"
  });

  console.log('Resultado de despliegue:', deployRes.status, deployRes.data?.status, deployRes.data?.version);
  fs.writeFileSync('./dashboards/noc-zabbix-command-center.json', JSON.stringify(dash, null, 2));
}

main().catch(console.error);
