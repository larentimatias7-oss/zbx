import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

function grafanaRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = http.request({
      hostname: '172.27.210.154',
      port: 3005,
      path: path,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(b) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: b });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function buildDashboardV3() {
  console.log('1. Loading base configuration from original live dashboard...');
  const baseJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../scratch/live_ad_soc.json'), 'utf8'));

  // Deep clone to preserve exactly every panel, query, transform and fieldConfig
  const d3 = JSON.parse(JSON.stringify(baseJson));

  d3.title = "Active Directory & Cyber SOC: Identidades, Seguridad y Salud del Bosque V3 (Por Tipo de Análisis)";
  d3.uid = "milicic-activedirectory-soc-v3";
  d3.version = 1;
  d3.id = null;
  d3.tags = ["milicic", "ad", "activedirectory", "cyber-soc", "v3", "por-tipo-analisis", "seguridad", "identidades", "windows"];

  // Map rows to explicit "Tipo de Análisis" categories while leaving all panel contents 100% intact
  const rowTitles = {
    100: "🔬 Tipo de Análisis: Seguridad de Identidades & Cyber SOC (Alertas Tempranas)",
    110: "🔬 Tipo de Análisis: Disponibilidad Operativa & Servicios Vitales de Dominio",
    120: "🔬 Tipo de Análisis: Rendimiento de Procesamiento & Carga de Autenticación",
    130: "🔬 Tipo de Análisis: Capacidad de Almacenamiento & Rendimiento Base NTDS",
    140: "🔬 Tipo de Análisis: Gestión de Incidentes & Alarmas Activas en Zabbix",
    55:  "🔬 Tipo de Análisis: Auditoría Forense Detallada de Seguridad (Últimos 7 Días)"
  };

  for (const panel of d3.panels) {
    if (panel.type === 'row' && rowTitles[panel.id]) {
      panel.title = rowTitles[panel.id];
    }
  }

  console.log(`2. Dashboard V3 prepared with ${d3.panels.length} panels identical to original.`);

  // Save to file for audit and version control
  const auditPath = path.join(__dirname, '../.zabbix_context/dashboards/milicic-activedirectory-soc-v3.json');
  fs.writeFileSync(auditPath, JSON.stringify(d3, null, 2), 'utf8');
  console.log(`Saved audit file to ${auditPath}`);

  console.log('3. Deploying V3 dashboard to Grafana...');
  const saveRes = await grafanaRequest('POST', '/api/dashboards/db', {
    dashboard: d3,
    folderId: 0,
    overwrite: true,
    message: 'Initial deployment of Active Directory & Cyber SOC V3 - Exact replica of original version divided by analysis type'
  });

  if (saveRes.status !== 200) {
    throw new Error(`Failed to save V3 dashboard: ${saveRes.status} - ${JSON.stringify(saveRes.data)}`);
  }

  console.log('SUCCESS! V3 Dashboard created:');
  console.log(`URL: http://172.27.210.154:3005${saveRes.data.url}`);
  console.log(`UID: ${saveRes.data.uid}`);
  console.log(`Version: ${saveRes.data.version}`);
}

buildDashboardV3().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
