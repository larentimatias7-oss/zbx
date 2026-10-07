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

function createTarget(refId, host, item, queryType = "2", resultFormat = "table") {
  return {
    refId,
    schema: 12,
    queryType,
    group: { filter: "AD" },
    host: { filter: host },
    application: { filter: "" },
    item: { filter: item },
    functions: [],
    resultFormat,
    options: { ...defaultOptions },
    table: { ...defaultTable }
  };
}

async function fixNocPanels() {
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
    // STAT 1: Cuentas Bloqueadas (Event 4740)
    {
      id: 151,
      title: "Cuentas Bloqueadas (Event 4740)",
      description: "Conteo de eventos de bloqueo de cuentas en controladores de dominio.",
      type: "stat",
      gridPos: { x: 0, y: 63, w: 4, h: 4 },
      datasource: DS,
      timeFrom: "7d",
      fieldConfig: {
        defaults: {
          noValue: "0",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: C.ok, value: null },
              { color: C.high, value: 1 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["count"], fields: "", values: false },
        textMode: "value",
        colorMode: "background",
        graphMode: "none",
        justifyMode: "center"
      },
      targets: [
        createTarget("DCO01", "SRO-DCO01", "User locked Name"),
        createTarget("DCO02", "SRO-DCO02", "User locked Name"),
        createTarget("SSJ", "SSJ-DCO01", "User locked Name")
      ]
    },
    // STAT 2: Fallos Logon NTLM (Event 4625)
    {
      id: 152,
      title: "Logons Fallidos NTLM (Event 4625)",
      description: "Intentos de inicio de sesión rechazados en el bosque en los últimos 7 días.",
      type: "stat",
      gridPos: { x: 4, y: 63, w: 4, h: 4 },
      datasource: DS,
      timeFrom: "7d",
      fieldConfig: {
        defaults: {
          noValue: "0",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: C.ok, value: null },
              { color: C.warning, value: 5 },
              { color: C.high, value: 20 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["count"], fields: "", values: false },
        textMode: "value",
        colorMode: "background",
        graphMode: "none",
        justifyMode: "center"
      },
      targets: [
        createTarget("DCO01", "SRO-DCO01", "Eventlog by Zabbix agent: Failed Login"),
        createTarget("DCO02", "SRO-DCO02", "Eventlog by Zabbix agent: Failed Login"),
        createTarget("SSJ", "SSJ-DCO01", "Eventlog by Zabbix agent: Failed Login")
      ]
    },
    // STAT 3: Fallos Preauth Kerberos (4771)
    {
      id: 153,
      title: "Fallos Pre-Auth Kerberos (4771)",
      description: "Errores de preautenticación Kerberos (clave errónea o desincronizada).",
      type: "stat",
      gridPos: { x: 8, y: 63, w: 4, h: 4 },
      datasource: DS,
      timeFrom: "7d",
      fieldConfig: {
        defaults: {
          noValue: "0",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: C.ok, value: null },
              { color: C.warning, value: 5 },
              { color: C.high, value: 15 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["count"], fields: "", values: false },
        textMode: "value",
        colorMode: "background",
        graphMode: "none",
        justifyMode: "center"
      },
      targets: [
        createTarget("DCO01", "SRO-DCO01", "Eventlog: Fallo de Preautenticación Kerberos (4771)"),
        createTarget("DCO02", "SRO-DCO02", "Eventlog: Fallo de Preautenticación Kerberos (4771)"),
        createTarget("SSJ", "SSJ-DCO01", "Eventlog: Fallo de Preautenticación Kerberos (4771)")
      ]
    },
    // STAT 4: Modificaciones en Grupos Admin
    {
      id: 154,
      title: "Modif. Grupos Admin (4728/4732)",
      description: "Cambios de membresía en grupos privilegiados de seguridad en los últimos 7 días.",
      type: "stat",
      gridPos: { x: 12, y: 63, w: 4, h: 4 },
      datasource: DS,
      timeFrom: "7d",
      fieldConfig: {
        defaults: {
          noValue: "0",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: C.ok, value: null },
              { color: C.average, value: 1 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["count"], fields: "", values: false },
        textMode: "value",
        colorMode: "background",
        graphMode: "none",
        justifyMode: "center"
      },
      targets: [
        createTarget("DCO01", "SRO-DCO01", "Nombre de Grupo Modificado"),
        createTarget("DCO02", "SRO-DCO02", "Nombre de Grupo Modificado"),
        createTarget("SSJ", "SSJ-DCO01", "Nombre de Grupo Modificado")
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
          <a href="/d/milicic-activedirectory-soc/9ea775c?from=now-7d&to=now" target="_blank" style="display: inline-block; background: #EA580C; color: white; padding: 6px 14px; border-radius: 4px; font-weight: 600; text-decoration: none; font-size: 11px; width: fit-content;">
            🔍 Abrir Dashboard Forense AD (SOC) ➔
          </a>
        </div>`
      }
    },
    // TABLE 1: Forense Bloqueos
    {
      id: 156,
      title: "🔒 Auditoría Forense de Bloqueos de Cuenta (Event 4740) — Usuario & PC Origen",
      description: "Correlación de cuenta bloqueada y equipo origen en los controladores.",
      type: "table",
      gridPos: { x: 0, y: 67, w: 12, h: 8 },
      datasource: DS,
      timeFrom: "7d",
      targets: [
        createTarget("DCO01_USER", "SRO-DCO01", "User locked Name"),
        createTarget("DCO01_PC", "SRO-DCO01", "User Locked PC"),
        createTarget("DCO02_USER", "SRO-DCO02", "User locked Name"),
        createTarget("DCO02_PC", "SRO-DCO02", "User Locked PC"),
        createTarget("SSJ_USER", "SSJ-DCO01", "User locked Name"),
        createTarget("SSJ_PC", "SSJ-DCO01", "User Locked PC")
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
                { title: "🔍 Ver Logs en Zabbix", url: "https://zabbix.mlccnet.local/history.php?action=showlatest", targetBlank: true }
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
        createTarget("DCO01_ACT", "SRO-DCO01", "Acción de Modificación de Grupo"),
        createTarget("DCO01_GRP", "SRO-DCO01", "Nombre de Grupo Modificado"),
        createTarget("DCO01_MBR", "SRO-DCO01", "Miembro Afectado de Grupo"),
        createTarget("DCO01_OP", "SRO-DCO01", "Operador de Modificación de Grupo"),
        createTarget("DCO02_ACT", "SRO-DCO02", "Acción de Modificación de Grupo"),
        createTarget("DCO02_GRP", "SRO-DCO02", "Nombre de Grupo Modificado"),
        createTarget("DCO02_MBR", "SRO-DCO02", "Miembro Afectado de Grupo"),
        createTarget("DCO02_OP", "SRO-DCO02", "Operador de Modificación de Grupo"),
        createTarget("SSJ_ACT", "SSJ-DCO01", "Acción de Modificación de Grupo"),
        createTarget("SSJ_GRP", "SSJ-DCO01", "Nombre de Grupo Modificado"),
        createTarget("SSJ_MBR", "SSJ-DCO01", "Miembro Afectado de Grupo"),
        createTarget("SSJ_OP", "SSJ-DCO01", "Operador de Modificación de Grupo")
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
            matcher: { id: "byName", options: "Campo de Auditoría" },
            properties: [
              { id: "custom.width", value: 180 },
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
                { title: "🔍 Ver Logs en Zabbix", url: "https://zabbix.mlccnet.local/history.php?action=showlatest", targetBlank: true }
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

  console.log('2. Deploying updated noc-zabbix-command-center with clean target options and timeFrom: 7d...');
  const saveRes = await grafanaRequest('POST', '/api/dashboards/db', {
    dashboard: d,
    folderId: meta.folderId || 0,
    overwrite: true,
    message: 'Fix table.skipEmptyValues error and set timeFrom: 7d for Cyber SOC panels'
  });

  if (saveRes.status !== 200) {
    throw new Error(`Failed to save dashboard: ${saveRes.status} - ${JSON.stringify(saveRes.data)}`);
  }

  console.log('SUCCESS! NOC Command Center updated:');
  console.log(`URL: http://172.27.210.154:3005${saveRes.data.url}`);
  console.log(`Version: ${saveRes.data.version}`);
}

fixNocPanels().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
