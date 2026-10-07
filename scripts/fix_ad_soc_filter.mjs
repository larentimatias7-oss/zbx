import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';

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

async function updateAdSoc() {
  console.log('1. Fetching live milicic-activedirectory-soc...');
  const res = await grafanaRequest('GET', '/api/dashboards/uid/milicic-activedirectory-soc');
  if (res.status !== 200) throw new Error('Failed to fetch dashboard: ' + res.status);

  const d = res.data.dashboard;
  const meta = res.data.meta;
  console.log(`Current version: ${d.version}`);

  const p60 = d.panels.find(p => p.id === 60);
  if (p60) {
    p60.transformations = [
      { id: "merge", options: {} },
      {
        id: "organize",
        options: {
          excludeByName: { "Key": true },
          indexByName: { "Host": 0, "Item": 1, "Last value": 2, "Value": 2 },
          renameByName: {
            "Host": "Controlador DC",
            "Item": "Métrica Forense Extraída",
            "Last value": "Valor Registrado",
            "Value": "Valor Registrado"
          }
        }
      },
      {
        id: "filterByValue",
        options: {
          type: "include",
          match: "regex",
          filters: [
            { fieldName: "Valor Registrado", config: { id: "regex", options: { value: "\\S+" } } }
          ]
        }
      }
    ];

    // Update overrides links
    const valOverride = p60.fieldConfig.overrides.find(o => o.matcher?.options?.includes('Valor Registrado'));
    if (valOverride) {
      valOverride.properties = [
        { id: "custom.inspect", value: true },
        { id: "links", value: [
          {
            title: "🔍 Ver Eventlogs de Bloqueo (4740) en Zabbix",
            url: "https://zabbix.mlccnet.local/history.php?action=showvalues&itemids%5B0%5D=83274&itemids%5B1%5D=96712",
            targetBlank: true
          },
          {
            title: "🏛️ Abrir Dashboard Cyber SOC (Zabbix 411)",
            url: "https://zabbix.mlccnet.local/zabbix.php?action=dashboard.view&dashboardid=411",
            targetBlank: true
          }
        ]}
      ];
    }
  }

  const p61 = d.panels.find(p => p.id === 61);
  if (p61) {
    p61.transformations = [
      { id: "merge", options: {} },
      {
        id: "organize",
        options: {
          excludeByName: { "Key": true },
          indexByName: { "Host": 0, "Item": 1, "Last value": 2, "Value": 2 },
          renameByName: {
            "Host": "Controlador DC",
            "Item": "Campo de Auditoría Forense",
            "Last value": "Detalle Registrado",
            "Value": "Detalle Registrado"
          }
        }
      },
      {
        id: "filterByValue",
        options: {
          type: "include",
          match: "regex",
          filters: [
            { fieldName: "Detalle Registrado", config: { id: "regex", options: { value: "\\S+" } } }
          ]
        }
      }
    ];

    const detOverride = p61.fieldConfig.overrides.find(o => o.matcher?.options?.includes('Detalle Registrado'));
    if (detOverride) {
      detOverride.properties = [
        { id: "custom.inspect", value: true },
        { id: "mappings", value: [
          { type: "regex", options: { pattern: ".*added.*", result: { text: "➕ Miembro Añadido", color: "green" } } },
          { type: "regex", options: { pattern: ".*removed.*", result: { text: "➖ Miembro Removido", color: "red" } } }
        ]},
        { id: "links", value: [
          {
            title: "🔍 Ver Logs de Grupos (4728/4732/4756) en Zabbix",
            url: "https://zabbix.mlccnet.local/history.php?action=showvalues&itemids%5B0%5D=96736&itemids%5B1%5D=96737",
            targetBlank: true
          },
          {
            title: "🏛️ Abrir Dashboard Cyber SOC (Zabbix 411)",
            url: "https://zabbix.mlccnet.local/zabbix.php?action=dashboard.view&dashboardid=411",
            targetBlank: true
          }
        ]}
      ];
    }
  }

  console.log('2. Deploying updated milicic-activedirectory-soc...');
  const saveRes = await grafanaRequest('POST', '/api/dashboards/db', {
    dashboard: d,
    folderId: meta.folderId || 0,
    overwrite: true,
    message: 'Fix links to point to verified Zabbix eventlogs and Dashboard 411'
  });

  if (saveRes.status !== 200) {
    throw new Error(`Failed to save dashboard: ${saveRes.status} - ${JSON.stringify(saveRes.data)}`);
  }

  console.log('SUCCESS! milicic-activedirectory-soc updated:');
  console.log(`URL: http://172.27.210.154:3005${saveRes.data.url}`);
  console.log(`Version: ${saveRes.data.version}`);
}

updateAdSoc().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
