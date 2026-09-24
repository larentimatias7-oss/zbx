import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken || grafanaToken.length < 10) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

function postGrafana(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: '172.27.210.154',
      port: 3005,
      path: path,
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + grafanaToken,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let resp = '';
      res.on('data', chunk => resp += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(resp));
        } catch (e) {
          resolve(resp);
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getGrafana(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '172.27.210.154',
      port: 3005,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + grafanaToken
      }
    }, res => {
      let resp = '';
      res.on('data', chunk => resp += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(resp));
        } catch (e) {
          resolve(resp);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function verify() {
  console.log("=== 1. VERIFICANDO DASHBOARD EN GRAFANA ===");
  const dashResp = await getGrafana('/api/dashboards/uid/milicic-sanjuan-infra');
  if (!dashResp || !dashResp.dashboard) {
    console.error("No se pudo obtener el dashboard:", dashResp);
    return;
  }
  const dash = dashResp.dashboard;
  console.log("Título:", dash.title);
  console.log("UID:", dash.uid);
  console.log("Versión:", dash.version);
  console.log("Total paneles:", dash.panels ? dash.panels.length : 0);

  // Extraer todas las queries de los paneles
  console.log("\n=== 2. EJECUTANDO QUERIES DE PANELES EN GRAFANA /api/ds/query ===");
  const panelsWithTargets = dash.panels.filter(p => p.targets && p.targets.length > 0);
  console.log(`Paneles con queries: ${panelsWithTargets.length}`);

  for (const p of panelsWithTargets) {
    console.log(`\n--- Panel ID ${p.id}: "${p.title || 'Sin Título'}" (${p.type}) ---`);
    const queries = p.targets.map(t => ({
      ...t,
      datasource: { uid: "efz4nzx8r30g0c", type: "alexanderzobnin-zabbix-datasource" }
    }));

    const queryPayload = {
      from: "now-1h",
      to: "now",
      queries: queries
    };

    try {
      const qRes = await postGrafana('/api/ds/query', queryPayload);
      if (qRes && qRes.results) {
        for (const [refId, resObj] of Object.entries(qRes.results)) {
          const frameCount = resObj.frames ? resObj.frames.length : 0;
          const status = resObj.status || 200;
          if (resObj.error) {
            console.log(`  ❌ Query ${refId}: ERROR: ${resObj.error}`);
          } else {
            let rowCount = 0;
            if (resObj.frames && resObj.frames[0] && resObj.frames[0].data && resObj.frames[0].data.values) {
              rowCount = resObj.frames[0].data.values[0] ? resObj.frames[0].data.values[0].length : 0;
            }
            console.log(`  ✅ Query ${refId}: OK | Frames: ${frameCount} | Filas datos: ${rowCount}`);
          }
        }
      } else {
        console.log("  ⚠️ Respuesta inesperada:", JSON.stringify(qRes).slice(0, 150));
      }
    } catch (e) {
      console.log(`  ❌ Error ejecutando query:`, e.message);
    }
  }

  console.log("\n=== VERIFICACIÓN COMPLETADA ===");
}

verify();
