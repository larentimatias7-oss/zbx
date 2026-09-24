import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

function grafanaRequest(urlPath, method = 'GET', postData = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '172.27.210.154',
      port: 3005,
      path: urlPath,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    };
    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    const req = http.request(options, res => {
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
    if (postData) req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('=== AUDITORIA INTEGRAL DE DASHBOARDS GRAFANA ===\n');
  const searchRes = await grafanaRequest('/api/search?folderUids=milicic-observability');
  if (searchRes.status !== 200 || !Array.isArray(searchRes.data)) {
    console.error('Error buscando dashboards:', searchRes);
    return;
  }

  console.log(`Encontrados ${searchRes.data.length} dashboards en la carpeta 'Milicic Observabilidad':\n`);
  
  const auditReport = [];

  for (const item of searchRes.data) {
    if (item.type !== 'dash-db') continue;
    console.log(`----------------------------------------------------------------`);
    console.log(`Dashboard: "${item.title}" (UID: ${item.uid})`);
    const dbRes = await grafanaRequest(`/api/dashboards/uid/${item.uid}`);
    if (dbRes.status !== 200) {
      console.log(`  ERROR al obtener dashboard: HTTP ${dbRes.status}`);
      continue;
    }
    const dash = dbRes.data.dashboard;
    const panels = dash.panels || [];
    console.log(`  Total Paneles: ${panels.length}`);
    console.log(`  Variables: ${(dash.templating?.list || []).map(v => v.name).join(', ')}`);

    const panelSummaries = [];

    for (const p of panels) {
      if (p.type === 'row') continue;
      const targets = p.targets || [];
      const hasTargets = targets.length > 0;
      let targetDesc = '';
      if (hasTargets) {
        targetDesc = targets.map(t => {
          const g = t.group?.filter || t.group || '*';
          const h = t.host?.filter || t.host || '*';
          const i = t.item?.filter || t.item || '*';
          return `[G:${g} H:${h} I:${i}]`;
        }).join(', ');
      }
      panelSummaries.push({
        id: p.id,
        title: p.title,
        type: p.type,
        targetDesc
      });
      console.log(`  - [${p.type.padEnd(11)}] #${String(p.id).padEnd(2)} "${p.title}"`);
    }

    auditReport.push({
      uid: item.uid,
      title: item.title,
      panels: panelSummaries
    });
  }

  fs.writeFileSync('scratch/dashboards_audit_raw.json', JSON.stringify(auditReport, null, 2));
  console.log('\nReporte guardado en scratch/dashboards_audit_raw.json');
}

main().catch(console.error);
