import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function deployTestWanTable() {
  const dash = {
    dashboard: {
      id: null,
      uid: 'test-matrix-table-dev',
      title: 'TEST MATRIX TABLE DEV',
      tags: ['test'],
      timezone: 'browser',
      schemaVersion: 39,
      version: 3,
      refresh: '30s',
      panels: [
        {
          id: 1,
          title: 'Matriz WAN de Sedes & Enlaces Remotos (Test JoinByLabels)',
          type: 'table',
          gridPos: { h: 12, w: 24, x: 0, y: 0 },
          datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
          targets: [
            {
              refId: 'A',
              schema: 13,
              queryType: '0',
              group: { filter: 'FortiGate' },
              host: { filter: '/.*/' },
              item: { filter: 'ICMP ping' },
              resultFormat: 'time_series',
              datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
            },
            {
              refId: 'B',
              schema: 13,
              queryType: '0',
              group: { filter: 'FortiGate' },
              host: { filter: '/.*/' },
              item: { filter: 'ICMP response time' },
              resultFormat: 'time_series',
              datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
            },
            {
              refId: 'C',
              schema: 13,
              queryType: '0',
              group: { filter: 'FortiGate' },
              host: { filter: '/.*/' },
              item: { filter: 'ICMP loss' },
              resultFormat: 'time_series',
              datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
            },
            {
              refId: 'D',
              schema: 13,
              queryType: '0',
              group: { filter: 'FortiGate' },
              host: { filter: '/.*/' },
              item: { filter: '/IPv4 Active sessions/' },
              resultFormat: 'time_series',
              datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
            }
          ],
          transformations: [
            {
              id: 'reduce',
              options: {
                mode: 'reduceFields',
                reducers: ['lastNotNull']
              }
            },
            {
              id: 'joinByLabels',
              options: {
                value: 'item',
                join: ['host']
              }
            },
            {
              id: 'renameByRegex',
              options: {
                regex: '^(?:FTG_|)(.*?)(?:_SNMP|)$',
                renamePattern: '$1'
              }
            },
            {
              id: 'organize',
              options: {
                excludeByName: {},
                indexByName: {
                  'host': 0,
                  'ICMP ping': 1,
                  'ICMP response time': 2,
                  'ICMP loss': 3,
                  'IPv4 Active sessions': 4
                },
                renameByName: {
                  'host': 'Sede / Obra',
                  'ICMP ping': 'Disponibilidad',
                  'ICMP response time': 'Latencia',
                  'ICMP loss': 'Pérdida %',
                  'IPv4 Active sessions': 'Sesiones Activas'
                }
              }
            },
            {
              id: 'sortBy',
              options: {
                fields: {},
                sort: [
                  {
                    desc: false,
                    field: 'Disponibilidad'
                  }
                ]
              }
            }
          ],
          fieldConfig: {
            defaults: {
              custom: {
                align: 'auto',
                cellOptions: {
                  type: 'auto'
                },
                inspect: false
              }
            },
            overrides: [
              {
                matcher: {
                  id: 'byName',
                  options: 'Disponibilidad'
                },
                properties: [
                  {
                    id: 'mappings',
                    value: [
                      {
                        options: {
                          '1': {
                            color: '#73BF69',
                            index: 0,
                            text: 'ONLINE'
                          }
                        },
                        type: 'value'
                      },
                      {
                        options: {
                          '0': {
                            color: '#E02F44',
                            index: 1,
                            text: 'OFFLINE'
                          }
                        },
                        type: 'value'
                      }
                    ]
                  },
                  {
                    id: 'custom.cellOptions',
                    value: {
                      mode: 'basic',
                      type: 'color-background'
                    }
                  }
                ]
              },
              {
                matcher: {
                  id: 'byName',
                  options: 'Latencia'
                },
                properties: [
                  {
                    id: 'unit',
                    value: 's'
                  },
                  {
                    id: 'decimals',
                    value: 2
                  },
                  {
                    id: 'thresholds',
                    value: {
                      mode: 'absolute',
                      steps: [
                        { color: '#73BF69', value: 0 },
                        { color: '#FADE2A', value: 0.08 },
                        { color: '#E02F44', value: 0.15 }
                      ]
                    }
                  },
                  {
                    id: 'custom.cellOptions',
                    value: {
                      mode: 'gradient',
                      type: 'color-text'
                    }
                  }
                ]
              },
              {
                matcher: {
                  id: 'byName',
                  options: 'Pérdida %'
                },
                properties: [
                  {
                    id: 'unit',
                    value: 'percent'
                  },
                  {
                    id: 'decimals',
                    value: 1
                  },
                  {
                    id: 'thresholds',
                    value: {
                      mode: 'absolute',
                      steps: [
                        { color: '#73BF69', value: 0 },
                        { color: '#FADE2A', value: 2 },
                        { color: '#E02F44', value: 10 }
                      ]
                    }
                  },
                  {
                    id: 'custom.cellOptions',
                    value: {
                      mode: 'basic',
                      type: 'color-text'
                    }
                  }
                ]
              },
              {
                matcher: {
                  id: 'byName',
                  options: 'Sesiones Activas'
                },
                properties: [
                  {
                    id: 'unit',
                    value: 'locale'
                  },
                  {
                    id: 'decimals',
                    value: 0
                  },
                  {
                    id: 'thresholds',
                    value: {
                      mode: 'absolute',
                      steps: [
                        { color: '#73BF69', value: 0 },
                        { color: '#FADE2A', value: 8000 },
                        { color: '#E02F44', value: 20000 }
                      ]
                    }
                  },
                  {
                    id: 'custom.cellOptions',
                    value: {
                      mode: 'gradient',
                      type: 'gauge'
                    }
                  },
                  {
                    id: 'min',
                    value: 0
                  },
                  {
                    id: 'max',
                    value: 25000
                  }
                ]
              }
            ]
          }
        }
      ]
    },
    overwrite: true
  };

  const payload = JSON.stringify(dash);
  const res = await new Promise((resolve) => {
    const req = http.request({
      hostname: '172.27.210.154',
      port: 3005,
      path: '/api/dashboards/db',
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
    req.write(payload);
    req.end();
  });
  console.log('Result deploy:', res);
}

deployTestWanTable().catch(console.error);
