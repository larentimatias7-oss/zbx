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

const C = {
  disaster: '#E02F44',
  high: '#FA6400',
  average: '#F2CC0C',
  warning: '#FADE2A',
  info: '#5794F2',
  ok: '#73BF69',
  brand: '#EA580C',
  blue: '#38BDF8',
  slateDark: '#0F172A',
  slateCard: '#1E293B'
};

const defaultOptions = {
  disableDataAlignment: false,
  showDisabledItems: false,
  skipEmptyValues: false,
  useZabbixValueMapping: false
};

const defaultTable = {
  skipEmptyValues: false
};

function createTextTarget(refId, host, item) {
  return {
    refId,
    schema: 12,
    queryType: "2",
    group: { filter: "AD" },
    host: { filter: host },
    application: { filter: "" },
    item: { filter: item },
    functions: [],
    resultFormat: "table",
    options: { ...defaultOptions },
    table: { ...defaultTable }
  };
}

function createMetricTarget(refId, host, item) {
  return {
    refId,
    schema: 12,
    queryType: "0",
    group: { filter: "AD" },
    host: { filter: host },
    application: { filter: "" },
    item: { filter: item },
    functions: [],
    resultFormat: "time_series",
    options: { showDisabledItems: false }
  };
}

async function fixDisplay() {
  console.log('1. Fetching live noc-zabbix-command-center...');
  const res = await grafanaRequest('GET', '/api/dashboards/uid/noc-zabbix-command-center');
  if (res.status !== 200) throw new Error('Failed to fetch dashboard: ' + res.status);

  const d = res.data.dashboard;
  const meta = res.data.meta;
  console.log(`Current version: ${d.version}`);

  const DS = { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' };

  // Remove existing SOC panels (150-160)
  d.panels = d.panels.filter(p => p.id < 150 || p.id > 160);

  const socPanels = [
    // ROW
    {
      id: 150,
      title: "🛡️ Cyber SOC & Seguridad de Identidades — Active Directory (Bosque MLCCNET.LOCAL)",
      type: "row",
      gridPos: { x: 0, y: 62, w: 24, h: 1 },
      collapsed: false,
      panels: []
    },
    // STAT 1: Bloqueos de Cuenta (24h)
    {
      id: 151,
      title: "",
      description: "Total de cuentas bloqueadas en el bosque en las últimas 24 horas (Multi-DC). Métrica calculada en tiempo real.",
      type: "stat",
      gridPos: { x: 0, y: 63, w: 4, h: 4 },
      datasource: DS,
      fieldConfig: {
        defaults: {
          displayName: "Bloqueos AD (24h)",
          noValue: "0",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: C.ok, value: null },
              { color: C.high, value: 1 },
              { color: C.disaster, value: 5 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], fields: "", values: false },
        textMode: "value_and_name",
        colorMode: "background",
        graphMode: "none",
        justifyMode: "center",
        orientation: "auto"
      },
      targets: [
        createMetricTarget("A", "SRO-DCO01", "Total Bloqueos de Cuenta (24h - Multi-DC)")
      ]
    },
    // STAT 2: Fallos Logon NTLM (24h)
    {
      id: 152,
      title: "",
      description: "Intentos fallidos de autenticación (Event 4625) en el bosque en las últimas 24 horas. Umbral adaptado a entorno corporativo 500+ endpoints.",
      type: "stat",
      gridPos: { x: 4, y: 63, w: 4, h: 4 },
      datasource: DS,
      fieldConfig: {
        defaults: {
          displayName: "Fallos Logon (24h)",
          noValue: "0",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: C.ok, value: null },
              { color: C.average, value: 400 },
              { color: C.high, value: 1000 },
              { color: C.disaster, value: 2500 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], fields: "", values: false },
        textMode: "value_and_name",
        colorMode: "background",
        graphMode: "none",
        justifyMode: "center",
        orientation: "auto"
      },
      targets: [
        createMetricTarget("A", "SRO-DCO01", "Total Intentos Fallidos (24h - Multi-DC)")
      ]
    },
    // STAT 3: Fallos Kerberos Pre-Auth (24h)
    {
      id: 153,
      title: "",
      description: "Fallos de preautenticación Kerberos (Event 4771) en las últimas 24 horas (ej. credenciales cacheadas / reintentos automáticos).",
      type: "stat",
      gridPos: { x: 8, y: 63, w: 4, h: 4 },
      datasource: DS,
      fieldConfig: {
        defaults: {
          displayName: "Preauth Kerb (24h)",
          noValue: "0",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: C.ok, value: null },
              { color: C.average, value: 2000 },
              { color: C.high, value: 6000 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], fields: "", values: false },
        textMode: "value_and_name",
        colorMode: "background",
        graphMode: "none",
        justifyMode: "center",
        orientation: "auto"
      },
      targets: [
        createMetricTarget("A", "SRO-DCO01", "Fallos Preautenticación Kerberos (24h - Multi-DC)")
      ]
    },
    // STAT 4: Ratio NTLM / Kerberos (24h)
    {
      id: 154,
      title: "",
      description: "Proporción de autenticaciones legadas NTLM vs Kerberos moderno en el dominio (Postura de seguridad: <15% es óptimo).",
      type: "stat",
      gridPos: { x: 12, y: 63, w: 4, h: 4 },
      datasource: DS,
      fieldConfig: {
        defaults: {
          displayName: "Ratio NTLM / Kerb",
          noValue: "0",
          unit: "percentunit",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: C.ok, value: null },
              { color: C.average, value: 0.15 },
              { color: C.high, value: 0.35 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], fields: "", values: false },
        textMode: "value_and_name",
        colorMode: "background",
        graphMode: "none",
        justifyMode: "center",
        orientation: "auto"
      },
      targets: [
        createMetricTarget("A", "SRO-DCO01", "Ratio Autenticación NTLM / Kerberos (24h)")
      ]
    },
    // DIRECT LINK CARD
    {
      id: 155,
      title: "🏛️ Navegación al Centro Forense AD (SOC)",
      type: "text",
      gridPos: { x: 16, y: 63, w: 8, h: 4 },
      options: {
        mode: "html",
        content: `<div style="background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); padding: 12px 16px; border-radius: 8px; border-left: 4px solid #EA580C; height: 100%; display: flex; flex-direction: column; justify-content: center;">
          <div style="font-size: 13px; font-weight: 700; color: #F8FAFC; margin-bottom: 4px;">Auditoría Forense Integral de Identidades</div>
          <div style="font-size: 11px; color: #94A3B8; margin-bottom: 8px;">Salud del Bosque, matriz de réplica NTDS, servicios de dominio y telemetría Multi-DC.</div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <a href="/d/milicic-activedirectory-soc/9ea775c?from=now-7d&to=now" target="_blank" style="display: inline-block; background: #EA580C; color: white; padding: 6px 12px; border-radius: 4px; font-weight: 600; text-decoration: none; font-size: 11px; width: fit-content;">
              🔍 Abrir Dashboard Forense AD (SOC) ➔
            </a>
            <a href="https://zabbix.mlccnet.local/zabbix.php?action=dashboard.view&dashboardid=411" target="_blank" style="display: inline-block; background: #1E293B; border: 1px solid #334155; color: #38BDF8; padding: 6px 12px; border-radius: 4px; font-weight: 600; text-decoration: none; font-size: 11px; width: fit-content;">
              📊 Ver Dashboard 411 en Zabbix ➔
            </a>
          </div>
        </div>`
      }
    },
    // TABLE 1: Forense Bloqueos
    {
      id: 156,
      title: "🔒 Auditoría Forense de Bloqueos de Cuenta (Event 4740) — Últimos Eventos Registrados",
      description: "Correlación de cuenta bloqueada y equipo origen en los controladores de dominio.",
      type: "table",
      gridPos: { x: 0, y: 67, w: 12, h: 8 },
      datasource: DS,
      timeFrom: "7d",
      targets: [
        createTextTarget("DCO01_USER", "SRO-DCO01", "User locked Name"),
        createTextTarget("DCO01_PC", "SRO-DCO01", "User Locked PC"),
        createTextTarget("DCO02_USER", "SRO-DCO02", "User locked Name"),
        createTextTarget("DCO02_PC", "SRO-DCO02", "User Locked PC"),
        createTextTarget("SSJ_USER", "SSJ-DCO01", "User locked Name"),
        createTextTarget("SSJ_PC", "SSJ-DCO01", "User Locked PC")
      ],
      transformations: [
        { id: "merge", options: {} },
        {
          id: "organize",
          options: {
            excludeByName: { "Key": true },
            indexByName: { "Host": 0, "Item": 1, "Last value": 2, "Value": 2 },
            renameByName: {
              "Host": "Controlador DC",
              "Item": "Métrica Forense",
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
      ],
      fieldConfig: {
        defaults: {
          custom: { align: "left", cellOptions: { type: "auto" }, filterable: true, minWidth: 120 }
        },
        overrides: [
          {
            matcher: { id: "byName", options: "Controlador DC" },
            properties: [
              { id: "custom.width", value: 120 },
              { id: "custom.cellOptions", value: { type: "color-text" } }
            ]
          },
          {
            matcher: { id: "byName", options: "Métrica Forense" },
            properties: [
              { id: "custom.width", value: 180 },
              { id: "mappings", value: [
                { type: "regex", options: { pattern: ".*User locked Name.*", result: { text: "👤 Usuario Bloqueado", color: "orange" } } },
                { type: "regex", options: { pattern: ".*User Locked PC.*", result: { text: "💻 Equipo Origen", color: "blue" } } }
              ]}
            ]
          },
          {
            matcher: { id: "byName", options: "Valor Registrado" },
            properties: [
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
            ]
          }
        ]
      },
      options: {
        showHeader: true,
        sortBy: [{ displayName: "Controlador DC", desc: false }],
        footer: { show: false, reducer: ["sum"] }
      }
    },
    // TABLE 2: Forense Grupos Privilegiados
    {
      id: 157,
      title: "👥 Auditoría Forense de Grupos Privilegiados (Event IDs 4728 · 4732 · 4756)",
      description: "Modificación de pertenencia a grupos de administración y seguridad.",
      type: "table",
      gridPos: { x: 12, y: 67, w: 12, h: 8 },
      datasource: DS,
      timeFrom: "7d",
      targets: [
        // SRO-DCO01
        createTextTarget("DCO01_OP", "SRO-DCO01", "Operador de Modificación de Grupo"),
        createTextTarget("DCO01_GRP", "SRO-DCO01", "Nombre de Grupo Modificado"),
        createTextTarget("DCO01_MBR", "SRO-DCO01", "Miembro Afectado de Grupo"),
        createTextTarget("DCO01_ACT", "SRO-DCO01", "Acción de Modificación de Grupo"),
        // SRO-DCO02
        createTextTarget("DCO02_OP", "SRO-DCO02", "Operador de Modificación de Grupo"),
        createTextTarget("DCO02_GRP", "SRO-DCO02", "Nombre de Grupo Modificado"),
        createTextTarget("DCO02_MBR", "SRO-DCO02", "Miembro Afectado de Grupo"),
        createTextTarget("DCO02_ACT", "SRO-DCO02", "Acción de Modificación de Grupo"),
        // SSJ-DCO01
        createTextTarget("SSJ_OP", "SSJ-DCO01", "Operador de Modificación de Grupo"),
        createTextTarget("SSJ_GRP", "SSJ-DCO01", "Nombre de Grupo Modificado"),
        createTextTarget("SSJ_MBR", "SSJ-DCO01", "Miembro Afectado de Grupo"),
        createTextTarget("SSJ_ACT", "SSJ-DCO01", "Acción de Modificación de Grupo")
      ],
      transformations: [
        { id: "merge", options: {} },
        {
          id: "organize",
          options: {
            excludeByName: { "Key": true },
            indexByName: { "Host": 0, "Item": 1, "Last value": 2, "Value": 2 },
            renameByName: {
              "Host": "Controlador DC",
              "Item": "Campo de Auditoría",
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
      ],
      fieldConfig: {
        defaults: {
          custom: { align: "left", cellOptions: { type: "auto" }, filterable: true, minWidth: 120 }
        },
        overrides: [
          {
            matcher: { id: "byName", options: "Controlador DC" },
            properties: [
              { id: "custom.width", value: 120 },
              { id: "custom.cellOptions", value: { type: "color-text" } }
            ]
          },
          {
            matcher: { id: "Campo de Auditoría" },
            properties: [
              { id: "custom.width", value: 200 },
              { id: "mappings", value: [
                { type: "regex", options: { pattern: ".*Operador.*", result: { text: "🛡️ Operador Responsable", color: "purple" } } },
                { type: "regex", options: { pattern: ".*Nombre de Grupo.*", result: { text: "📁 Grupo Modificado", color: "orange" } } },
                { type: "regex", options: { pattern: ".*Miembro.*", result: { text: "👤 Miembro Afectado", color: "blue" } } },
                { type: "regex", options: { pattern: ".*Acción.*", result: { text: "⚡ Acción", color: "green" } } }
              ]}
            ]
          },
          {
            matcher: { id: "byName", options: "Detalle Registrado" },
            properties: [
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
            ]
          }
        ]
      },
      options: {
        showHeader: true,
        sortBy: [{ displayName: "Controlador DC", desc: false }],
        footer: { show: false, reducer: ["sum"] }
      }
    }
  ];

  d.panels.push(...socPanels);

  console.log('2. Deploying updated noc-zabbix-command-center...');
  const saveRes = await grafanaRequest('POST', '/api/dashboards/db', {
    dashboard: d,
    folderId: meta.folderId || 0,
    overwrite: true,
    message: 'Fix stat cards truncation with value_and_name, adjust realistic thresholds, and fix Zabbix direct history links'
  });

  if (saveRes.status !== 200) {
    throw new Error(`Failed to save dashboard: ${saveRes.status} - ${JSON.stringify(saveRes.data)}`);
  }

  console.log('SUCCESS! NOC Command Center updated:');
  console.log(`URL: http://172.27.210.154:3005${saveRes.data.url}`);
  console.log(`Version: ${saveRes.data.version}`);
}

fixDisplay().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
