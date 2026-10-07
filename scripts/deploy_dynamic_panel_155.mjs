import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const grafanaHost = '172.27.210.154';
const grafanaPort = 3005;

function grafanaRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = http.request({
      hostname: grafanaHost,
      port: grafanaPort,
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

async function main() {
  console.log('=== 1. FETCHING LIVE noc-zabbix-command-center ===');
  const getRes = await grafanaRequest('GET', '/api/dashboards/uid/noc-zabbix-command-center');
  if (getRes.status !== 200) {
    throw new Error('Failed to fetch dashboard: ' + getRes.status + ' ' + JSON.stringify(getRes.data));
  }

  const dash = getRes.data.dashboard;
  console.log(`Current version: ${dash.version}, Title: ${dash.title}`);

  // Save safety backup
  const backupPath = `.zabbix_context/dashboards/backups/noc-zabbix-command-center-pre-p155-v${dash.version}.json`;
  fs.writeFileSync(backupPath, JSON.stringify(dash, null, 2), 'utf8');
  console.log(`Safety backup written to: ${backupPath}`);

  console.log('\n=== 2. CONFIGURING DYNAMIC PANEL 155 ===');
  const p155Index = dash.panels.findIndex(p => p.id === 155);
  if (p155Index === -1) {
    throw new Error('Panel 155 not found in dashboard!');
  }

  const newPanel155 = {
    id: 155,
    title: '🚨 Detección Forense Dinámica: Bucles Kerberos (Event 4771)',
    description: 'Telemetría dinámica de preautenticación Kerberos (Event 4771). Captura en tiempo real estaciones, usuarios y códigos de fallo (0x18 credencial vieja cacheada) en bucle de reintentos contra el PDC SRO-DCO01.',
    type: 'table',
    gridPos: {
      x: 16,
      y: 63,
      w: 8,
      h: 4
    },
    datasource: {
      type: 'alexanderzobnin-zabbix-datasource',
      uid: 'efz4nzx8r30g0c'
    },
    timeFrom: '24h',
    options: {
      showHeader: true,
      footer: {
        show: false,
        reducer: ['count']
      },
      sortBy: [
        {
          displayName: 'Fecha / Hora',
          desc: true
        }
      ]
    },
    targets: [
      {
        refId: 'USER',
        schema: 12,
        queryType: '2',
        group: { filter: 'AD' },
        host: { filter: 'SRO-DCO01' },
        item: { filter: 'Usuario Fallo Preauth Kerberos' },
        resultFormat: 'time_series',
        options: { showDisabledItems: false }
      },
      {
        refId: 'IP',
        schema: 12,
        queryType: '2',
        group: { filter: 'AD' },
        host: { filter: 'SRO-DCO01' },
        item: { filter: 'IP Origen Fallo Preauth Kerberos' },
        resultFormat: 'time_series',
        options: { showDisabledItems: false }
      },
      {
        refId: 'CODE',
        schema: 12,
        queryType: '2',
        group: { filter: 'AD' },
        host: { filter: 'SRO-DCO01' },
        item: { filter: 'Código Fallo Preauth Kerberos' },
        resultFormat: 'time_series',
        options: { showDisabledItems: false }
      }
    ],
    transformations: [
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
          indexByName: {
            'Time': 0,
            'Value #USER': 1,
            'Value #IP': 2,
            'Value #CODE': 3
          },
          renameByName: {
            'Time': 'Fecha / Hora',
            'Value #USER': 'Usuario Afectado',
            'Value #IP': 'IP de Origen',
            'Value #CODE': 'Código de Fallo'
          }
        }
      },
      {
        id: 'sortBy',
        options: {
          fields: [
            {
              field: 'Fecha / Hora',
              desc: true
            }
          ]
        }
      }
    ],
    fieldConfig: {
      defaults: {
        custom: {
          align: 'left',
          cellOptions: {
            type: 'auto'
          },
          filterable: true,
          minWidth: 90
        }
      },
      overrides: [
        {
          matcher: {
            id: 'byName',
            options: 'Fecha / Hora'
          },
          properties: [
            {
              id: 'custom.width',
              value: 140
            },
            {
              id: 'unit',
              value: 'dateTimeAsIso'
            }
          ]
        },
        {
          matcher: {
            id: 'byName',
            options: 'Usuario Afectado'
          },
          properties: [
            {
              id: 'custom.width',
              value: 170
            },
            {
              id: 'custom.cellOptions',
              value: {
                type: 'color-background'
              }
            },
            {
              id: 'mappings',
              value: [
                {
                  type: 'regex',
                  options: {
                    pattern: '.+',
                    result: {
                      text: '👤 $__text',
                      color: '#C084FC'
                    }
                  }
                }
              ]
            }
          ]
        },
        {
          matcher: {
            id: 'byName',
            options: 'IP de Origen'
          },
          properties: [
            {
              id: 'custom.width',
              value: 130
            },
            {
              id: 'custom.cellOptions',
              value: {
                type: 'color-background'
              }
            },
            {
              id: 'mappings',
              value: [
                {
                  type: 'regex',
                  options: {
                    pattern: '.+',
                    result: {
                      text: '💻 $__text',
                      color: '#FBBF24'
                    }
                  }
                }
              ]
            }
          ]
        },
        {
          matcher: {
            id: 'byName',
            options: 'Código de Fallo'
          },
          properties: [
            {
              id: 'custom.width',
              value: 180
            },
            {
              id: 'custom.cellOptions',
              value: {
                type: 'color-background'
              }
            },
            {
              id: 'mappings',
              value: [
                {
                  type: 'value',
                  options: {
                    '0x18': {
                      text: '🚨 0x18 (Password Viejo/Cacheado)',
                      color: '#E02F44'
                    },
                    '0x17': {
                      text: '⚠️ 0x17 (Ticket Expirado)',
                      color: '#FA6400'
                    },
                    '0x6': {
                      text: '⚠️ 0x6 (Usuario Desconocido)',
                      color: '#F2CC0C'
                    }
                  }
                },
                {
                  type: 'regex',
                  options: {
                    pattern: '.+',
                    result: {
                      text: '⚠️ $__text',
                      color: '#E02F44'
                    }
                  }
                }
              ]
            }
          ]
        }
      ]
    },
    links: [
      {
        targetBlank: true,
        title: '🔍 Ver Eventlogs 4771 en Zabbix',
        url: 'https://zabbix.mlccnet.local/history.php?action=showvalues&itemids%5B0%5D=96738&itemids%5B1%5D=96739'
      },
      {
        targetBlank: true,
        title: '🏛️ Abrir Dashboard Forense AD (V3)',
        url: '/d/milicic-activedirectory-soc-v3/91ffe43?from=now-7d&to=now'
      }
    ]
  };

  dash.panels[p155Index] = newPanel155;

  console.log('=== 3. DEPLOYING TO GRAFANA API ===');
  const updatePayload = {
    dashboard: dash,
    message: 'Reemplazo de aviso estático panel 155 por tabla forense dinámica de bucles Kerberos (Event 4771)',
    overwrite: true
  };

  const putRes = await grafanaRequest('POST', '/api/dashboards/db', updatePayload);
  if (putRes.status !== 200) {
    throw new Error('Update failed: ' + putRes.status + ' ' + JSON.stringify(putRes.data));
  }

  console.log(`Deployment successful! New dashboard version: ${putRes.data.version}, status: ${putRes.data.status}`);
  console.log(`URL: http://${grafanaHost}:${grafanaPort}${putRes.data.url}`);
}

main().catch(console.error);
