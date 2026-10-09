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
  console.log('1. Obteniendo dashboard actual...');
  const res = await api('/api/dashboards/uid/noc-zabbix-command-center');
  if (res.status !== 200) throw new Error('Error al obtener dashboard: ' + res.status);
  
  const dash = res.data.dashboard;
  console.log(`Versión actual: ${dash.version}`);
  
  // Guardar backup
  fs.writeFileSync(`./scratch/dash_backup_before_flap_fix_v${dash.version}.json`, JSON.stringify(dash, null, 2));

  // Buscar panel 161
  const pIdx = dash.panels.findIndex(p => p.id === 161);
  if (pIdx === -1) throw new Error('Panel 161 no encontrado');
  
  const original = dash.panels[pIdx];
  console.log('Panel 161 actual:', original.title, original.type);

  // Reemplazar con panel nativo de triggers filtrado por flapping
  dash.panels[pIdx] = {
    datasource: {
      type: "alexanderzobnin-zabbix-datasource",
      uid: "efz4nzx8r30g0c"
    },
    description: "Monitoreo dinámico de interfaces de acceso con flapping (>4 caídas/hora en la última hora). Detecta puertos intermitentes para evitar tormentas Spanning Tree.",
    gridPos: original.gridPos || { h: 8, w: 12, x: 0, y: 52 },
    id: 161,
    options: {
      ackEventColor: "#38BDF8",
      ackField: true,
      ageField: true,
      allowDangerousHTML: false,
      customLastChangeFormat: false,
      customTagColumns: "",
      dataLinks: [],
      descriptionAtNewLine: false,
      descriptionField: true,
      fontSize: "100%",
      highlightBackground: false,
      highlightNewEvents: true,
      highlightNewerThan: "1h",
      hostField: true,
      hostGroups: false,
      hostIpField: false,
      hostProxy: false,
      hostTechNameField: false,
      lastChangeFormat: "",
      layout: "table",
      markAckEvents: true,
      okEventColor: "#73BF69",
      opdataField: true,
      pageSize: 5,
      problemTimeline: true,
      resizedColumns: [],
      schemaVersion: 8,
      severityField: true,
      showDatasourceName: false,
      showSearchFilter: false,
      showTags: false,
      sortProblems: "priority",
      statusField: false,
      statusIcon: false
    },
    pluginVersion: "6.8.0",
    targets: [
      {
        application: { filter: "" },
        datasource: {
          type: "alexanderzobnin-zabbix-datasource",
          uid: "efz4nzx8r30g0c"
        },
        group: {
          filter: "/(switch|Switches)/"
        },
        host: {
          filter: "/${sede:raw}/"
        },
        options: {
          acknowledged: 2,
          hostsInMaintenance: false,
          limit: 50,
          minSeverity: 2,
          severities: [2, 3, 4, 5],
          showDisabledItems: false,
          sortProblems: "priority",
          useTimeRange: false
        },
        proxy: { filter: "" },
        queryType: "5",
        refId: "A",
        schema: 12,
        showProblems: "problems",
        tags: { filter: "" },
        trigger: {
          filter: "/.*(Flapping|recurrente).*/"
        }
      }
    ],
    title: "🔌 Detección de Link Flapping: Puertos Inestables en Switches",
    type: "alexanderzobnin-zabbix-triggers-panel"
  };

  console.log('2. Desplegando dashboard actualizado con panel nativo de triggers...');
  const deployRes = await api('/api/dashboards/db', 'POST', {
    dashboard: dash,
    overwrite: true,
    message: "Fix panel 161 to use native triggers panel for link flapping detection"
  });

  console.log('Resultado de despliegue:', deployRes.status, deployRes.data?.status, deployRes.data?.version);
  fs.writeFileSync('./dashboards/noc-zabbix-command-center.json', JSON.stringify(dash, null, 2));
}

main().catch(console.error);
