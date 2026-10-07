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

  // 1. FIX PANEL 160 (Logon 4625)
  const p160 = dash.panels.find(p => p.id === 160);
  if (p160) {
    console.log('Fixing Panel 160 value mappings...');
    p160.fieldConfig.overrides = [
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
              { type: 'regex', options: { pattern: '.+', result: { color: '#E02F44' } } }
            ]
          }
        ]
      }
    ];
  }

  // 2. FIX PANEL 155 (Kerberos 4771)
  const p155 = dash.panels.find(p => p.id === 155);
  if (p155) {
    console.log('Fixing Panel 155 value mappings...');
    p155.fieldConfig.overrides = [
      {
        matcher: { id: 'byName', options: 'Fecha / Hora' },
        properties: [
          { id: 'custom.width', value: 140 },
          { id: 'unit', value: 'dateTimeAsIso' }
        ]
      },
      {
        matcher: { id: 'byName', options: 'Usuario Afectado' },
        properties: [
          { id: 'custom.width', value: 170 },
          { id: 'custom.cellOptions', value: { type: 'color-background' } },
          { id: 'color', value: { fixedColor: 'semi-dark-purple', mode: 'fixed' } }
        ]
      },
      {
        matcher: { id: 'byName', options: 'IP de Origen' },
        properties: [
          { id: 'custom.width', value: 130 },
          { id: 'custom.cellOptions', value: { type: 'color-background' } },
          { id: 'color', value: { fixedColor: 'semi-dark-yellow', mode: 'fixed' } }
        ]
      },
      {
        matcher: { id: 'byName', options: 'Código de Fallo' },
        properties: [
          { id: 'custom.width', value: 180 },
          { id: 'custom.cellOptions', value: { type: 'color-background' } },
          {
            id: 'mappings',
            value: [
              { type: 'value', options: { '0x17': { color: '#FA6400', text: '⚠️ 0x17 (Ticket Expirado)' } } },
              { type: 'value', options: { '0x18': { color: '#E02F44', text: '🚨 0x18 (Password Viejo/Cacheado)' } } },
              { type: 'value', options: { '0x6': { color: '#F2CC0C', text: '⚠️ 0x6 (Usuario Desconocido)' } } },
              { type: 'regex', options: { pattern: '.+', result: { color: '#E02F44' } } }
            ]
          }
        ]
      }
    ];
  }

  console.log('Saving dashboard to Grafana...');
  const saveRes = await apiPost('/api/dashboards/db', {
    dashboard: dash,
    message: 'NOC v39: Fixed text rendering by removing literal $__text placeholders in Panel 160 and Panel 155',
    overwrite: true
  });
  console.log('Save result:', saveRes);

  // Sync to local json
  fs.writeFileSync('dashboards/noc-zabbix-command-center.json', JSON.stringify(dash, null, 2));
  console.log('Updated local file dashboards/noc-zabbix-command-center.json');
}

main().catch(console.error);
