// NOC - Zabbix Command Center · V10 Enterprise Masterpiece
// Integra todas las mejoras solicitadas por el usuario:
// 1. Restauración completa de 'alexanderzobnin-zabbix-triggers-panel' (Zabbix Problems Panel oficial v6.8.0).
// 2. Activación explícita del plugin vía API (/api/plugins/alexanderzobnin-zabbix-triggers-panel/settings).
// 3. Deduplicación inteligente de servidores en mosaico (reduce + groupBy host min): cada servidor aparece UNA SOLA VEZ y los caídos van primero.
// 4. Corrección de KPIs de incidentes (P1 Críticos vs P2/P3 Preventivas con queryType 5 y conteo real de problemas).
// 5. Filtro estricto de servidores en 'Top 5 Servidores CPU %' (excluye firewalls FortiGate).
// 6. Deduplicación de UPS en 'Carga Eléctrica UPS %' (excluye ítem calculado artificial, conservando la telemetría real).
// 7. Token seguro desde variables de entorno.

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

// Helper para deduplicar mosaicos por host y ordenar caídos primero
const perHostDeduplication = [
  { id: 'reduce', options: { mode: 'seriesToRows', reducers: ['lastNotNull'], includeTimeField: false } },
  { id: 'groupBy', options: { fields: { Field: { operation: 'groupby', aggregations: [] }, 'Last *NotNull': { operation: 'aggregate', aggregations: ['min'] } } } },
  { id: 'organize', options: { renameByName: { Field: 'Host', 'Last *NotNull (min)': 'Estado' } } },
  { id: 'sortBy', options: { fields: {}, sort: [{ field: 'Estado', desc: false }] } }
];

const dashboard = {
  id: null,
  uid: 'noc-zabbix-command-center',
  title: 'NOC - Zabbix Command Center',
  description: 'Centro de Comando NOC Milicic S.A. · Monitoreo de Disponibilidad Global, Matriz de Salud de Infraestructura y Telemetría Crítica en Tiempo Real.',
  tags: ['noc', 'zabbix', 'milicic', 'command-center', 'masterpiece', 'v10'],
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
    // FILA 0: HEADER CORPORATIVO & CONFIABILIDAD DE RECOLECCIÓN (y: 0, h: 3)
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
    // FILA 1: KPIs GLOBALES (Disponibilidad e Incidentes) (y: 3, h: 4)
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
      description: 'Problemas activos en Zabbix con severidad High o Disaster.',
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
          refId: 'A', schema: 12, queryType: '5',
          group: { filter: '/.*/' },
          host: { filter: '/.*/' },
          showProblems: 'problems',
          options: {
            minSeverity: 4,
            severities: [4, 5],
            acknowledged: 2,
            hostsInMaintenance: false,
            sortProblems: 'priority',
            limit: 1000
          }
        }
      ],
      transformations: [
        { id: 'calculateField', options: { mode: 'index', alias: 'n', replaceFields: true } }
      ]
    },
    {
      id: 5,
      title: 'Alertas Preventivas (Warning/Average)',
      description: 'Problemas activos en Zabbix con severidad Warning o Average.',
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
          refId: 'A', schema: 12, queryType: '5',
          group: { filter: '/.*/' },
          host: { filter: '/.*/' },
          showProblems: 'problems',
          options: {
            minSeverity: 2,
            severities: [2, 3],
            acknowledged: 2,
            hostsInMaintenance: false,
            sortProblems: 'priority',
            limit: 1000
          }
        }
      ],
      transformations: [
        { id: 'calculateField', options: { mode: 'index', alias: 'n', replaceFields: true } }
      ]
    },

    // =========================================================================
    // FILA 2: MATRIZ DE SALUD EN MOSAICO (DEDUPLICADA · CAÍDOS PRIMERO) (y: 7, h: 9)
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
        { id: 'renameByRegex', options: { regex: '(.*)_SNMP', renamePattern: '$1' } },
        ...perHostDeduplication
      ]
    },
    {
      id: 9,
      title: 'Infra. Core & Servidores (Cómputo & Storage)',
      description: 'Servidores físicos y virtuales, Hipervisores, Controladores de Dominio, Storage y Backup. Deduplicados con el peor estado primero.',
      type: 'stat',
      gridPos: { x: 5, y: 7, w: 9, h: 9 },
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
        { id: 'renameByRegex', options: { regex: 'SSJ-(.*)', renamePattern: 'SJ-$1' } },
        ...perHostDeduplication
      ]
    },
    {
      id: 10,
      title: 'Redes (Switches) y APs (Aruba)',
      description: 'Switches de distribución/acceso y Access Points Aruba. Deduplicados.',
      type: 'stat',
      gridPos: { x: 14, y: 7, w: 6, h: 9 },
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
          group: { filter: '/(switch|ARUBA APs|ANTENAS P2P)/' },
          host: { filter: '/.*/' },
          item: { filter: 'ICMP ping' },
          resultFormat: 'time_series'
        }
      ],
      transformations: [
        { id: 'renameByRegex', options: { regex: '(.*):.*', renamePattern: '$1' } },
        { id: 'renameByRegex', options: { regex: 'SRO-(.*)', renamePattern: '$1' } },
        ...perHostDeduplication
      ]
    },
    {
      id: 11,
      title: 'Facilities & Energía (UPS)',
      description: 'Estado de operación y conectividad de UPS en Datacenters.',
      type: 'stat',
      gridPos: { x: 20, y: 7, w: 4, h: 9 },
      datasource: DS,
      fieldConfig: {
        defaults: {
          color: { mode: 'thresholds' },
          thresholds: { mode: 'absolute', steps: [{ color: C.disaster, value: null }, { color: C.ok, value: 180 }] },
          mappings: [
            { type: 'range', options: { from: 180, to: 260, result: { color: C.ok, index: 0, text: 'ONLINE' } } },
            { type: 'special', options: { match: 'null+nan', result: { color: C.nodata, index: 1, text: 'SIN DATOS' } } }
          ],
          noValue: 'SIN DATOS'
        }
      },
      options: {
        reduceOptions: { calcs: ['lastNotNull'], values: false },
        orientation: 'auto',
        textMode: 'name',
        colorMode: 'background',
        graphMode: 'none',
        justifyMode: 'center',
        text: { titleSize: 14 }
      },
      targets: [
        {
          refId: 'A', schema: 12, queryType: '0',
          group: { filter: 'UPS' },
          host: { filter: '/.*/' },
          item: { filter: '/(Ups Input Voltage|Input Voltage|Input phase 1 voltage)/' },
          resultFormat: 'time_series'
        }
      ],
      transformations: [
        { id: 'renameByRegex', options: { regex: '(.*):.*', renamePattern: '$1' } },
        { id: 'renameByRegex', options: { regex: 'UPS (.*)', renamePattern: '$1' } }
      ]
    },

    // =========================================================================
    // FILA 3: TELEMETRÍA CRÍTICA EN VIVO (Cómputo, Energía, Redes) (y: 16, h: 7)
    // =========================================================================
    {
      id: 13,
      title: 'Top 5 Servidores (Consumo CPU %)',
      description: 'Servidores de cómputo con mayor utilización de CPU en tiempo real (excluye switches/firewalls).',
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
          group: { filter: '/(Windows_Server|Linux servers|Virtual machines|Hypervisors|Storage_Server|Backup_Server|Zabbix servers|AD)/' },
          host: { filter: '/.*/' },
          item: { filter: '/^CPU utilization$/' },
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
      description: 'Porcentaje de carga eléctrica en las UPS monitoreadas (telemetría directa).',
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
          item: { filter: '/^(UPS Load \\(%\\)|Output Load Estimated)$/' },
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
          item: { filter: '/(Ups Input Voltage|Input Voltage|Input phase 1 voltage)/' },
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
      description: 'Sesiones IPv4 concurrentes cursadas por los firewalls de borde.',
      type: 'timeseries',
      gridPos: { x: 16, y: 16, w: 8, h: 7 },
      datasource: DS,
      fieldConfig: {
        defaults: {
          custom: { drawStyle: 'line', lineInterpolation: 'smooth', lineWidth: 2, fillOpacity: 10, showPoints: 'never' },
          unit: 'short'
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
    // FILA 4: FEED DE INCIDENTES EN TIEMPO REAL (ZABBIX PROBLEMS PANEL NATIVO) (y: 23, h: 10)
    // =========================================================================
    {
      id: 12,
      title: 'Feed de Incidentes Activos en Tiempo Real (Alertas Zabbix)',
      description: 'Panel nativo Zabbix Problems (alexanderzobnin-zabbix-triggers-panel). Problemas abiertos desde Warning ordenados por prioridad.',
      type: 'alexanderzobnin-zabbix-triggers-panel',
      gridPos: { x: 0, y: 23, w: 24, h: 10 },
      datasource: DS,
      targets: [
        {
          refId: 'A',
          datasource: DS,
          schema: 12,
          queryType: '5',
          showProblems: 'problems',
          group: { filter: '/.*/' },
          host: { filter: '/.*/' },
          application: { filter: '' },
          trigger: { filter: '' },
          tags: { filter: '' },
          proxy: { filter: '' },
          options: {
            minSeverity: 2,
            severities: [2, 3, 4, 5],
            acknowledged: 2,
            hostsInMaintenance: false,
            sortProblems: 'priority',
            limit: 200,
            useTimeRange: false,
            showDisabledItems: false
          }
        }
      ],
      options: {
        schemaVersion: 8,
        layout: 'table',
        hostField: true,
        hostTechNameField: false,
        hostIpField: false,
        hostProxy: false,
        hostGroups: false,
        showTags: false,
        statusField: false,
        statusIcon: false,
        severityField: true,
        ackField: true,
        ageField: true,
        opdataField: false,
        descriptionField: true,
        descriptionAtNewLine: false,
        showDatasourceName: false,
        sortProblems: 'priority',
        limit: null,
        fontSize: '110%',
        pageSize: 10,
        showSearchFilter: true,
        problemTimeline: true,
        highlightBackground: false,
        highlightNewEvents: true,
        highlightNewerThan: '1h',
        customLastChangeFormat: false,
        lastChangeFormat: '',
        resizedColumns: [],
        markAckEvents: true,
        okEventColor: C.ok,
        ackEventColor: '#38BDF8',
        triggerSeverity: [
          { priority: 0, severity: 'Not classified', color: C.nodata, show: true },
          { priority: 1, severity: 'Information', color: C.info, show: true },
          { priority: 2, severity: 'Warning', color: C.warning, show: true },
          { priority: 3, severity: 'Average', color: C.average, show: true },
          { priority: 4, severity: 'High', color: C.high, show: true },
          { priority: 5, severity: 'Disaster', color: C.disaster, show: true }
        ]
      }
    }
  ]
};

async function enablePlugin() {
  console.log('1. Asegurando activación del plugin alexanderzobnin-zabbix-triggers-panel...');
  const payload = JSON.stringify({ enabled: true });
  return new Promise((resolve) => {
    const req = http.request(`${grafanaUrl}/api/plugins/alexanderzobnin-zabbix-triggers-panel/settings`, {
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
        console.log(`   Resultado de activación: HTTP ${res.statusCode} -> ${b}`);
        resolve();
      });
    });
    req.on('error', err => {
      console.warn('   Aviso al activar plugin:', err.message);
      resolve();
    });
    req.write(payload);
    req.end();
  });
}

async function deployDashboard() {
  console.log('2. Desplegando Dashboard NOC V10 Enterprise Masterpiece...');
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

async function main() {
  await enablePlugin();
  const res = await deployDashboard();
  if (res.status === 'success') {
    console.log(`\n¡DASHBOARD V10 DESPLEGADO EXITOSAMENTE! Versión: ${res.version}`);
    console.log(`URL: ${grafanaUrl}${res.url}`);

    // Guardar respaldos locales
    fs.mkdirSync('dashboards', { recursive: true });
    fs.mkdirSync(path.join('.zabbix_context', 'dashboards'), { recursive: true });
    fs.writeFileSync(path.join('dashboards', 'noc-zabbix-command-center.json'), JSON.stringify(dashboard, null, 2));
    fs.writeFileSync(path.join('.zabbix_context', 'dashboards', 'noc-zabbix-command-center.json'), JSON.stringify(dashboard, null, 2));
    console.log('Archivos sincronizados en dashboards/ y .zabbix_context/dashboards/');
  } else {
    console.error('Error al desplegar dashboard:', res);
  }
}

main().catch(console.error);
