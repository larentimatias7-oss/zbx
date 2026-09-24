import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const dashboards = [
  'milicic-soc-overview',
  'milicic-fortigate-sdwan',
  'milicic-switches-core',
  'milicic-aruba-wifi-switches',
  'milicic-servers-overview',
  'milicic-activedirectory-soc',
  'milicic-facilities-ups',
  'milicic-backup-veeam',
  'milicic-vmware-datastores',
  'milicic-sanjuan-infra',
  'milicic-plugins-showcase'
];

async function checkDashboard(uid) {
  return new Promise((resolve) => {
    http.get(`http://172.27.210.154:3005/api/dashboards/uid/${uid}`, {
      headers: { 'Authorization': 'Bearer ' + grafanaToken }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          const data = JSON.parse(b);
          if (res.statusCode === 200) {
            resolve({
              uid,
              status: 200,
              title: data.dashboard.title,
              panels: data.dashboard.panels.length,
              version: data.dashboard.version
            });
          } else {
            resolve({ uid, status: res.statusCode, error: data.message });
          }
        } catch (e) {
          resolve({ uid, status: res.statusCode, error: e.message });
        }
      });
    }).on('error', err => resolve({ uid, status: 0, error: err.message }));
  });
}

async function run() {
  console.log('=== VERIFICACIÓN GENERAL DE SALUD DE LOS 10 DASHBOARDS EN GRAFANA ===\n');
  for (const uid of dashboards) {
    const res = await checkDashboard(uid);
    if (res.status === 200) {
      console.log(`[OK 200] "${res.title}"`);
      console.log(`         UID: ${res.uid.padEnd(28)} | Paneles: ${String(res.panels).padStart(2)} | Versión: v${res.version}`);
    } else {
      console.error(`[ERROR ${res.status}] ${uid} -> ${res.error}`);
    }
  }
}

run();
