import http from 'http';
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

function createTextSeriesTarget(refId, host, item) {
  return {
    refId,
    schema: 12,
    queryType: "2",
    group: { filter: "AD" },
    host: { filter: host },
    application: { filter: "" },
    item: { filter: item },
    functions: [],
    resultFormat: "time_series",
    options: { showDisabledItems: false }
  };
}

async function updateADSOC() {
  console.log('1. Fetching live milicic-activedirectory-soc...');
  const res = await grafanaRequest('GET', '/api/dashboards/uid/milicic-activedirectory-soc');
  if (res.status !== 200) throw new Error('Failed to fetch dashboard: ' + res.status);

  const d = res.data.dashboard;
  const meta = res.data.meta;
  console.log(`Current version: ${d.version}`);

  const DS = { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' };

  // Update Panel 60: Forense Bloqueos
  const p60 = d.panels.find(p => p.id === 60);
  if (p60) {
    p60.title = "🔒 Historial Forense de Bloqueos (Event 4740) — Últimos 7 Días";
    p60.description = "Correlación cronológica de cuenta bloqueada y equipo de origen en el controlador de dominio PDC Emulator.";
    p60.timeFrom = "7d";
    p60.targets = [
      createTextSeriesTarget("USER", "SRO-DCO01", "User locked Name"),
      createTextSeriesTarget("PC", "SRO-DCO01", "User Locked PC")
    ];
    p60.transformations = [
      {
        id: "joinByField",
        options: {
          byField: "Time",
          mode: "outer"
        }
      },
      {
        id: "organize",
        options: {
          indexByName: {
            "Time": 0,
            "Value #USER": 1,
            "Value #PC": 2
          },
          renameByName: {
            "Time": "Fecha / Hora",
            "Value #USER": "Usuario Bloqueado",
            "Value #PC": "Equipo de Origen"
          }
        }
      },
      {
        id: "sortBy",
        options: {
          fields: [
            { field: "Fecha / Hora", desc: true }
          ]
        }
      }
    ];
    p60.fieldConfig = {
      defaults: {
        custom: { align: "left", cellOptions: { type: "auto" }, filterable: true, minWidth: 120 }
      },
      overrides: [
        {
          matcher: { id: "byName", options: "Fecha / Hora" },
          properties: [
            { id: "custom.width", value: 160 },
            { id: "unit", value: "dateTimeAsIso" }
          ]
        },
        {
          matcher: { id: "byName", options: "Usuario Bloqueado" },
          properties: [
            { id: "custom.width", value: 240 },
            { id: "custom.cellOptions", value: { type: "color-background" } },
            { id: "mappings", value: [
              { type: "regex", options: { pattern: "(?i).*admin.*", result: { text: "🚨 Administrador (Privilegiado)", color: C.disaster } } },
              { type: "regex", options: { pattern: ".+", result: { text: "⚠️ $__text (Usuario de Dominio)", color: C.average } } }
            ]}
          ]
        },
        {
          matcher: { id: "byName", options: "Equipo de Origen" },
          properties: [
            { id: "custom.width", value: 220 },
            { id: "custom.inspect", value: true },
            { id: "mappings", value: [
              { type: "regex", options: { pattern: ".+", result: { text: "💻 $__text", color: C.blue } } }
            ]},
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
          ]
        }
      ]
    };
    p60.options = {
      showHeader: true,
      sortBy: [{ displayName: "Fecha / Hora", desc: true }],
      footer: { show: false, reducer: ["sum"] }
    };
  }

  // Update Panel 61: Grupos Privilegiados Links
  const p61 = d.panels.find(p => p.id === 61);
  if (p61) {
    const valOverride = p61.fieldConfig?.overrides?.find(o => o.matcher?.options === "Valor Registrado (Detalle)");
    if (valOverride) {
      valOverride.properties = valOverride.properties.filter(prop => prop.id !== "links");
      valOverride.properties.push({
        id: "links",
        value: [
          {
            title: "🔍 Ver Eventlogs de Modificación de Grupos en Zabbix",
            url: "https://zabbix.mlccnet.local/history.php?action=showvalues&itemids%5B0%5D=96736&itemids%5B1%5D=96737",
            targetBlank: true
          },
          {
            title: "🏛️ Abrir Dashboard Cyber SOC (Zabbix 411)",
            url: "https://zabbix.mlccnet.local/zabbix.php?action=dashboard.view&dashboardid=411",
            targetBlank: true
          }
        ]
      });
    }
  }

  console.log('2. Deploying updated milicic-activedirectory-soc...');
  const saveRes = await grafanaRequest('POST', '/api/dashboards/db', {
    dashboard: d,
    folderId: meta.folderId || 0,
    overwrite: true,
    message: 'Sync 7d lockout history with date, unified event row and severity colors'
  });

  if (saveRes.status !== 200) {
    throw new Error(`Failed to save dashboard: ${saveRes.status} - ${JSON.stringify(saveRes.data)}`);
  }

  console.log('SUCCESS! AD SOC Dashboard updated:');
  console.log(`URL: http://172.27.210.154:3005${saveRes.data.url}`);
  console.log(`Version: ${saveRes.data.version}`);
}

updateADSOC().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
