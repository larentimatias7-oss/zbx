const fs = require('fs');

let content = fs.readFileSync('scripts/build_activedirectory_dashboard.mjs', 'utf8');

// Localizar el bloque exacto del panel 50
const startMarker = '    {\n      id: 50,';
const endMarker = '    }\n  ]\n};';

const startIdx = content.indexOf(startMarker);
const endIdx   = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Markers not found. startIdx:', startIdx, 'endIdx:', endIdx);
  process.exit(1);
}

// El panel termina justo antes de "  ]\n};"
// Extraemos lo que va antes del panel y lo que sigue
const before = content.substring(0, startIdx);
const after   = '\n  ]\n};' + content.substring(endIdx + '    }\n  ]\n};'.length);

// CSS compacto para la tabla de incidentes
const css = [
  '.zbx{width:100%;border-collapse:collapse;font-family:Inter,sans-serif;font-size:13px;}',
  '.zbx thead tr{background:#1e2434;color:#8b92a5;text-transform:uppercase;font-size:11px;letter-spacing:.06em;}',
  '.zbx thead th{padding:8px 12px;text-align:left;border-bottom:1px solid #2d3347;}',
  '.zbx tbody tr{border-bottom:1px solid #1e2434;}',
  '.zbx tbody tr:hover{background:#1a1f2e;}',
  '.zbx td{padding:9px 12px;vertical-align:middle;}',
  '.sv{display:inline-block;padding:2px 10px;border-radius:4px;font-size:11px;font-weight:700;}',
  '.sv1{background:#3d2600;color:#FFC859;}',
  '.sv2{background:#3d1a00;color:#FF9800;}',
  '.sv3{background:#3d0000;color:#E45959;}',
  '.sv4{background:#1a0030;color:#cc44ff;}',
  '.ay{color:#16A34A;font-weight:600;}',
  '.an{color:#6b7280;}'
].join('');

const hbs = [
  '<style>' + css + '</style>',
  '{{#if (eq data.length 0)}}',
  '<div style="text-align:center;padding:40px;color:#4b5563;font-size:14px;">Sin incidentes activos en los controladores de dominio</div>',
  '{{else}}',
  '<table class="zbx"><thead><tr>',
  '<th>Severidad</th><th>Problema</th><th>Host</th><th>Inicio</th><th>ACK</th>',
  '</tr></thead><tbody>',
  '{{#each data}}{{#with (lookup . "0")}}',
  '<tr>',
  '<td>{{#if (eq severity "4")}}<span class="sv sv4">DESASTRE</span>',
  '{{else if (eq severity "3")}}<span class="sv sv3">ALTO</span>',
  '{{else if (eq severity "2")}}<span class="sv sv2">PROMEDIO</span>',
  '{{else}}<span class="sv sv1">ADVERTENCIA</span>{{/if}}</td>',
  '<td style="max-width:400px;word-break:break-word;">{{name}}</td>',
  '<td style="color:#94a3b8;font-size:12px;">{{hosts}}</td>',
  '<td style="color:#6b7280;font-size:12px;white-space:nowrap;">{{formatTime timestamp "DD/MM HH:mm"}}</td>',
  '<td>{{#if (eq acknowledged "1")}}<span class="ay">OK</span>{{else}}<span class="an">No</span>{{/if}}</td>',
  '</tr>',
  '{{/with}}{{/each}}',
  '</tbody></table>',
  '{{/if}}'
].join('\n');

const defHtml = '<div style="text-align:center;padding:40px;color:#4b5563;font-family:Inter,sans-serif;"><div style="font-size:14px;">Sin incidentes activos en Active Directory</div></div>';

const newPanel = `    {
      id: 50,
      title: "Incidentes y Alarmas Activas en Active Directory",
      type: "marcusolsson-dynamictext-panel",
      gridPos: { x: 0, y: 40, w: 24, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      options: {
        content: ${JSON.stringify(hbs)},
        defaultContent: ${JSON.stringify(defHtml)},
        everyRowHasSource: false,
        renderMode: "data",
        wrap: false
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
console.log('OK - Panel 50 reemplazado. Nuevo size:', newContent.length);
