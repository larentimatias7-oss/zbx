import fs from 'fs';

let code = fs.readFileSync('scripts/build_facilities_ups_dashboard.mjs', 'utf8');

const targetBlock = `      {
        name: "ups",
        label: "Equipo UPS",
        type: "custom",
        query: "Todas : .*, Edificio Gris PB : .*Gris PB.*, Edificio 02 PA : .*E02 PA.*, Galpón 01 : .*GALPON.*",
        current: { text: "Todas", value: ".*" },
        options: [
          { text: "Todas", value: ".*", selected: true },
          { text: "Edificio Gris PB", value: ".*Gris PB.*", selected: false },
          { text: "Edificio 02 PA", value: ".*E02 PA.*", selected: false },
          { text: "Galpón 01", value: ".*GALPON.*", selected: false }
        ],
        includeAll: false,
        hide: 0
      }`;

const replacementBlock = `      {
        name: "ups",
        label: "Equipo UPS",
        type: "query",
        datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
        query: {
          queryType: "2",
          group: "/UPS/",
          host: "/.*/"
        },
        current: { text: "All", value: "$__all" },
        includeAll: true,
        allValue: ".*",
        multi: false,
        refresh: 1,
        hide: 0
      }`;

code = code.replace(targetBlock, replacementBlock);
code = code.replaceAll('group: { filter: "UPS" }', 'group: { filter: "/UPS/" }');
code = code.replaceAll('host: { filter: "/${ups:raw}/" }', 'host: { filter: "/${ups:regex}/" }');

fs.writeFileSync('scripts/build_facilities_ups_dashboard.mjs', code, 'utf8');
console.log('build_facilities_ups_dashboard.mjs actualizado con éxito');
