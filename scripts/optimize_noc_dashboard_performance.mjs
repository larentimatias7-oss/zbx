import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const GRAFANA_HOST = '172.27.210.154';
const GRAFANA_PORT = 3005;
const DASHBOARD_UID = 'noc-zabbix-command-center';

async function grafanaRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = http.request({
      hostname: GRAFANA_HOST,
      port: GRAFANA_PORT,
      path: path,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + token,
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(b));
        } catch (e) {
          resolve(b);
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// Panels that MUST keep the global user time range (timeseries trends over time)
const TIME_SERIES_PANEL_IDS = new Set([
  15, // Tráfico de Sesiones Activas (FortiGates SD-WAN)
  27, // Tendencia Comparativa de Tráfico WAN por Sede / Proyecto (Mbps)
  29, // Borde Central: Balanceo ISP (Telecom TASA vs Claro) - In/Out
  12, // Feed de Incidentes Activos en Tiempo Real
  4,  // Incidentes Críticos
  5   // Alertas Preventivas
]);

async function main() {
  console.log(`Fetching dashboard ${DASHBOARD_UID}...`);
  const getRes = await grafanaRequest('GET', `/api/dashboards/uid/${DASHBOARD_UID}`);
  if (!getRes || !getRes.dashboard) {
    throw new Error('Failed to fetch dashboard: ' + JSON.stringify(getRes));
  }

  const dash = getRes.dashboard;

  // Set default time to now-1h to now (optimal NOC real-time default)
  dash.time = {
    from: 'now-1h',
    to: 'now'
  };

  let optimizedCount = 0;
  for (const panel of dash.panels) {
    // If it's not a historical trend graph, lock its time window to 15m
    if (!TIME_SERIES_PANEL_IDS.has(panel.id) && panel.type !== 'row') {
      panel.timeFrom = '15m';
      panel.hideTimeOverride = true; // Keep UI clean without noisy clock badges
      optimizedCount++;
    } else {
      // Historical graphs inherit whatever range the operator chooses (24h, 7d, etc.)
      delete panel.timeFrom;
    }
  }

  console.log(`Optimized ${optimizedCount} panels with timeFrom: '15m' to prevent Zabbix API saturation.`);

  // Save to Grafana
  console.log('Deploying optimized dashboard to Grafana...');
  const saveRes = await grafanaRequest('POST', '/api/dashboards/db', {
    dashboard: dash,
    overwrite: true
  });
  console.log('Save result:', saveRes);

  // Save local copy
  const localFile = 'dashboards/noc-zabbix-command-center.json';
  fs.writeFileSync(localFile, JSON.stringify(dash, null, 2), 'utf8');
  console.log(`Saved local file ${localFile}`);
}

main().catch(console.error);
