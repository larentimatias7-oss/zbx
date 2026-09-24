const fs = require('fs');

let content = fs.readFileSync('scripts/build_activedirectory_dashboard.mjs', 'utf8');

// Reemplazar el panel 50: de Business Text a volkovlabs-table-panel
// que maneja el formato de queryType:5 (problems) nativamente con columnas configurables

const startMarker = '    {\n      id: 50,';
const endMarker   = '\n    }\n  ]\n};';

const startIdx = content.indexOf(startMarker);
const endIdx   = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Markers not found:', startIdx, endIdx);
  process.exit(1);
}

const before = content.substring(0, startIdx);
const after  = endMarker + content.substring(endIdx + endMarker.length);

const newPanel = `    {
      id: 50,
      title: "Incidentes y Alarmas Activas en Active Directory",
      type: "table",
      gridPos: { x: 0, y: 40, w: 24, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
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
            matcher: { id: "byName", options: "severity" },
            properties: [
              { id: "displayName", value: "Severidad" },
              {
                id: "mappings",
                value: [
                  { type: "value", options: { "0": { text: "—",         color: "text" } } },
                  { type: "value", options: { "1": { text: "INFO",       color: "blue" } } },
                  { type: "value", options: { "2": { text: "ADVERTENCIA",color: "yellow" } } },
                  { type: "value", options: { "3": { text: "PROMEDIO",   color: "orange" } } },
                  { type: "value", options: { "4": { text: "ALTO",       color: "red" } } },
                  { type: "value", options: { "5": { text: "DESASTRE",   color: "purple" } } }
                ]
              },
              { id: "custom.cellOptions", value: { type: "color-text" } },
              { id: "custom.width", value: 130 }
            ]
          },
          {
            matcher: { id: "byName", options: "name" },
            properties: [
              { id: "displayName", value: "Problema" },
              { id: "custom.width", value: 480 }
            ]
          },
          {
            matcher: { id: "byName", options: "hosts" },
            properties: [
              { id: "displayName", value: "Host" },
              { id: "custom.width", value: 160 }
            ]
          },
          {
            matcher: { id: "byName", options: "acknowledged" },
            properties: [
              { id: "displayName", value: "ACK" },
              {
                id: "mappings",
                value: [
                  { type: "value", options: { "0": { text: "No",  color: "text" } } },
                  { type: "value", options: { "1": { text: "Sí",  color: "green" } } }
                ]
              },
              { id: "custom.cellOptions", value: { type: "color-text" } },
              { id: "custom.width", value: 80 }
            ]
          },
          {
            matcher: { id: "byName", options: "Time" },
            properties: [
              { id: "displayName", value: "Inicio" },
              { id: "unit", value: "dateTimeAsLocal" },
              { id: "custom.width", value: 150 }
            ]
          }
        ]
      },
      options: {
        sortBy: [{ displayName: "severity", desc: true }],
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

const newContent = before + newPanel + after;
fs.writeFileSync('scripts/build_activedirectory_dashboard.mjs', newContent, 'utf8');
console.log('OK - Panel 50 reemplazado por table nativa con overrides. Size:', newContent.length);
