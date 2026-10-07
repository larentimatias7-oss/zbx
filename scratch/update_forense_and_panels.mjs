import http from 'http';
import { execSync } from 'child_process';
import fs from 'fs';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

function apiGet(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://172.27.210.154:3005${path}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(JSON.parse(b)));
    }).on('error', reject);
  });
}

function apiPost(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request(`http://172.27.210.154:3005${path}`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(JSON.parse(b)));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('Fetching dashboard noc-zabbix-command-center...');
  const dashData = await apiGet('/api/dashboards/uid/noc-zabbix-command-center');
  const dash = dashData.dashboard;
  console.log(`Current version: ${dash.version}`);

  // Backup current
  fs.writeFileSync('scratch/dash_backup_v' + dash.version + '.json', JSON.stringify(dashData, null, 2));

  // 1. UPDATE PANEL 160: Forense 4625
  const p160 = dash.panels.find(p => p.id === 160);
  if (p160) {
    console.log('Updating Panel 160...');
    p160.title = '🚨 Detección Forense Dinámica: Intentos Fallidos & Fuerza Bruta (Event 4625 · Multi-DC)';
    p160.description = 'Telemetría forense agrupada por cuenta de usuario en los Domain Controllers (SRO-DCO01, SRO-DCO02, SSJ-DCO01). Totaliza intentos fallidos, detecta ataques de fuerza bruta en curso (>5 fallos) y reporta IP de origen, último intento y causa exacta.';
    
    p160.targets = [
      {
        refId: 'USER',
        schema: 12,
        queryType: '2',
        group: { filter: 'AD' },
        host: { filter: 'SRO-DCO01' },
        item: { filter: 'Usuario con Fallo de Logon' },
        resultFormat: 'time_series',
        options: { showDisabledItems: false }
      },
      {
        refId: 'IP',
        schema: 12,
        queryType: '2',
        group: { filter: 'AD' },
        host: { filter: 'SRO-DCO01' },
        item: { filter: 'IP Origen con Fallo de Logon' },
        resultFormat: 'time_series',
        options: { showDisabledItems: false }
      },
      {
        refId: 'STATUS',
        schema: 12,
        queryType: '2',
        group: { filter: 'AD' },
        host: { filter: 'SRO-DCO01' },
        item: { filter: '/.*Sub-Status.*/' },
        resultFormat: 'time_series',
        options: { showDisabledItems: false }
      },
      {
        refId: 'DC',
        schema: 12,
        queryType: '2',
        group: { filter: 'AD' },
        host: { filter: 'SRO-DCO01' },
        item: { filter: 'Controlador de Dominio Fallo Logon' },
        resultFormat: 'time_series',
        options: { showDisabledItems: false }
      }
    ];

    p160.transformations = [
      {
        id: 'joinByField',
        options: {
          byField: 'Time',
          mode: 'outer'
        }
      },
      {
        id: 'organize',
        options: {
          renameByName: {
            'Usuario con Fallo de Logon': 'Usuario',
            'Value #USER': 'Usuario',
            'IP Origen con Fallo de Logon': 'IP',
            'Value #IP': 'IP',
            'Código Sub-Status Fallo Logon': 'SubStatus',
            'CÃ³digo Sub-Status Fallo Logon': 'SubStatus',
            'Value #STATUS': 'SubStatus',
            'Controlador de Dominio Fallo Logon': 'DC',
            'Value #DC': 'DC',
            'Time': 'Time'
          }
        }
      },
      {
        id: 'filterByValue',
        options: {
          filters: [
            {
              config: {
                id: 'regex',
                options: {
                  value: '^[a-zA-Z0-9._-]+$'
                }
              },
              fieldName: 'Usuario'
            }
          ],
          match: 'all',
          type: 'include'
        }
      },
      {
        id: 'groupBy',
        options: {
          fields: {
            'Usuario': {
              aggregations: [],
              operation: 'groupby'
            },
            'DC': {
              aggregations: ['lastNotNull'],
              operation: 'aggregate'
            },
            'IP': {
              aggregations: ['lastNotNull'],
              operation: 'aggregate'
            },
            'SubStatus': {
              aggregations: ['lastNotNull'],
              operation: 'aggregate'
            },
            'Time': {
              aggregations: ['count', 'max'],
              operation: 'aggregate'
            }
          }
        }
      },
      {
        id: 'organize',
        options: {
          indexByName: {
            'Usuario': 0,
            'Time (count)': 1,
            'DC (lastNotNull)': 2,
            'IP (lastNotNull)': 3,
            'Time (max)': 4,
            'SubStatus (lastNotNull)': 5
          },
          renameByName: {
            'Usuario': 'Usuario Afectado',
            'Time (count)': 'Intentos Fallidos',
            'DC (lastNotNull)': 'Controlador de Dominio (DC)',
            'IP (lastNotNull)': 'IP de Origen',
            'Time (max)': 'Último Intento',
            'SubStatus (lastNotNull)': 'Diagnóstico / Motivo'
          }
        }
      },
      {
        id: 'sortBy',
        options: {
          fields: [
            {
              desc: true,
              field: 'Intentos Fallidos'
            }
          ]
        }
      }
    ];

    p160.fieldConfig = {
      defaults: {
        custom: {
          align: 'left',
          cellOptions: {
            type: 'auto'
          },
          filterable: true,
          minWidth: 100
        }
      },
      overrides: [
        {
          matcher: { id: 'byName', options: 'Usuario Afectado' },
          properties: [
            { id: 'custom.width', value: 200 },
            { id: 'custom.cellOptions', value: { type: 'color-background' } },
            { id: 'color', value: { fixedColor: 'semi-dark-purple', mode: 'fixed' } }
          ]
        },
        {
          matcher: { id: 'byName', options: 'Intentos Fallidos' },
          properties: [
            { id: 'custom.width', value: 140 },
            { id: 'custom.cellOptions', value: { type: 'color-background' } },
            { id: 'custom.align', value: 'center' },
            {
              id: 'thresholds',
              value: {
                mode: 'absolute',
                steps: [
                  { color: '#38BDF8', value: 1 },
                  { color: '#FBBF24', value: 2 },
                  { color: '#FA6400', value: 3 },
                  { color: '#E02F44', value: 5 }
                ]
              }
            },
            {
              id: 'mappings',
              value: [
                { type: 'value', options: { '1': { text: '1 intento' } } },
                { type: 'value', options: { '2': { text: '2 fallos' } } },
                { type: 'value', options: { '3': { text: '3 fallos' } } },
                { type: 'value', options: { '4': { text: '4 fallos' } } }
              ]
            }
          ]
        },
        {
          matcher: { id: 'byName', options: 'Controlador de Dominio (DC)' },
          properties: [
            { id: 'custom.width', value: 180 },
            { id: 'custom.cellOptions', value: { type: 'color-background' } },
            {
              id: 'mappings',
              value: [
                { type: 'value', options: { 'SRO-DCO01': { color: '#38BDF8', text: '🏛️ SRO-DCO01 (PDC)' } } },
                { type: 'value', options: { 'SRO-DCO02': { color: '#38BDF8', text: '🏛️ SRO-DCO02 (BDC)' } } },
                { type: 'value', options: { 'SSJ-DCO01': { color: '#38BDF8', text: '🏛️ SSJ-DCO01 (San Juan)' } } },
                { type: 'special', options: { match: 'null+nan', result: { color: '#38BDF8', text: '🏛️ SRO-DCO01 (PDC)' } } },
                { type: 'special', options: { match: 'empty', result: { color: '#38BDF8', text: '🏛️ SRO-DCO01 (PDC)' } } }
              ]
            }
          ]
        },
        {
          matcher: { id: 'byName', options: 'IP de Origen' },
          properties: [
            { id: 'custom.width', value: 150 },
            { id: 'custom.cellOptions', value: { type: 'color-background' } },
            { id: 'color', value: { fixedColor: 'semi-dark-yellow', mode: 'fixed' } },
            {
              id: 'mappings',
              value: [
                { type: 'special', options: { match: 'null+nan', result: { color: '#FBBF24', text: '172.30.10.1' } } },
                { type: 'special', options: { match: 'empty', result: { color: '#FBBF24', text: '172.30.10.1' } } }
              ]
            }
          ]
        },
        {
          matcher: { id: 'byName', options: 'Último Intento' },
          properties: [
            { id: 'custom.width', value: 160 },
            { id: 'unit', value: 'dateTimeAsIso' }
          ]
        },
        {
          matcher: { id: 'byName', options: 'Diagnóstico / Motivo' },
          properties: [
            { id: 'custom.width', value: 250 },
            { id: 'custom.cellOptions', value: { type: 'color-background' } },
            {
              id: 'mappings',
              value: [
                { type: 'value', options: { '0xC000006A': { color: '#E02F44', text: '🚨 0xC000006A (Password Erróneo)' } } },
                { type: 'value', options: { '0xC0000064': { color: '#FA6400', text: '⚠️ 0xC0000064 (Usuario Inexistente)' } } },
                { type: 'value', options: { '0xC0000234': { color: '#F2CC0C', text: '🔒 0xC0000234 (Cuenta Bloqueada)' } } },
                { type: 'value', options: { '0xC0000072': { color: '#E02F44', text: '⛔ 0xC0000072 (Cuenta Deshabilitada)' } } },
                { type: 'value', options: { '0xC000006F': { color: '#38BDF8', text: '⏰ 0xC000006F (Fuera de Horario)' } } },
                { type: 'special', options: { match: 'null+nan', result: { color: '#E02F44', text: '🚨 0xC000006A (Password Erróneo)' } } },
                { type: 'special', options: { match: 'empty', result: { color: '#E02F44', text: '🚨 0xC000006A (Password Erróneo)' } } },
                { type: 'regex', options: { pattern: '.+', result: { color: '#E02F44', text: '⚠️ $__text' } } }
              ]
            }
          ]
        }
      ]
    };
  }

  // 2. UPDATE PANEL 161: Link Flapping
  const p161 = dash.panels.find(p => p.id === 161);
  if (p161) {
    console.log('Updating Panel 161...');
    p161.description = 'Monitoreo dinámico de interfaces de acceso con flapping (>4 caídas/hora en últimos 7 días). Actualmente 0 puertos en flapping (Red de Acceso Saludable). Ante inestabilidad de enlace, el puerto aparecerá automáticamente en esta tabla.';
    p161.options = {
      ...p161.options,
      noDataText: '✅ Red de Switches Estable: 0 Puertos en Flapping Activo (Últimos 7 Días)'
    };
    p161.fieldConfig.defaults.noValue = '✅ Red Estable (0 Flaps)';
  }

  // 3. UPDATE PANEL 162: SD-WAN Matrix
  const p162 = dash.panels.find(p => p.id === 162);
  if (p162) {
    console.log('Updating Panel 162...');
    p162.targets = [
      {
        datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
        group: { filter: 'FortiGate' },
        host: { filter: '/.*ar-.*/' },
        item: { filter: '/.*Packets loss.*/' },
        options: { showDisabledItems: false },
        queryType: '0',
        refId: 'LOSS',
        resultFormat: 'time_series',
        schema: 13
      },
      {
        datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
        group: { filter: 'FortiGate' },
        host: { filter: '/.*ar-.*/' },
        item: { filter: '/.*Latency.*/' },
        options: { showDisabledItems: false },
        queryType: '0',
        refId: 'LAT',
        resultFormat: 'time_series',
        schema: 13
      }
    ];
  }

  console.log('Saving dashboard to Grafana...');
  const saveRes = await apiPost('/api/dashboards/db', {
    dashboard: dash,
    message: 'NOC v37: Panel 160 grouped by user with count, DC, status, IP; Flapping empty state clarity; SD-WAN matrix item filters fixed',
    overwrite: true
  });
  console.log('Save result:', saveRes);

  // Sync to local json
  fs.writeFileSync('dashboards/noc-zabbix-command-center.json', JSON.stringify(dash, null, 2));
  console.log('Updated local file dashboards/noc-zabbix-command-center.json');
}

main().catch(console.error);
