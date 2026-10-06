// NOC - Zabbix Command Center · V9 Masterpiece
// Integra todas las mejoras solicitadas por el usuario:
// 1. Mosaicos con estado real (UP/DOWN/SIN DATOS) y nombres cortos y legibles.
// 2. Cobertura completa de servidores (27 hosts de cómputo, storage, VMs, hypervisors).
// 3. Telemetría de UPS real (Tensión 220V y Carga %) sin fallas de ping inexistente.
// 4. Indicador de frescura de telemetría (Último dato recibido en formato dateTimeFromNow).
// 5. Feed de incidentes nativo en tabla estándar con paleta de severidades corporativas.
// 6. Token seguro desde variables de entorno.

import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}
if (!token) {
  console.error('ERROR: No se encontró GRAFANA_SERVICE_ACCOUNT_TOKEN en las variables de entorno.');
  process.exit(1);
}

const grafanaUrl = 'http://172.27.210.154:3005';
const dsUid = 'efz4nzx8r30g0c';
const DS = { type: 'alexanderzobnin-zabbix-datasource', uid: dsUid };

// Paleta corporativa oficial Milicic / Zabbix
const C = {
  disaster: '#E02F44',
  high: '#FA6400',
  average: '#F2CC0C',
  warning: '#FADE2A',
  info: '#5794F2',
  ok: '#73BF69',
  nodata: '#6B7280',
  brand: '#EA580C',
  blue: '#38BDF8',
  slateDark: '#0F172A',
  slateCard: '#1E293B'
};

const upDownMappings = [
  {
    type: 'value',
    options: {
      '0': { color: C.disaster, index: 0, text: 'DOWN' },
      '1': { color: C.ok, index: 1, text: 'UP' }
    }
  },
  {
    type: 'special',
    options: {
      match: 'null+nan',
      result: { color: C.nodata, index: 2, text: 'SIN DATOS' }
    }
  }
];

const dashboard = {
  id: null,
  uid: 'noc-zabbix-command-center',
  title: 'NOC - Zabbix Command Center',
  description: 'Centro de Comando NOC Milicic S.A. · Monitoreo de Disponibilidad Global, Matriz de Salud de Infraestructura y Telemetría Crítica en Tiempo Real.',
  tags: ['noc', 'zabbix', 'milicic', 'command-center', 'masterpiece', 'v9'],
  timezone: 'browser',
  schemaVersion: 40,
  editable: true,
  refresh: '30s',
  time: { from: 'now-15m', to: 'now' },
  timepicker: {
    refresh_intervals: ['10s', '30s', '1m', '5m', '15m']
  },
  templating: {
    list: [
      {
        name: 'datasource',
        type: 'datasource',
        query: 'alexanderzobnin-zabbix-datasource',
        current: { text: 'alexanderzobnin-zabbix-datasource', value: dsUid },
        hide: 2
      }
    ]
  },
  panels: [
    // =========================================================================
    // FILA 0: HEADER CORPORATIVO & CONFIABILIDAD DE RECOLECCIÓN
    // =========================================================================
    {
      id: 1,
      title: '',
      type: 'text',
      gridPos: { x: 0, y: 0, w: 16, h: 3 },
      options: {
        mode: 'html',
        content: `
<div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%); border-left: 6px solid #EA580C; padding: 10px 16px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; height: 100%; box-sizing: border-box;">
  <div>
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="background: #EA580C; color: white; padding: 2px 7px; border-radius: 4px; font-weight: 800; font-size: 11px; letter-spacing: 0.5px;">MILICIC S.A.</span>
      <h2 style="margin: 0; color: #FFFFFF; font-size: 18px; font-weight: 700;">NOC COMMAND CENTER &bull; Zabbix 7.0 LTS</h2>
    </div>
    <p style="margin: 3px 0 0 0; color: #94A3B8; font-size: 11px;">Monitoreo Global de Disponibilidad &bull; Matriz de Salud de Infraestructura &bull; Telemetr&iacute;a Cr&iacute;tica en Vivo</p>
  </div>
  <div style="display: flex; gap: 14px; font-size: 11px; color: #E2E8F0; align-items: center;">
    <span><b style="display: inline-block; width: 10px; height: 10px; background: #73BF69; border-radius: 2px; margin-right: 4px;"></b>ONLINE (UP)</span>
    <span><b style="display: inline-block; width: 10px; height: 10px; background: #E02F44; border-radius: 2px; margin-right: 4px;"></b>CA&Iacute;DO (DOWN)</span>
    <span><b style="display: inline-block; width: 10px; height: 10px; background: #6B7280; border-radius: 2px; margin-right: 4px;"></b>SIN DATOS</span>
  </div>
</div>`
      }
    },
    {
      id: 2,
      title: 'Zabbix Server',
      description: 'Estado del agente en el host Zabbix server (1 = responde).',
      type: 'stat',
      gridPos: { x: 16, y: 0, w: 4, h: 3 },
      datasource: DS,
      fieldConfig: {
        defaults: {
          color: { mode: 'thresholds' },
          thresholds: { mode: 'absolute', steps: [{ color: C.disaster, value: null }, { color: C.ok, value: 1 }] },
          mappings: [
            { type: 'value', options: { '0': { color: C.disaster, index: 0, text: 'CAÍDO' }, '1': { color: C.ok, index: 1, text: 'ONLINE' } } },
            { type: 'special', options: { match: 'null+nan', result: { color: C.nodata, index: 2, text: 'SIN DATOS' } } }
          ],
          noValue: 'SIN DATOS'
        }
      },
      options: {
        reduceOptions: { calcs: ['last'], values: false },
        orientation: 'auto',
        textMode: 'value_and_name',
        colorMode: 'background',
        graphMode: 'none',
        justifyMode: 'center'
      },
      targets: [
        {
          refId: 'A', schema: 12, queryType: '0',
          group: { filter: 'Zabbix servers' },
          host: { filter: 'Zabbix server' },
          item: { filter: 'Zabbix agent ping' },
          resultFormat: 'time_series'
        }
      ]
    },
    {
      id: 16,
      title: 'Último dato recibido',
      description: 'Antigüedad de la última muestra del agente Zabbix. Si crece, la recolección se frenó.',
      type: 'stat',
      gridPos: { x: 20, y: 0, w: 4, h: 3 },
      datasource: DS,
      fieldConfig: {
        defaults: {
          color: { mode: 'fixed', fixedColor: '#38BDF8' },
          unit: 'dateTimeFromNow',
          noValue: 'sin datos',
          thresholds: { mode: 'absolute', steps: [{ color: '#38BDF8', value: null }] }
        }
      },
      options: {
        reduceOptions: { calcs: ['lastNotNull'], fields: '/^Time$/', values: false },
        orientation: 'auto',
        textMode: 'value',
        colorMode: 'background',
        graphMode: 'none',
        justifyMode: 'center'
      },
      targets: [
        {
          refId: 'A', schema: 12, queryType: '0',
          group: { filter: 'Zabbix servers' },
          host: { filter: 'Zabbix server' },
          item: { filter: 'Zabbix agent ping' },
          resultFormat: 'time_series'
        }
      ]
    },

    // =========================================================================
    // FILA 1: KPIs GLOBALES (Cómputo, Disponibilidad e Incidentes)
    // =========================================================================
    {
      id: 3,
      title: 'Nodos Monitoreados',
      description: 'Cantidad total de hosts distintos activos con ICMP ping o agent ping.',
      type: 'stat',
      gridPos: { x: 0, y: 3, w: 5, h: 4 },
      datasource: DS,
      fieldConfig: {
        defaults: {
          color: { mode: 'fixed', fixedColor: '#38BDF8' },
          thresholds: { mode: 'absolute', steps: [{ color: '#38BDF8', value: null }] }
        }
      },
      options: {
        reduceOptions: { calcs: ['count'], fields: '/^Field$/', values: false },
        textMode: 'value',
        colorMode: 'background',
        graphMode: 'none',
        justifyMode: 'center'
      },
      targets: [
        {
          refId: 'A', schema: 12, queryType: '0',
          group: { filter: '/.*/' },
          host: { filter: '/.*/' },
          item: { filter: '/(ICMP ping|agent.ping)/' },
          resultFormat: 'time_series',
          options: { showDisabledItems: false }
        }
      ],
      transformations: [
        { id: 'renameByRegex', options: { regex: '(.*):.*', renamePattern: '$1' } },
        { id: 'reduce', options: { mode: 'seriesToRows', reducers: ['lastNotNull'], includeTimeField: false } },
        { id: 'groupBy', options: { fields: { Field: { aggregations: [], operation: 'groupby' } } } }
      ]
    },
    {
      id: 7,
      title: 'Salud Global (Disponibilidad)',
      description: 'Porcentaje global de disponibilidad en vivo de toda la infraestructura.',
      type: 'gauge',
      gridPos: { x: 5, y: 3, w: 5, h: 4 },
      datasource: DS,
      fieldConfig: {
        defaults: {
          min: 0, max: 1, unit: 'percentunit',
          color: { mode: 'thresholds' },
          thresholds: {
            mode: 'absolute',
            steps: [
              { color: C.disaster, value: null },
              { color: C.average, value: 0.85 },
              { color: C.warning, value: 0.92 },
              { color: C.ok, value: 0.96 }
            ]
          }
        }
      },
      options: {
        showThresholdLabels: false,
        showThresholdMarkers: true,
        reduceOptions: { calcs: ['mean'], values: false }
      },
      targets: [
        {
          refId: 'A', schema: 12, queryType: '0',
          group: { filter: '/.*/' },
          host: { filter: '/.*/' },
          item: { filter: '/(ICMP ping|agent.ping)/' },
          resultFormat: 'time_series',
          options: { showDisabledItems: false }
        }
      ],
      transformations: [
        { id: 'reduce', options: { mode: 'seriesToRows', reducers: ['lastNotNull'], includeTimeField: false } }
      ]
    },
    {
      id: 4,
      title: 'Incidentes Críticos (Disaster/High)',
      description: 'Problemas activos no reconocidos con severidad High o Disaster.',
      type: 'stat',
      gridPos: { x: 10, y: 3, w: 7, h: 4 },
      datasource: DS,
      fieldConfig: {
        defaults: {
          noValue: '0',
          color: { mode: 'thresholds' },
          thresholds: {
            mode: 'absolute',
            steps: [
              { color: C.ok, value: null },
              { color: C.disaster, value: 1 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ['count'], fields: '', values: false },
        textMode: 'value',
        colorMode: 'background',
        graphMode: 'none',
        justifyMode: 'center'
      },
      targets: [
        {
          refId: 'A', schema: 12, queryType: '4',
          group: { filter: '/.*/' },
          host: { filter: '/.*/' },
          showProblems: 'problems',
          options: { minSeverity: 4, acknowledged: 2, hostsInMaintenance: false }
        }
      ],
      transformations: [
        { id: 'calculateField', options: { mode: 'index', alias: 'n', replaceFields: true } }
      ]
    },
    {
      id: 5,
      title: 'Alertas Preventivas (Warning/Average)',
      description: 'Problemas activos con severidad Warning o Average.',
      type: 'stat',
      gridPos: { x: 17, y: 3, w: 7, h: 4 },
      datasource: DS,
      fieldConfig: {
        defaults: {
          noValue: '0',
          color: { mode: 'thresholds' },
          thresholds: {
            mode: 'absolute',
            steps: [
              { color: C.ok, value: null },
              { color: C.warning, value: 1 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ['count'], fields: '', values: false },
        textMode: 'value',
        colorMode: 'background',
        graphMode: 'none',
        justifyMode: 'center'
      },
      targets: [
        {
          refId: 'A', schema: 12, queryType: '4',
          group: { filter: '/.*/' },
          host: { filter: '/.*/' },
          showProblems: 'problems',
          options: { minSeverity: 2, acknowledged: 2, hostsInMaintenance: false }
        }
      ],
      transformations: [
        {
          id: 'filterByValue',
          options: {
            filters: [
              { config: { id: 'regex', options: { value: '^(2|3|Warning|Average)$' } }, fieldName: 'Severity' }
            ],
            match: 'all',
            type: 'include'
          }
        },
        { id: 'calculateField', options: { mode: 'index', alias: 'n', replaceFields: true } }
      ]
    },

    // =========================================================================
    // FILA 2: MATRIZ DE SALUD EN MOSAICO (UN CUADRO POR HOST · LECTURA NOC)
    // =========================================================================
    {
      id: 8,
      title: 'Perímetro SD-WAN (FortiGates)',
      description: 'Un cuadrado por FortiGate (ICMP ping). Verde = UP, Rojo = DOWN, Gris = Sin Datos.',
      type: 'stat',
      gridPos: { x: 0, y: 7, w: 5, h: 9 },
      datasource: DS,
      fieldConfig: {
        defaults: {
          color: { mode: 'thresholds' },
          thresholds: { mode: 'absolute', steps: [{ color: C.disaster, value: null }, { color: C.ok, value: 1 }] },
          mappings: upDownMappings,
          noValue: 'SIN DATOS'
        }
      },
      options: {
        reduceOptions: { calcs: ['last'], values: false },
        orientation: 'auto',
        textMode: 'name',
        colorMode: 'background',
        graphMode: 'none',
        justifyMode: 'center',
        text: { titleSize: 12 }
      },
      targets: [
        {
          refId: 'A', schema: 12, queryType: '0',
          group: { filter: 'FortiGate' },
          host: { filter: '/.*/' },
          item: { filter: 'ICMP ping' },
          resultFormat: 'time_series'
        }
      ],
      transformations: [
        { id: 'renameByRegex', options: { regex: '(.*):.*', renamePattern: '$1' } },
        { id: 'renameByRegex', options: { regex: 'FTG_(.*)', renamePattern: '$1' } },
        { id: 'renameByRegex', options: { regex: '(.*)_SNMP', renamePattern: '$1' } }
      ]
    },
    {
      id: 9,
      title: 'Infra. Core & Servidores (Cómputo & Storage)',
      description: 'Servidores físicos y virtuales, Hipervisores, Controladores de Dominio, Storage y Backup.',
      type: 'stat',
      gridPos: { x: 5, y: 7, w: 7, h: 9 },
      datasource: DS,
      fieldConfig: {
        defaults: {
          color: { mode: 'thresholds' },
          thresholds: { mode: 'absolute', steps: [{ color: C.disaster, value: null }, { color: C.ok, value: 1 }] },
          mappings: upDownMappings,
          noValue: 'SIN DATOS'
        }
      },
      options: {
        reduceOptions: { calcs: ['last'], values: false },
        orientation: 'auto',
        textMode: 'name',
        colorMode: 'background',
        graphMode: 'none',
        justifyMode: 'center',
        text: { titleSize: 12 }
      },
      targets: [
        {
          refId: 'A', schema: 12, queryType: '0',
          group: { filter: '/(Windows_Server|Linux servers|Virtual machines|Hypervisors|Storage_Server|Backup_Server|Zabbix servers|AD|Datacenter|Applications)/' },
          host: { filter: '/.*/' },
          item: { filter: '/(agent.ping|ICMP ping)/' },
          resultFormat: 'time_series'
        }
      ],
      transformations: [
        { id: 'renameByRegex', options: { regex: '(.*):.*', renamePattern: '$1' } },
        { id: 'renameByRegex', options: { regex: 'SRO-(.*)', renamePattern: '$1' } },
        { id: 'renameByRegex', options: { regex: 'SSJ-(.*)', renamePattern: 'SJ-$1' } }
      ]
    },
    {
      id: 10,
      title: 'Redes (Switches) y APs (Aruba)',
      description: 'Switches de distribución/acceso y Access Points Aruba.',
      type: 'stat',
      gridPos: { x: 12, y: 7, w: 8, h: 9 },
      datasource: DS,
      fieldConfig: {
        defaults: {
          color: { mode: 'thresholds' },
          thresholds: { mode: 'absolute', steps: [{ color: C.disaster, value: null }, { color: C.ok, value: 1 }] },
          mappings: upDownMappings,
          noValue: 'SIN DATOS'
        }
      },
      options: {
        reduceOptions: { calcs: ['last'], values: false },
        orientation: 'auto',
        textMode: 'name',
        colorMode: 'background',
        graphMode: 'none',
        justifyMode: 'center',
        text: { titleSize: 12 }
      },
      targets: [
        {
          refId: 'A', schema: 12, queryType: '0',
          group: { filter: '/(ARUBA APs|switch|ANTENAS P2P)/' },
          host: { filter: '/.*/' },
          item: { filter: 'ICMP ping' },
          resultFormat: 'time_series'
        }
      ],
      transformations: [
        { id: 'renameByRegex', options: { regex: '(.*):.*', renamePattern: '$1' } },
        { id: 'renameByRegex', options: { regex: 'AP (.*)', renamePattern: '$1' } },
        { id: 'renameByRegex', options: { regex: 'SW (.*)', renamePattern: '$1' } }
      ]
    },
    {
      id: 11,
      title: 'Facilities & Energía (UPS)',
      description: 'UPS Datacenter y Galpón (Monitoreo por Tensión de Entrada SNMP).',
      type: 'stat',
      gridPos: { x: 20, y: 7, w: 4, h: 9 },
      datasource: DS,
      fieldConfig: {
        defaults: {
          color: { mode: 'thresholds' },
          thresholds: { mode: 'absolute', steps: [{ color: C.disaster, value: null }, { color: C.ok, value: 1 }] },
          mappings: upDownMappings,
          noValue: 'SIN DATOS'
        }
      },
      options: {
        reduceOptions: { calcs: ['last'], values: false },
        orientation: 'auto',
        textMode: 'name',
        colorMode: 'background',
        graphMode: 'none',
        justifyMode: 'center',
        text: { titleSize: 12 }
      },
      targets: [
        {
          refId: 'A', schema: 12, queryType: '0',
          group: { filter: 'UPS' },
          host: { filter: '/.*/' },
          item: { filter: '/Ups Input Voltage/' },
          resultFormat: 'time_series'
        }
      ],
      transformations: [
        { id: 'renameByRegex', options: { regex: '(.*):.*', renamePattern: '$1' } },
        { id: 'renameByRegex', options: { regex: 'UPS (.*)', renamePattern: '$1' } }
      ]
    },

    // =========================================================================
    // FILA 3: TELEMETRÍA PREDICTIVA (Top 5 Consumos, Tensión y Sesiones WAN)
    // =========================================================================
    {
      id: 13,
      title: 'Top 5 Servidores (Consumo CPU %)',
      description: 'Los 5 servidores con mayor utilización de CPU en este instante.',
      type: 'bargauge',
      gridPos: { x: 0, y: 16, w: 6, h: 7 },
      datasource: DS,
      fieldConfig: {
        defaults: {
          min: 0, max: 100, unit: 'percent',
          color: { mode: 'thresholds' },
          thresholds: {
            mode: 'absolute',
            steps: [
              { color: C.ok, value: null },
              { color: C.warning, value: 75 },
              { color: C.disaster, value: 90 }
            ]
          }
        }
      },
      options: {
        orientation: 'horizontal',
        displayMode: 'gradient',
        showUnfilled: true,
        reduceOptions: { calcs: ['lastNotNull'], values: true }
      },
      targets: [
        {
          refId: 'A', schema: 12, queryType: '0',
          group: { filter: '/(Zabbix servers|Servers|Datacenter|FortiGate|Windows_Server)/' },
          host: { filter: '/.*/' },
          item: { filter: '/(CPU utilization|CPU usage)/' },
          resultFormat: 'time_series'
        }
      ],
      transformations: [
        { id: 'renameByRegex', options: { regex: '(.*):.*', renamePattern: '$1' } },
        { id: 'reduce', options: { mode: 'seriesToRows', reducers: ['lastNotNull'], includeTimeField: false } },
        { id: 'organize', options: { excludeByName: {}, indexByName: {}, renameByName: { Field: 'Name', 'Last *NotNull': 'Value' } } },
        { id: 'sortBy', options: { fields: {}, sort: [{ desc: true, field: 'Value' }] } },
        { id: 'limit', options: { limitField: 5 } }
      ]
    },
    {
      id: 14,
      title: 'Top 5 Datacenters (Carga Eléctrica UPS %)',
      description: 'Porcentaje de carga eléctrica en las UPS monitoreadas.',
      type: 'bargauge',
      gridPos: { x: 6, y: 16, w: 6, h: 7 },
      datasource: DS,
      fieldConfig: {
        defaults: {
          min: 0, max: 100, unit: 'percent',
          color: { mode: 'thresholds' },
          thresholds: {
            mode: 'absolute',
            steps: [
              { color: C.ok, value: null },
              { color: C.warning, value: 70 },
              { color: C.disaster, value: 85 }
            ]
          }
        }
      },
      options: {
        orientation: 'horizontal',
        displayMode: 'gradient',
        showUnfilled: true,
        reduceOptions: { calcs: ['lastNotNull'], values: true }
      },
      targets: [
        {
          refId: 'A', schema: 12, queryType: '0',
          group: { filter: 'UPS' },
          host: { filter: '/.*/' },
          item: { filter: '/UPS Load/' },
          resultFormat: 'time_series'
        }
      ],
      transformations: [
        { id: 'renameByRegex', options: { regex: '(.*):.*', renamePattern: '$1' } },
        { id: 'reduce', options: { mode: 'seriesToRows', reducers: ['lastNotNull'], includeTimeField: false } },
        { id: 'organize', options: { excludeByName: {}, indexByName: {}, renameByName: { Field: 'Name', 'Last *NotNull': 'Value' } } },
        { id: 'sortBy', options: { fields: {}, sort: [{ desc: true, field: 'Value' }] } },
        { id: 'limit', options: { limitField: 5 } }
      ]
    },
    {
      id: 17,
      title: 'Tensión de entrada UPS (V)',
      description: 'Tensión de red eléctrica en cada UPS (Umbrales calibrados para red 220V).',
      type: 'stat',
      gridPos: { x: 12, y: 16, w: 4, h: 7 },
      datasource: DS,
      fieldConfig: {
        defaults: {
          unit: 'volt',
          decimals: 0,
          color: { mode: 'thresholds' },
          thresholds: {
            mode: 'absolute',
            steps: [
              { color: C.disaster, value: null },
              { color: C.warning, value: 190 },
              { color: C.ok, value: 205 },
              { color: C.warning, value: 245 },
              { color: C.disaster, value: 255 }
            ]
          },
          mappings: [
            { type: 'special', options: { match: 'null+nan', result: { color: C.nodata, index: 2, text: 'SIN DATOS' } } }
          ],
          noValue: 'SIN DATOS'
        }
      },
      options: {
        reduceOptions: { calcs: ['lastNotNull'], values: false },
        orientation: 'auto',
        textMode: 'value_and_name',
        colorMode: 'background',
        graphMode: 'none',
        justifyMode: 'center',
        text: { titleSize: 12 }
      },
      targets: [
        {
          refId: 'A', schema: 12, queryType: '0',
          group: { filter: 'UPS' },
          host: { filter: '/.*/' },
          item: { filter: '/Ups Input Voltage/' },
          resultFormat: 'time_series'
        }
      ],
      transformations: [
        { id: 'renameByRegex', options: { regex: '(.*):.*', renamePattern: '$1' } },
        { id: 'renameByRegex', options: { regex: 'UPS (.*)', renamePattern: '$1' } }
      ]
    },
    {
      id: 15,
      title: 'Tráfico de Sesiones Activas (FortiGates SD-WAN)',
      description: 'Sesiones IPv4 activas por firewall perimetral en tiempo real.',
      type: 'timeseries',
      gridPos: { x: 16, y: 16, w: 8, h: 7 },
      datasource: DS,
      fieldConfig: {
        defaults: {
          unit: 'short',
          color: { mode: 'palette-classic' },
          custom: { fillOpacity: 12, lineWidth: 2, drawStyle: 'line', spanNulls: false }
        }
      },
      options: {
        legend: { displayMode: 'list', placement: 'bottom', calcs: ['lastNotNull'], showLegend: true },
        tooltip: { mode: 'multi' }
      },
      targets: [
        {
          refId: 'A', schema: 12, queryType: '0',
          group: { filter: 'FortiGate' },
          host: { filter: '/.*/' },
          item: { filter: '/IPv4 Active sessions/' },
          resultFormat: 'time_series'
        }
      ],
      transformations: [
        { id: 'renameByRegex', options: { regex: 'FTG_(.*)_SNMP:.*', renamePattern: '$1' } }
      ]
    },

    // =========================================================================
    // FILA 4: FEED DE INCIDENTES EN TIEMPO REAL (ALERTAS ZABBIX)
    // =========================================================================
    {
      id: 12,
      title: 'Feed de Incidentes Activos en Tiempo Real (Alertas Zabbix)',
      description: 'Listado en vivo de problemas abiertos desde Warning, ordenados por severidad.',
      type: 'table',
      gridPos: { x: 0, y: 23, w: 24, h: 9 },
      datasource: DS,
      options: {
        showHeader: true,
        cellHeight: 'sm',
        sortBy: [{ displayName: 'Severity', desc: true }]
      },
      fieldConfig: {
        defaults: {
          custom: { align: 'auto', cellOptions: { type: 'auto' }, inspect: false }
        },
        overrides: [
          {
            matcher: { id: 'byName', options: 'Severity' },
            properties: [
              { id: 'custom.cellOptions', value: { type: 'color-background', mode: 'gradient' } },
              { id: 'custom.width', value: 130 },
              {
                id: 'mappings',
                value: [
                  { type: 'value', options: { Disaster: { color: C.disaster, index: 0, text: 'Disaster' }, '5': { color: C.disaster, index: 1, text: 'Disaster' } } },
                  { type: 'value', options: { High: { color: C.high, index: 2, text: 'High' }, '4': { color: C.high, index: 3, text: 'High' } } },
                  { type: 'value', options: { Average: { color: C.average, index: 4, text: 'Average' }, '3': { color: C.average, index: 5, text: 'Average' } } },
                  { type: 'value', options: { Warning: { color: C.warning, index: 6, text: 'Warning' }, '2': { color: C.warning, index: 7, text: 'Warning' } } },
                  { type: 'value', options: { Information: { color: C.info, index: 8, text: 'Information' }, '1': { color: C.info, index: 9, text: 'Information' } } },
                  { type: 'value', options: { 'Not classified': { color: C.nodata, index: 10, text: 'Not classified' }, '0': { color: C.nodata, index: 11, text: 'Not classified' } } }
                ]
              }
            ]
          },
          {
            matcher: { id: 'byName', options: 'Time' },
            properties: [{ id: 'custom.width', value: 160 }]
          },
          {
            matcher: { id: 'byName', options: 'Host' },
            properties: [{ id: 'custom.width', value: 200 }]
          }
        ]
      },
      targets: [
        {
          refId: 'A',
          schema: 12,
          queryType: '4',
          group: { filter: '/.*/' },
          host: { filter: '/.*/' },
          showProblems: 'problems',
          options: {
            acknowledged: 2,
            minSeverity: 2,
            hostsInMaintenance: false
          }
        }
      ]
    }
  ]
};

async function deploy() {
  console.log('=== DESPLEGANDO DASHBOARD NOC V9 MASTERPIECE ===');
  const payload = JSON.stringify({ dashboard, folderUid: 'milicic-noc', overwrite: true });

  return new Promise((resolve, reject) => {
    const req = http.request(`${grafanaUrl}/api/dashboards/db`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => {
        try {
          resolve(JSON.parse(b));
        } catch (e) {
          resolve({ raw: b });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

deploy().then(res => {
  if (res.status === 'success') {
    console.log(`¡DASHBOARD V9 DESPLEGADO EXITOSAMENTE! Versión: ${res.version}`);
    console.log(`URL: ${grafanaUrl}${res.url}`);

    // Guardar respaldos locales
    fs.mkdirSync('dashboards', { recursive: true });
    fs.mkdirSync(path.join('.zabbix_context', 'dashboards'), { recursive: true });
    fs.writeFileSync(path.join('dashboards', 'noc-zabbix-command-center.json'), JSON.stringify(dashboard, null, 2));
    fs.writeFileSync(path.join('.zabbix_context', 'dashboards', 'noc-zabbix-command-center.json'), JSON.stringify(dashboard, null, 2));
    console.log('Archivos sincronizados en dashboards/ y .zabbix_context/dashboards/');
  } else {
    console.error('Error al desplegar:', res);
  }
}).catch(console.error);
