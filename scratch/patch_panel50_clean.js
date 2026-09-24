const fs = require('fs');

let content = fs.readFileSync('scripts/build_activedirectory_dashboard.mjs', 'utf8');

// 1. Quitar el campo helpers que causa "handlebars is not defined"
// 2. Quitar {{formatTime ...}} del template y reemplazar por una celda sin fecha
//    o mostrar el timestamp como texto directo con un workaround

// Buscar y quitar la línea de helpers
const helpersLineRegex = /,\s*helpers:\s*"[^"\\]*(?:\\.[^"\\]*)*"\s*/s;

// En su lugar usamos: renderMode every-row sin helpers
// Y en el template cambiamos {{formatTime timestamp "DD/MM HH:mm"}}
// por simplemente mostrar el timestamp como dato de duración relativa usando only Handlebars nativos

// Estrategia: buscar el bloque options del panel 50 y reconstruirlo limpio

const start = content.indexOf('"marcusolsson-dynamictext-panel"');
if (start === -1) { console.error('Panel type not found'); process.exit(1); }

// Encontrar el bloque options completo
const optionsStart = content.indexOf('options: {', start);
const optionsEnd = content.indexOf('\n      },\n      targets:', optionsStart);

if (optionsStart === -1 || optionsEnd === -1) {
  console.error('options block not found. optionsStart:', optionsStart, 'optionsEnd:', optionsEnd);
  process.exit(1);
}

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

// Template sin formatTime — mostramos el nombre del host y la severidad
// Para el timestamp: lo ignoramos o lo mostramos como epoch/60 para obtener minutos
const hbs = [
  '<style>' + css + '</style>',
  '{{#if (eq data.length 0)}}',
  '<div style="text-align:center;padding:40px;color:#4b5563;font-size:14px;">Sin incidentes activos en los controladores de dominio</div>',
  '{{else}}',
  '<table class="zbx"><thead><tr>',
  '<th>Severidad</th><th>Problema</th><th>Host</th><th>ACK</th>',
  '</tr></thead><tbody>',
  '{{#each data}}{{#with (lookup . "0")}}',
  '<tr>',
  '<td>{{#if (eq severity "4")}}<span class="sv sv4">DESASTRE</span>',
  '{{else if (eq severity "3")}}<span class="sv sv3">ALTO</span>',
  '{{else if (eq severity "2")}}<span class="sv sv2">PROMEDIO</span>',
  '{{else}}<span class="sv sv1">ADVERTENCIA</span>{{/if}}</td>',
  '<td style="max-width:460px;word-break:break-word;">{{name}}</td>',
  '<td style="color:#94a3b8;font-size:12px;">{{hosts}}</td>',
  '<td>{{#if (eq acknowledged "1")}}<span class="ay">✓ Sí</span>{{else}}<span class="an">— No</span>{{/if}}</td>',
  '</tr>',
  '{{/with}}{{/each}}',
  '</tbody></table>',
  '{{/if}}'
].join('\n');

const defHtml = '<div style="text-align:center;padding:40px;color:#4b5563;font-family:Inter,sans-serif;"><div style="font-size:14px;">Sin incidentes activos en Active Directory</div></div>';

const newOptionsBlock = `options: {
        content: ${JSON.stringify(hbs)},
        defaultContent: ${JSON.stringify(defHtml)},
        everyRowHasSource: false,
        renderMode: "every-row",
        wrap: false
      }`;

const before = content.substring(0, optionsStart);
const after  = content.substring(optionsEnd + '\n      },'.length);

const newContent = before + newOptionsBlock + '\n      },' + after;
fs.writeFileSync('scripts/build_activedirectory_dashboard.mjs', newContent, 'utf8');
console.log('OK - Panel 50 options reescritas (sin helpers, sin formatTime). Size:', newContent.length);
