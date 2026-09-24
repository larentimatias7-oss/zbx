const fs = require('fs');

let content = fs.readFileSync('scripts/build_activedirectory_dashboard.mjs', 'utf8');

// Buscar el cierre del array de panels y del objeto dashboard
// La estructura al final es:   { panel50 }  \n  ]\n};
const endMarker = '\n  ]\n};';
const endIdx    = content.indexOf(endMarker);
if (endIdx === -1) { console.error('endMarker not found'); process.exit(1); }

// ---------------------------------------------------------------------------
// Función helper para construir targets de eventlog
// resultFormat "table" devuelve filas con Time + Value (texto del evento)
// ---------------------------------------------------------------------------

// Transformaciones comunes para los paneles de log
// Los items de eventlog devuelven: Time, Value (texto completo del evento), host (en series name)
// Con merge y organize limpiamos y nombramos las columnas.
const logTableTransformations = (valueColName) => JSON.stringify([
  {
    id: "merge",
    options: {}
  },
  {
    id: "organize",
    options: {
      excludeByName: {},
      indexByName: {
        "Time": 0
      },
      renameByName: {
        "Time":  "Fecha / Hora",
        "Value": valueColName
      }
    }
  }
]);

// Overrides comunes para columna de tiempo y valor en log panels
const logTableFieldConfig = (valueLabel) => JSON.stringify({
  defaults: {
    custom: {
      align: "left",
      cellOptions: { type: "auto" },
      filterable: true,
      minWidth: 140
    }
  },
  overrides: [
    {
      matcher: { id: "byName", options: "Fecha / Hora" },
      properties: [
        { id: "unit", value: "dateTimeAsLocal" },
        { id: "custom.width", value: 170 },
        { id: "custom.filterable", value: true }
      ]
    },
    {
      matcher: { id: "byName", options: valueLabel },
      properties: [
        { id: "custom.inspect", value: true },
        { id: "custom.filterable", value: true }
      ]
    }
  ]
});

// ===========================================================================
// PANEL 55 – ROW separator  "Auditoría Forense de Seguridad"
// ===========================================================================
const panel55 = `    {
      id: 55,
      title: "🔐 Auditoría Forense de Seguridad — Active Directory",
      type: "row",
      gridPos: { x: 0, y: 48, w: 24, h: 1 },
      collapsed: false,
      panels: []
    }`;

// ===========================================================================
// PANEL 60 – Historial de Bloqueos de Cuenta (Event 4740)
// Filterable: Fecha, DC origen, texto del evento (usuario + equipo)
// ===========================================================================
const panel60 = `    {
      id: 60,
      title: "🔒 Historial de Bloqueos de Cuenta (Event ID 4740)",
      type: "table",
      gridPos: { x: 0, y: 49, w: 24, h: 9 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      transformations: [
        { id: "merge", options: {} },
        {
          id: "organize",
          options: {
            excludeByName: {},
            indexByName: { "Time": 0 },
            renameByName: {
              "Time":  "Fecha / Hora",
              "Value": "Registro de Evento (Account Name · Caller Computer Name)"
            }
          }
        }
      ],
      fieldConfig: {
        defaults: {
          custom: {
            align: "left",
            cellOptions: { type: "auto" },
            filterable: true,
            minWidth: 140
          }
        },
        overrides: [
          {
            matcher: { id: "byName", options: "Fecha / Hora" },
            properties: [
              { id: "unit", value: "dateTimeAsLocal" },
              { id: "custom.width", value: 170 },
              { id: "custom.filterable", value: true }
            ]
          },
          {
            matcher: { id: "byName", options: "Registro de Evento (Account Name · Caller Computer Name)" },
            properties: [
              { id: "custom.filterable", value: true },
              { id: "custom.inspect", value: true }
            ]
          }
        ]
      },
      options: {
        sortBy: [{ displayName: "Fecha / Hora", desc: true }],
        showHeader: true,
        footer: { show: false, reducer: ["sum"] }
      },
      targets: [
        {
          refId: "DCO01_4740",
          schema: 12,
          queryType: "0",
          group: { filter: "AD" },
          host: { filter: "SRO-DCO01" },
          application: { filter: "" },
          item: { filter: "Eventlog by Zabbix agent: User locked" },
          functions: [],
          resultFormat: "table",
          options: { showDisabledItems: false }
        },
        {
          refId: "DCO02_4740",
          schema: 12,
          queryType: "0",
          group: { filter: "AD" },
          host: { filter: "SRO-DCO02" },
          application: { filter: "" },
          item: { filter: "Eventlog by Zabbix agent: User locked" },
          functions: [],
          resultFormat: "table",
          options: { showDisabledItems: false }
        }
      ]
    }`;

// ===========================================================================
// PANEL 61 – Auditoría: Modificación de Grupos Privilegiados (4728/4732/4756)
// ===========================================================================
const panel61 = `    {
      id: 61,
      title: "👥 Modificación de Grupos Privilegiados (Event IDs 4728 · 4732 · 4756)",
      type: "table",
      gridPos: { x: 0, y: 58, w: 24, h: 9 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      transformations: [
        { id: "merge", options: {} },
        {
          id: "organize",
          options: {
            excludeByName: {},
            indexByName: { "Time": 0 },
            renameByName: {
              "Time":  "Fecha / Hora",
              "Value": "Registro de Evento (Subject · Member · Group Name)"
            }
          }
        }
      ],
      fieldConfig: {
        defaults: {
          custom: {
            align: "left",
            cellOptions: { type: "auto" },
            filterable: true,
            minWidth: 140
          }
        },
        overrides: [
          {
            matcher: { id: "byName", options: "Fecha / Hora" },
            properties: [
              { id: "unit", value: "dateTimeAsLocal" },
              { id: "custom.width", value: 170 },
              { id: "custom.filterable", value: true }
            ]
          },
          {
            matcher: { id: "byName", options: "Registro de Evento (Subject · Member · Group Name)" },
            properties: [
              { id: "custom.filterable", value: true },
              { id: "custom.inspect", value: true }
            ]
          }
        ]
      },
      options: {
        sortBy: [{ displayName: "Fecha / Hora", desc: true }],
        showHeader: true,
        footer: { show: false, reducer: ["sum"] }
      },
      targets: [
        {
          refId: "DCO01_GRP",
          schema: 12,
          queryType: "0",
          group: { filter: "AD" },
          host: { filter: "SRO-DCO01" },
          application: { filter: "" },
          item: { filter: "Eventlog: Modificación de Grupos Privilegiados (4728, 4732, 4756)" },
          functions: [],
          resultFormat: "table",
          options: { showDisabledItems: false }
        },
        {
          refId: "DCO02_GRP",
          schema: 12,
          queryType: "0",
          group: { filter: "AD" },
          host: { filter: "SRO-DCO02" },
          application: { filter: "" },
          item: { filter: "Eventlog: Modificación de Grupos Privilegiados (4728, 4732, 4756)" },
          functions: [],
          resultFormat: "table",
          options: { showDisabledItems: false }
        }
      ]
    }`;

// ===========================================================================
// PANEL 62 – Ciclo de Vida de Cuentas: Creación / Habilitación / Deshabilitación
// Solo SRO-DCO01 tiene estos items
// ===========================================================================
const panel62 = `    {
      id: 62,
      title: "👤 Ciclo de Vida de Cuentas — Creación · Habilitación · Deshabilitación (4720 · 4722 · 4725)",
      type: "table",
      gridPos: { x: 0, y: 67, w: 24, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      transformations: [
        { id: "merge", options: {} },
        {
          id: "organize",
          options: {
            excludeByName: {},
            indexByName: { "Time": 0 },
            renameByName: {
              "Time":  "Fecha / Hora",
              "Value": "Registro de Evento (Tipo · Account Name)"
            }
          }
        }
      ],
      fieldConfig: {
        defaults: {
          custom: {
            align: "left",
            cellOptions: { type: "auto" },
            filterable: true,
            minWidth: 140
          }
        },
        overrides: [
          {
            matcher: { id: "byName", options: "Fecha / Hora" },
            properties: [
              { id: "unit", value: "dateTimeAsLocal" },
              { id: "custom.width", value: 170 },
              { id: "custom.filterable", value: true }
            ]
          },
          {
            matcher: { id: "byName", options: "Registro de Evento (Tipo · Account Name)" },
            properties: [
              { id: "custom.filterable", value: true },
              { id: "custom.inspect", value: true }
            ]
          }
        ]
      },
      options: {
        sortBy: [{ displayName: "Fecha / Hora", desc: true }],
        showHeader: true,
        footer: { show: false, reducer: ["sum"] }
      },
      targets: [
        {
          refId: "DCO01_4720",
          schema: 12,
          queryType: "0",
          group: { filter: "AD" },
          host: { filter: "SRO-DCO01" },
          application: { filter: "" },
          item: { filter: "Eventlog by Zabbix agent: User Created" },
          functions: [],
          resultFormat: "table",
          options: { showDisabledItems: false }
        },
        {
          refId: "DCO01_4722",
          schema: 12,
          queryType: "0",
          group: { filter: "AD" },
          host: { filter: "SRO-DCO01" },
          application: { filter: "" },
          item: { filter: "Eventlog by Zabbix agent: User enabled" },
          functions: [],
          resultFormat: "table",
          options: { showDisabledItems: false }
        },
        {
          refId: "DCO01_4725",
          schema: 12,
          queryType: "0",
          group: { filter: "AD" },
          host: { filter: "SRO-DCO01" },
          application: { filter: "" },
          item: { filter: "Eventlog by Zabbix agent: User disabled" },
          functions: [],
          resultFormat: "table",
          options: { showDisabledItems: false }
        }
      ]
    }`;

// Insertar los 4 paneles nuevos antes del cierre del array de panels
const injection = `,\n${panel55},\n${panel60},\n${panel61},\n${panel62}`;

const newContent = content.substring(0, endIdx) + injection + endMarker + content.substring(endIdx + endMarker.length);

fs.writeFileSync('scripts/build_activedirectory_dashboard.mjs', newContent, 'utf8');
console.log('OK - Paneles 55, 60, 61, 62 agregados. Nuevo size:', newContent.length);
