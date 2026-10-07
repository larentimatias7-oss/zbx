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

async function updateDashboard() {
  console.log('1. Fetching current dashboard milicic-activedirectory-soc...');
  const res = await grafanaRequest('GET', '/api/dashboards/uid/milicic-activedirectory-soc');
  if (res.status !== 200) {
    throw new Error(`Failed to get dashboard: ${res.status} - ${JSON.stringify(res.data)}`);
  }

  const d = res.data.dashboard;
  const meta = res.data.meta;
  console.log(`Current version: ${d.version}`);

  // Backup
  fs.writeFileSync('.zabbix_context/dashboards/milicic-activedirectory-soc-pre-update.json', JSON.stringify(d, null, 2), 'utf8');

  // 1. Templating: Ensure forensic_window exists
  if (!d.templating) d.templating = { list: [] };
  const hasWindow = d.templating.list.some(v => v.name === 'forensic_window');
  if (!hasWindow) {
    d.templating.list.push({
      name: "forensic_window",
      label: "⏳ Ventana Forense",
      type: "custom",
      query: "7 Días (Recomendado) : 7d, 24 Horas : 24h, 15 Días : 15d, 30 Días (Mes) : 30d",
      current: { text: "7 Días (Recomendado)", value: "7d" },
      options: [
        { text: "7 Días (Recomendado)", value: "7d", selected: true },
        { text: "24 Horas", value: "24h", selected: false },
        { text: "15 Días", value: "15d", selected: false },
        { text: "30 Días (Mes)", value: "30d", selected: false }
      ],
      includeAll: false,
      hide: 0
    });
    console.log('Added template variable forensic_window');
  }

  const DS = { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" };

  // 2. Redesign Panel 60: Historial Forense de Bloqueos (Event 4740)
  const p60Idx = d.panels.findIndex(p => p.id === 60);
  const p60 = {
    id: 60,
    title: "🔒 Historial Forense de Bloqueos (Event 4740) — Usuario & Equipo Origen",
    description: "Auditoría forense de bloqueos de cuenta de Active Directory en el dominio MLCCNET.LOCAL con correlación de Usuario y Workstation origen.",
    type: "table",
    gridPos: { x: 0, y: 46, w: 24, h: 9 },
    datasource: DS,
    timeFrom: "${forensic_window}",
    targets: [
      {
        refId: "USER",
        schema: 12,
        queryType: "2",
        group: { filter: "AD" },
        host: { filter: "/${dc:raw}/" },
        application: { filter: "" },
        item: { filter: "User locked Name" },
        functions: [],
        resultFormat: "table",
        options: { disableDataAlignment: false, showDisabledItems: false, skipEmptyValues: false, useZabbixValueMapping: false },
        table: { skipEmptyValues: false }
      },
      {
        refId: "PC",
        schema: 12,
        queryType: "2",
        group: { filter: "AD" },
        host: { filter: "/${dc:raw}/" },
        application: { filter: "" },
        item: { filter: "User Locked PC" },
        functions: [],
        resultFormat: "table",
        options: { disableDataAlignment: false, showDisabledItems: false, skipEmptyValues: false, useZabbixValueMapping: false },
        table: { skipEmptyValues: false }
      },
      {
        refId: "RAW",
        schema: 12,
        queryType: "2",
        group: { filter: "AD" },
        host: { filter: "/${dc:raw}/" },
        application: { filter: "" },
        item: { filter: "Eventlog by Zabbix agent: User locked" },
        functions: [],
        resultFormat: "table",
        options: { disableDataAlignment: false, showDisabledItems: false, skipEmptyValues: false, useZabbixValueMapping: false },
        table: { skipEmptyValues: false }
      }
    ],
    transformations: [
      { id: "merge", options: {} },
      {
        id: "filterByValue",
        options: {
          type: "include",
          match: "regex",
          filters: [
            {
              fieldName: "Last value",
              config: { id: "regex", options: { value: ".*${search:raw}.*" } }
            }
          ]
        }
      },
      {
        id: "organize",
        options: {
          excludeByName: { "Key": true },
          indexByName: { "Host": 0, "Item": 1, "Last value": 2, "Value": 2 },
          renameByName: {
            "Host": "Controlador DC",
            "Item": "Métrica Forense Extraída",
            "Last value": "Valor Registrado (Usuario / Equipo Origen / Log)",
            "Value": "Valor Registrado (Usuario / Equipo Origen / Log)"
          }
        }
      }
    ],
    fieldConfig: {
      defaults: {
        custom: { align: "left", cellOptions: { type: "auto" }, filterable: true, minWidth: 140 }
      },
      overrides: [
        {
          matcher: { id: "byName", options: "Controlador DC" },
          properties: [
            { id: "custom.width", value: 140 },
            { id: "custom.cellOptions", value: { type: "color-text" } }
          ]
        },
        {
          matcher: { id: "byName", options: "Métrica Forense Extraída" },
          properties: [
            { id: "custom.width", value: 240 },
            { id: "mappings", value: [
              { type: "regex", options: { pattern: ".*User locked Name.*", result: { text: "👤 Usuario Bloqueado", color: "orange" } } },
              { type: "regex", options: { pattern: ".*User Locked PC.*", result: { text: "💻 Equipo Origen (Workstation)", color: "blue" } } },
              { type: "regex", options: { pattern: ".*Eventlog.*", result: { text: "📄 Log Forense Completo (Raw)", color: "text" } } }
            ]}
          ]
        },
        {
          matcher: { id: "byName", options: "Valor Registrado (Usuario / Equipo Origen / Log)" },
          properties: [
            { id: "custom.inspect", value: true },
            { id: "links", value: [
              { title: "🔍 Ver Historial en Zabbix", url: "https://zabbix.mlccnet.local/history.php?action=showlatest", targetBlank: true }
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
  };

  if (p60Idx !== -1) {
    d.panels[p60Idx] = p60;
  } else {
    d.panels.push(p60);
  }

  // 3. Redesign Panel 61: Auditoría Forense: Modificación de Grupos Privilegiados
  const p61Idx = d.panels.findIndex(p => p.id === 61);
  const p61 = {
    id: 61,
    title: "👥 Auditoría Forense: Modificación de Grupos Privilegiados (Event IDs 4728 · 4732 · 4756)",
    description: "Trazabilidad de cambios en membresía de grupos de seguridad y accesos críticos (SAP, FileServer, Grupos Admin) con separación de Operador, Grupo y Miembro.",
    type: "table",
    gridPos: { x: 0, y: 55, w: 24, h: 9 },
    datasource: DS,
    timeFrom: "${forensic_window}",
    targets: [
      {
        refId: "ACTION",
        schema: 12,
        queryType: "2",
        group: { filter: "AD" },
        host: { filter: "/${dc:raw}/" },
        application: { filter: "" },
        item: { filter: "Acción de Modificación de Grupo" },
        functions: [],
        resultFormat: "table",
        options: { disableDataAlignment: false, showDisabledItems: false, skipEmptyValues: false, useZabbixValueMapping: false },
        table: { skipEmptyValues: false }
      },
      {
        refId: "GROUP",
        schema: 12,
        queryType: "2",
        group: { filter: "AD" },
        host: { filter: "/${dc:raw}/" },
        application: { filter: "" },
        item: { filter: "Nombre de Grupo Modificado" },
        functions: [],
        resultFormat: "table",
        options: { disableDataAlignment: false, showDisabledItems: false, skipEmptyValues: false, useZabbixValueMapping: false },
        table: { skipEmptyValues: false }
      },
      {
        refId: "MEMBER",
        schema: 12,
        queryType: "2",
        group: { filter: "AD" },
        host: { filter: "/${dc:raw}/" },
        application: { filter: "" },
        item: { filter: "Miembro Afectado de Grupo" },
        functions: [],
        resultFormat: "table",
        options: { disableDataAlignment: false, showDisabledItems: false, skipEmptyValues: false, useZabbixValueMapping: false },
        table: { skipEmptyValues: false }
      },
      {
        refId: "OPERATOR",
        schema: 12,
        queryType: "2",
        group: { filter: "AD" },
        host: { filter: "/${dc:raw}/" },
        application: { filter: "" },
        item: { filter: "Operador de Modificación de Grupo" },
        functions: [],
        resultFormat: "table",
        options: { disableDataAlignment: false, showDisabledItems: false, skipEmptyValues: false, useZabbixValueMapping: false },
        table: { skipEmptyValues: false }
      },
      {
        refId: "RAW_EVENT",
        schema: 12,
        queryType: "2",
        group: { filter: "AD" },
        host: { filter: "/${dc:raw}/" },
        application: { filter: "" },
        item: { filter: "Eventlog: Modificación de Grupos Privilegiados (4728, 4732, 4756)" },
        functions: [],
        resultFormat: "table",
        options: { disableDataAlignment: false, showDisabledItems: false, skipEmptyValues: false, useZabbixValueMapping: false },
        table: { skipEmptyValues: false }
      }
    ],
    transformations: [
      { id: "merge", options: {} },
      {
        id: "filterByValue",
        options: {
          type: "include",
          match: "regex",
          filters: [
            {
              fieldName: "Last value",
              config: { id: "regex", options: { value: ".*${search:raw}.*" } }
            }
          ]
        }
      },
      {
        id: "organize",
        options: {
          excludeByName: { "Key": true },
          indexByName: { "Host": 0, "Item": 1, "Last value": 2, "Value": 2 },
          renameByName: {
            "Host": "Controlador DC",
            "Item": "Campo de Auditoría Forense",
            "Last value": "Detalle Registrado (Operador / Grupo / Miembro / Acción)",
            "Value": "Detalle Registrado (Operador / Grupo / Miembro / Acción)"
          }
        }
      }
    ],
    fieldConfig: {
      defaults: {
        custom: { align: "left", cellOptions: { type: "auto" }, filterable: true, minWidth: 140 }
      },
      overrides: [
        {
          matcher: { id: "byName", options: "Controlador DC" },
          properties: [
            { id: "custom.width", value: 140 },
            { id: "custom.cellOptions", value: { type: "color-text" } }
          ]
        },
        {
          matcher: { id: "byName", options: "Campo de Auditoría Forense" },
          properties: [
            { id: "custom.width", value: 240 },
            { id: "mappings", value: [
              { type: "regex", options: { pattern: ".*Operador.*", result: { text: "🛡️ Operador Responsable", color: "purple" } } },
              { type: "regex", options: { pattern: ".*Nombre de Grupo.*", result: { text: "📁 Grupo Modificado", color: "orange" } } },
              { type: "regex", options: { pattern: ".*Miembro Afectado.*", result: { text: "👤 Miembro Añadido/Removido", color: "blue" } } },
              { type: "regex", options: { pattern: ".*Acción.*", result: { text: "⚡ Acción Realizada", color: "green" } } },
              { type: "regex", options: { pattern: ".*Eventlog.*", result: { text: "📄 Log Crudo Completo", color: "text" } } }
            ]}
          ]
        },
        {
          matcher: { id: "byName", options: "Detalle Registrado (Operador / Grupo / Miembro / Acción)" },
          properties: [
            { id: "custom.inspect", value: true },
            { id: "mappings", value: [
              { type: "regex", options: { pattern: ".*added.*", result: { text: "➕ Miembro Añadido a Grupo de Seguridad", color: "green" } } },
              { type: "regex", options: { pattern: ".*removed.*", result: { text: "➖ Miembro Removido de Grupo de Seguridad", color: "red" } } }
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
  };

  if (p61Idx !== -1) {
    d.panels[p61Idx] = p61;
  } else {
    d.panels.push(p61);
  }

  // 4. Save to Grafana
  console.log('2. Deploying updated dashboard to Grafana...');
  const saveRes = await grafanaRequest('POST', '/api/dashboards/db', {
    dashboard: d,
    folderId: meta.folderId || 0,
    overwrite: true,
    message: 'Redesign Forensic Panels 60 (Lockout User & PC) and 61 (Privileged Group Changes) with normalized Zabbix dependent items'
  });

  if (saveRes.status !== 200) {
    throw new Error(`Failed to save dashboard: ${saveRes.status} - ${JSON.stringify(saveRes.data)}`);
  }

  console.log('SUCCESS! Dashboard updated cleanly:');
  console.log(`URL: http://172.27.210.154:3005${saveRes.data.url}`);
  console.log(`Version: ${saveRes.data.version}`);
}

updateDashboard().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
