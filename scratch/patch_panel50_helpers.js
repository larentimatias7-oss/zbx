const fs = require('fs');

let content = fs.readFileSync('scripts/build_activedirectory_dashboard.mjs', 'utf8');

// Localizar el bloque de options del panel 50 para agregar helpers
// Buscamos el string exacto de everyRowHasSource y agregamos helpers antes del cierre
const oldOptions = `        everyRowHasSource: false,
        renderMode: "data",
        wrap: false
      },`;

// El helper formatTime convierte Unix timestamp (segundos) a DD/MM HH:mm
const helperCode = `handlebars.registerHelper('formatTime', function(ts) {
  if (!ts) return '-';
  var d = new Date(Number(ts) * 1000);
  var dd = String(d.getDate()).padStart(2,'0');
  var mm = String(d.getMonth()+1).padStart(2,'0');
  var hh = String(d.getHours()).padStart(2,'0');
  var min = String(d.getMinutes()).padStart(2,'0');
  return dd+'/'+mm+' '+hh+':'+min;
});`;

const newOptions = `        everyRowHasSource: false,
        renderMode: "every-row",
        wrap: false,
        helpers: ${JSON.stringify(helperCode)}
      },`;

if (!content.includes(oldOptions)) {
  console.error('Target options block not found');
  // Fallback: buscar una variante
  const idx = content.indexOf('everyRowHasSource: false');
  if (idx === -1) { console.error('everyRowHasSource not found either'); process.exit(1); }
  console.log('Context around everyRowHasSource:', JSON.stringify(content.substring(idx - 20, idx + 120)));
  process.exit(1);
}

const newContent = content.replace(oldOptions, newOptions);
fs.writeFileSync('scripts/build_activedirectory_dashboard.mjs', newContent, 'utf8');
console.log('OK - helpers field agregado al panel 50');
