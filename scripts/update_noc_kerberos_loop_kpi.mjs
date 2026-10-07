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

const C = {
  disaster: '#E02F44',
  high: '#FA6400',
  average: '#F2CC0C',
  warning: '#FADE2A',
  info: '#5794F2',
  ok: '#73BF69',
  brand: '#EA580C',
  blue: '#38BDF8',
  purple: '#A855F7',
  slateDark: '#0F172A',
  slateCard: '#1E293B'
};

async function updateNocKerberosKPI() {
  console.log('1. Fetching live noc-zabbix-command-center...');
  const res = await grafanaRequest('GET', '/api/dashboards/uid/noc-zabbix-command-center');
  if (res.status !== 200) throw new Error('Failed to fetch dashboard: ' + res.status);

  const d = res.data.dashboard;
  const meta = res.data.meta;
  console.log(`Current version: ${d.version}`);

  // Backup current
  fs.writeFileSync(path.join(__dirname, `../.zabbix_context/dashboards/backups/noc-zabbix-command-center-backup-v${d.version}.json`), JSON.stringify(d, null, 2), 'utf8');

  // Find Panel 153: Preauth Kerberos Stat
  const p153 = d.panels.find(p => p.id === 153);
  if (p153) {
    p153.title = "🚨 Detección de Bucle Kerberos (24h)";
    p153.description = "Detección de anomalías por bucles de reintentos continuos con credenciales expiradas (Event 4771 · Código 0x18). Umbral normal < 500. Alerta si > 2,000.";
    p153.fieldConfig = {
      defaults: {
        displayName: "Bucle Kerberos (24h)",
        noValue: "0",
        color: { mode: "thresholds" },
        thresholds: {
          mode: "absolute",
          steps: [
            { color: C.ok, value: null },         // < 500 verde
            { color: C.average, value: 500 },     // 500-2000 amarillo advertencia
            { color: C.disaster, value: 2000 }    // > 2000 rojo alerta bucle activo
          ]
        },
        links: [
          {
            title: "🔍 Ver Eventlogs de Preauth Kerberos (4771) en Zabbix",
            url: "https://zabbix.mlccnet.local/history.php?action=showvalues&itemids%5B0%5D=96738&itemids%5B1%5D=96739",
            targetBlank: true
          }
        ]
      }
    };
    p153.options = {
      reduceOptions: { calcs: ["lastNotNull"], fields: "", values: false },
      textMode: "value_and_name",
      colorMode: "background",
      graphMode: "none",
      justifyMode: "center",
      orientation: "auto"
    };
  }

  // Find Panel 155: Alerta Forense & Diagnóstico SOC
  const p155 = d.panels.find(p => p.id === 155);
  if (p155) {
    p155.title = "🏛️ Diagnóstico Forense de Identidades & Alertas Activas";
    p155.options = {
      mode: "html",
      content: `<div style="background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); padding: 12px 16px; border-radius: 8px; border-left: 4px solid #E02F44; height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
  <div style="display: flex; justify-content: space-between; align-items: center;">
    <span style="font-size: 12px; font-weight: 700; color: #F8FAFC; display: flex; align-items: center; gap: 6px;">
      🚨 ANOMALÍA DETECTADA: Bucle de Autenticación Kerberos
    </span>
    <span style="background: #E02F44; color: white; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px;">ALERTA ACTIVA</span>
  </div>
  <div style="font-size: 11px; color: #CBD5E1; margin: 4px 0; line-height: 1.4;">
    <strong>Puesto afectado:</strong> <code style="color: #38BDF8; font-weight: bold;">NB-2000001531</code> (IP: <code style="color: #FBBF24; font-weight: bold;">172.30.215.49</code> · Usuario: <code style="color: #C084FC; font-weight: bold;">fernando.genovese</code>)<br>
    <strong>Diagnóstico:</strong> Reintentos continuos por credencial vieja cacheada (Código 0x18 · Puerto 88) saturando el PDC SRO-DCO01.<br>
    <strong>Acción técnica:</strong> Ejecutar <code style="color: #4ADE80; font-weight: bold;">klist purge</code> en el puesto y eliminar credenciales guardadas en Windows (<code style="color: #94A3B8;">control keymgr.dll</code>).
  </div>
  <div style="display: flex; gap: 8px; flex-wrap: wrap;">
    <a href="https://zabbix.mlccnet.local/history.php?action=showvalues&itemids%5B0%5D=96738&itemids%5B1%5D=96739" target="_blank" style="display: inline-block; background: #EA580C; color: white; padding: 5px 12px; border-radius: 4px; font-weight: 600; text-decoration: none; font-size: 11px;">
      🔍 Ver Logs 4771 en Zabbix ➔
    </a>
    <a href="/d/milicic-activedirectory-soc-v3/91ffe43?from=now-7d&to=now" target="_blank" style="display: inline-block; background: #1E293B; border: 1px solid #334155; color: #38BDF8; padding: 5px 12px; border-radius: 4px; font-weight: 600; text-decoration: none; font-size: 11px;">
      🏛️ Abrir Dashboard Forense AD (V3) ➔
    </a>
  </div>
</div>`
    };
  }

  console.log('2. Deploying updated noc-zabbix-command-center...');
  const saveRes = await grafanaRequest('POST', '/api/dashboards/db', {
    dashboard: d,
    folderId: meta.folderId || 0,
    overwrite: true,
    message: 'Add Kerberos loop anomaly detection KPI and active diagnostic alert card'
  });

  if (saveRes.status !== 200) {
    throw new Error(`Failed to save dashboard: ${saveRes.status} - ${JSON.stringify(saveRes.data)}`);
  }

  console.log('SUCCESS! NOC Command Center updated:');
  console.log(`URL: http://172.27.210.154:3005${saveRes.data.url}`);
  console.log(`Version: ${saveRes.data.version}`);
}

updateNocKerberosKPI().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
