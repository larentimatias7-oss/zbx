const fs = require('fs');

let content = fs.readFileSync('scripts/build_activedirectory_dashboard.mjs', 'utf8');

const startMarker = '    {\n      id: 50,';
const endMarker   = '\n  ]\n};';

const startIdx = content.indexOf(startMarker);
const endIdx   = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Markers not found:', startIdx, endIdx);
  process.exit(1);
}

const before = content.substring(0, startIdx);
const after  = endMarker + content.substring(endIdx + endMarker.length);

// El datasource devuelve cada problema como JSON string en una columna.
// Con extractFields parseamos el JSON en columnas separadas.
// Luego ocultamos todo excepto: severity, name, hosts, acknowledged
// Y los formateamos con overrides.
const newPanel = `    {
      id: 50,
      title: "Incidentes y Alarmas Activas en Active Directory",
      type: "table",
      gridPos: { x: 0, y: 40, w: 24, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      transformations: [
        {
          id: "extractFields",
          options: {
            format: "json",
            keepTime: false,
            replace: true,
            source: "Problems"
          }
        },
        {
          id: "organize",
          options: {
            excludeByName: {
              "triggerid": true,
              "eventid": true,
              "r_clock": true,
              "objectid": true,
              "value": true,
              "opdata": true,
              "url": true,
              "expression": true,
              "correlation_mode": true,
              "correlation_tag": true,
              "manual_close": true,
              "state": true,
              "error": true,
              "hostInMaintenance": true,
              "maintenance": true,
              "showAckButton": true,
              "datasource": true,
              "suppressed": true,
              "suppression_data": true,
              "acknowledges": true,
              "tags": true,
              "items": true,
              "groups": true,
              "description": true,
              "comments": true
            },
            indexByName: {
              "severity":     0,
              "timestamp":    1,
              "name":         2,
              "hosts":        3,
              "acknowledged": 4
            },
            renameByName: {
              "severity":     "Severidad",
              "timestamp":    "Inicio",
              "name":         "Problema",
              "hosts":        "Host",
              "acknowledged": "ACK"
            }
          }
        }
      ],
      fieldConfig: {
        defaults: {
          custom: {
            align: "left",
            cellOptions: { type: "auto" },
            filterable: false
          }
        },
        overrides: [
          {
            matcher: { id: "byName", options: "Severidad" },
            properties: [
              { id: "custom.width", value: 130 },
              {
                id: "mappings",
                value: [
                  { type: "value", options: { "0": { text: "—",           color: "text",   index: 0 } } },
                  { type: "value", options: { "1": { text: "INFO",         color: "#64748b",index: 1 } } },
                  { type: "value", options: { "2": { text: "ADVERTENCIA",  color: "#FFC859",index: 2 } } },
                  { type: "value", options: { "3": { text: "PROMEDIO",     color: "#FF9800",index: 3 } } },
                  { type: "value", options: { "4": { text: "ALTO",         color: "#E45959",index: 4 } } },
                  { type: "value", options: { "5": { text: "DESASTRE",     color: "#cc44ff",index: 5 } } }
                ]
              },
              { id: "custom.cellOptions", value: { type: "color-background", mode: "gradient" } }
            ]
          },
          {
            matcher: { id: "byName", options: "Inicio" },
            properties: [
              { id: "unit", value: "dateTimeAsLocal" },
              { id: "custom.width", value: 140 }
            ]
          },
          {
            matcher: { id: "byName", options: "Problema" },
            properties: [
              { id: "custom.width", value: 460 }
            ]
          },
          {
            matcher: { id: "byName", options: "Host" },
            properties: [
              { id: "custom.width", value: 140 }
            ]
          },
          {
            matcher: { id: "byName", options: "ACK" },
            properties: [
              { id: "custom.width", value: 70 },
              {
                id: "mappings",
                value: [
                  { type: "value", options: { "0": { text: "No", color: "#6b7280", index: 0 } } },
                  { type: "value", options: { "1": { text: "✓ Sí", color: "#16A34A", index: 1 } } }
                ]
              },
              { id: "custom.cellOptions", value: { type: "color-text" } }
            ]
          }
        ]
      },
      options: {
        sortBy: [{ displayName: "Severidad", desc: true }],
        frameIndex: 0,
        showHeader: true,
        footer: { show: false, reducer: ["sum"] }
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "5",
          group: { filter: "AD" },
          host: { filter: "/\${dc:raw}/" },
          trigger: { filter: "/.*/\" },
          options: { acknowledged: 2, minSeverity: 1 }
        }
      ]
    }`;

const newContent = before + newPanel + '\n  ]\n};' + content.substring(endIdx + '\n  ]\n};'.length);
fs.writeFileSync('scripts/build_activedirectory_dashboard.mjs', newContent, 'utf8');
console.log('OK - Panel 50 con extractFields + organize transformations. Size:', newContent.length);
