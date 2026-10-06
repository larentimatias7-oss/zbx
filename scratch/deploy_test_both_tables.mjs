import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function deployTestTables() {
  const dash = {
    dashboard: {
      id: null,
      uid: 'test-matrix-table-dev',
      title: 'TEST MATRIX TABLE DEV',
      tags: ['test'],
      timezone: 'browser',
      schemaVersion: 39,
      version: 4,
      refresh: '30s',
      panels: [
        {
          id: 1,
          title: 'Matriz WAN de Sedes & Enlaces Remotos (GroupingToMatrix)',
          type: 'table',
          gridPos: { h: 10, w: 12, x: 0, y: 0 },
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
                labelsToFields: true,
                mode: 'seriesToRows',
                reducers: ['lastNotNull']
              }
            },
            {
              id: 'groupingToMatrix',
              options: {
                columnField: 'item',
                rowField: 'host',
                valueField: 'Last * (not null)'
              }
            },
            {
              id: 'organize',
              options: {
                excludeByName: {},
                indexByName: {
                  'host\\item': 0,
                  'ICMP ping': 1,
                  'ICMP response time': 2,
                  'ICMP loss': 3,
                  'IPv4 Active sessions': 4
                },
                renameByName: {
                  'host\\item': 'Sede / Obra',
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
                  options: 'Sede / Obra'
                },
                properties: [
                  {
                    id: 'mappings',
                    value: [
                      {
                        type: 'regex',
                        options: {
                          pattern: '^FTG_(.*)_SNMP$',
                          result: { text: '$1' }
                        }
                      }
                    ]
                  }
                ]
              },
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
                          '1': { color: '#73BF69', index: 0, text: 'ONLINE' },
                          '0': { color: '#E02F44', index: 1, text: 'OFFLINE' }
                        },
                        type: 'value'
                      }
                    ]
                  },
                  {
                    id: 'custom.cellOptions',
                    value: { mode: 'basic', type: 'color-background' }
                  }
                ]
              },
              {
                matcher: {
                  id: 'byName',
                  options: 'Latencia'
                },
                properties: [
                  { id: 'unit', value: 's' },
                  { id: 'decimals', value: 2 },
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
                    value: { mode: 'gradient', type: 'color-text' }
                  }
                ]
              },
              {
                matcher: {
                  id: 'byName',
                  options: 'Pérdida %'
                },
                properties: [
                  { id: 'unit', value: 'percent' },
                  { id: 'decimals', value: 1 },
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
                    value: { mode: 'basic', type: 'color-text' }
                  }
                ]
              },
              {
                matcher: {
                  id: 'byName',
                  options: 'Sesiones Activas'
                },
                properties: [
                  { id: 'unit', value: 'locale' },
                  { id: 'decimals', value: 0 },
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
                    value: { mode: 'gradient', type: 'gauge' }
                  },
                  { id: 'min', value: 0 },
                  { id: 'max', value: 25000 }
                ]
              }
            ]
          }
        },
        {
          id: 2,
          title: 'Matriz de Servidores & Roles Críticos (GroupingToMatrix)',
          type: 'table',
          gridPos: { h: 10, w: 12, x: 12, y: 0 },
          datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
          targets: [
            {
              refId: 'A',
              schema: 13,
              queryType: '0',
              group: { filter: '/(Windows_Server|Linux servers|AD|Backup_Server|Storage_Server|Virtual machines)/' },
              host: { filter: '/.*/' },
              item: { filter: 'ICMP ping' },
              resultFormat: 'time_series',
              datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
            },
            {
              refId: 'B',
              schema: 13,
              queryType: '0',
              group: { filter: '/(Windows_Server|Linux servers|AD|Backup_Server|Storage_Server|Virtual machines)/' },
              host: { filter: '/.*/' },
              item: { filter: '/^CPU utilization$/' },
              resultFormat: 'time_series',
              datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
            },
            {
              refId: 'C',
              schema: 13,
              queryType: '0',
              group: { filter: '/(Windows_Server|Linux servers|AD|Backup_Server|Storage_Server|Virtual machines)/' },
              host: { filter: '/.*/' },
              item: { filter: 'Memory utilization' },
              resultFormat: 'time_series',
              datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
            },
            {
              refId: 'D',
              schema: 13,
              queryType: '0',
              group: { filter: '/(Windows_Server|Linux servers|AD|Backup_Server|Storage_Server|Virtual machines)/' },
              host: { filter: '/.*/' },
              item: { filter: 'FS [(C:)]: Space: Used, in %' },
              resultFormat: 'time_series',
              datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
            }
          ],
          transformations: [
            {
              id: 'reduce',
              options: {
                labelsToFields: true,
                mode: 'seriesToRows',
                reducers: ['lastNotNull']
              }
            },
            {
              id: 'groupingToMatrix',
              options: {
                columnField: 'item',
                rowField: 'host',
                valueField: 'Last * (not null)'
              }
            },
            {
              id: 'organize',
              options: {
                excludeByName: {},
                indexByName: {
                  'host\\item': 0,
                  'ICMP ping': 1,
                  'CPU utilization': 2,
                  'Memory utilization': 3,
                  'FS [(C:)]: Space: Used, in %': 4
                },
                renameByName: {
                  'host\\item': 'Servidor',
                  'ICMP ping': 'Estado',
                  'CPU utilization': 'CPU %',
                  'Memory utilization': 'RAM %',
                  'FS [(C:)]: Space: Used, in %': 'Disco C: %'
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
                    field: 'Estado'
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
                  options: 'Estado'
                },
                properties: [
                  {
                    id: 'mappings',
                    value: [
                      {
                        options: {
                          '1': { color: '#73BF69', index: 0, text: 'OK' },
                          '0': { color: '#E02F44', index: 1, text: 'DOWN' }
                        },
                        type: 'value'
                      }
                    ]
                  },
                  {
                    id: 'custom.cellOptions',
                    value: { mode: 'basic', type: 'color-background' }
                  }
                ]
              },
              {
                matcher: {
                  id: 'byName',
                  options: 'CPU %'
                },
                properties: [
                  { id: 'unit', value: 'percent' },
                  { id: 'decimals', value: 1 },
                  {
                    id: 'custom.cellOptions',
                    value: { mode: 'gradient', type: 'gauge' }
                  },
                  { id: 'min', value: 0 },
                  { id: 'max', value: 100 },
                  {
                    id: 'thresholds',
                    value: {
                      mode: 'absolute',
                      steps: [
                        { color: '#73BF69', value: 0 },
                        { color: '#FADE2A', value: 75 },
                        { color: '#E02F44', value: 90 }
                      ]
                    }
                  }
                ]
              },
              {
                matcher: {
                  id: 'byName',
                  options: 'RAM %'
                },
                properties: [
                  { id: 'unit', value: 'percent' },
                  { id: 'decimals', value: 1 },
                  {
                    id: 'custom.cellOptions',
                    value: { mode: 'gradient', type: 'gauge' }
                  },
                  { id: 'min', value: 0 },
                  { id: 'max', value: 100 },
                  {
                    id: 'thresholds',
                    value: {
                      mode: 'absolute',
                      steps: [
                        { color: '#73BF69', value: 0 },
                        { color: '#FADE2A', value: 75 },
                        { color: '#E02F44', value: 90 }
                      ]
                    }
                  }
                ]
              },
              {
                matcher: {
                  id: 'byName',
                  options: 'Disco C: %'
                },
                properties: [
                  { id: 'unit', value: 'percent' },
                  { id: 'decimals', value: 1 },
                  {
                    id: 'custom.cellOptions',
                    value: { mode: 'gradient', type: 'gauge' }
                  },
                  { id: 'min', value: 0 },
                  { id: 'max', value: 100 },
                  {
                    id: 'thresholds',
                    value: {
                      mode: 'absolute',
                      steps: [
                        { color: '#73BF69', value: 0 },
                        { color: '#FADE2A', value: 80 },
                        { color: '#E02F44', value: 90 }
                      ]
                    }
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

deployTestTables().catch(console.error);
