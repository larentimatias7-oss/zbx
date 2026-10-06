// NOC - Zabbix Command Center · V8
// Basado en la versión editada por el usuario (mapeos SIN DATOS, frescura de datos, tensión UPS)
// + correcciones validadas contra datos reales de Zabbix (ver walkthrough).
// Token: se lee de la variable de entorno GRAFANA_SERVICE_ACCOUNT_TOKEN (nunca hardcodeado).
import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}
if (!token) { console.error('Falta GRAFANA_SERVICE_ACCOUNT_TOKEN'); process.exit(1); }

const grafanaUrl = 'http://172.27.210.154:3005';
const DS = { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' };
const ZBX = 'https://zabbix.mlccnet.local';

// Paleta corporativa (grafana-milicic-standards §4)
const C = { ok: '#73BF69', info: '#5794F2', warn: '#FFC859', avg: '#FFA059', high: '#E97659', dis: '#E45959', nodata: '#6B7280', blue: '#38BDF8' };

// ---------- Helpers de consultas ----------
const metric = (refId, group, host, item) => ({
  refId, datasource: DS, schema: 12, queryType: '0',
  group: { filter: group }, host: { filter: host }, item: { filter: item },
  application: { filter: '' }, itemTag: { filter: '' }, functions: [],
  resultFormat: 'time_series', options: { showDisabledItems: false }
});

const problems = (severities, acknowledged = 2) => ({
  refId: 'A', datasource: DS, schema: 12, queryType: '5',
  group: { filter: '/.*/' }, host: { filter: '/.*/' },
  application: { filter: '' }, itemTag: { filter: '' }, proxy: { filter: '' }, trigger: { filter: '' }, tags: { filter: '' },
  showProblems: 'problems',
  options: { hostsInMaintenance: false, acknowledged, sortProblems: 'priority', minSeverity: Math.min(...severities), severities, limit: 1001, useTimeRange: false, showDisabledItems: false }
});

// Selecciones de hosts (por grupo Zabbix → escalan solas al agregar hosts al grupo)
const ALL_PING = '/^(ICMP ping|Zabbix agent ping)$/';
const SRV_GROUPS = '/^(Windows_Server|Linux servers|Virtual machines|Hypervisors|Storage_Server|Backup_Server|Zabbix servers|AD|print|File_server|Applications)$/';

// ---------- Helpers de transformaciones ----------
const stripItem = { id: 'renameByRegex', options: { regex: '^(.*): [^:]+$', renamePattern: '$1' } };
const rename = (regex, renamePattern) => ({ id: 'renameByRegex', options: { regex, renamePattern } });
// Una fila por host (deduplica ICMP + agent ping) con el PEOR estado (min) y ordenado caídos primero
const perHostState = [
  { id: 'reduce', options: { mode: 'seriesToRows', reducers: ['lastNotNull'], includeTimeField: false } },
  { id: 'groupBy', options: { fields: { Field: { operation: 'groupby', aggregations: [] }, 'Last *': { operation: 'aggregate', aggregations: ['min'] } } } },
  { id: 'organize', options: { renameByName: { Field: 'Host', 'Last * (min)': 'Estado' } } },
  { id: 'sortBy', options: { fields: {}, sort: [{ field: 'Estado', desc: false }] } }
];
const countRows = { id: 'calculateField', options: { mode: 'index', alias: 'n', replaceFields: true } };
// Matriz host × ítem a partir de las etiquetas host/item que entrega el datasource
const matrix = [
  { id: 'reduce', options: { mode: 'seriesToRows', reducers: ['lastNotNull'], includeTimeField: false, labelsToFields: true } },
  { id: 'groupingToMatrix', options: { columnField: 'item', rowField: 'host', valueField: 'Last *', emptyValue: 'null' } }
];

// ---------- Helpers de configuración visual ----------
const upDownMappings = [
  { type: 'value', options: { '0': { text: 'DOWN', color: C.dis, index: 0 }, '1': { text: 'UP', color: C.ok, index: 1 } } },
  { type: 'special', options: { match: 'null+nan', result: { text: 'SIN DATOS', color: C.nodata, index: 2 } } }
];
const steps = (...s) => ({ mode: 'absolute', steps: s.map(([color, value]) => ({ color, value })) });
const cell = (type, extra = {}) => ({ id: 'custom.cellOptions', value: { type, ...extra } });
const byName = (name, properties) => ({ matcher: { id: 'byName', options: name }, properties });

let nextId = 1;
const panel = (p) => ({ id: nextId++, datasource: DS, links: [], ...p });

function mosaic({ title, description, gridPos, target, renames = [], drill }) {
  return panel({
    title, description, type: 'stat', gridPos,
    links: drill ? [{ title: `Abrir detalle: ${drill.title}`, url: `/d/${drill.uid}` }] : [],
    targets: [target],
    transformations: [stripItem, ...renames, ...perHostState],
    fieldConfig: {
      defaults: {
        color: { mode: 'thresholds' }, thresholds: steps([C.dis, null], [C.ok, 1]),
        mappings: upDownMappings, noValue: 'SIN DATOS',
        links: [{ title: 'Buscar host en Zabbix', url: `${ZBX}/zabbix.php?action=search&search=\${__data.fields.Host}`, targetBlank: true }]
      },
      overrides: []
    },
    options: {
      reduceOptions: { values: true, calcs: ['lastNotNull'], fields: '/^Estado$/', limit: 500 },
      orientation: 'auto', textMode: 'name', colorMode: 'background', graphMode: 'none', justifyMode: 'center',
      wideLayout: true, showPercentChange: false, text: { titleSize: 13 }
    }
  });
}

function kpi({ title, description, gridPos, targets, transformations, calcs = ['count'], fields = '', thresholds, unit, decimals, noValue = '0', fixedColor }) {
  return panel({
    title, description, type: 'stat', gridPos, targets, transformations,
    fieldConfig: {
      defaults: {
        color: fixedColor ? { mode: 'fixed', fixedColor } : { mode: 'thresholds' },
        thresholds: thresholds || steps([C.blue, null]), unit, decimals, noValue
      },
      overrides: []
    },
    options: {
      reduceOptions: { values: false, calcs, fields }, textMode: 'value', colorMode: 'background',
      graphMode: 'none', justifyMode: 'center', orientation: 'auto', wideLayout: true, showPercentChange: false
    }
  });
}

// ================= PANELES =================
const panels = [];

// ---- Fila 0: Cabecera + confiabilidad del tablero ----
panels.push(panel({
  title: '', type: 'text', gridPos: { x: 0, y: 0, w: 12, h: 3 }, datasource: undefined,
  options: {
    mode: 'html', content: `
<div style="background:linear-gradient(135deg,#0F172A 0%,#1E293B 60%,#0F172A 100%);border-left:6px solid #EA580C;padding:8px 16px;border-radius:6px;height:100%;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;">
  <div style="display:flex;align-items:center;gap:10px;">
    <span style="background:#EA580C;color:#fff;padding:2px 8px;border-radius:4px;font-weight:800;font-size:11px;letter-spacing:.5px;">MILICIC S.A.</span>
    <h1 style="margin:0;color:#fff;font-size:18px;font-weight:700;">NOC Command Center</h1>
  </div>
  <div style="margin-top:6px;display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:#CBD5E1;">
    <span><b style="display:inline-block;width:10px;height:10px;background:${C.ok};border-radius:2px;"></b> Responde</span>
    <span><b style="display:inline-block;width:10px;height:10px;background:${C.dis};border-radius:2px;"></b> Caído</span>
    <span><b style="display:inline-block;width:10px;height:10px;background:${C.nodata};border-radius:2px;"></b> Sin datos</span>
    <span style="color:#94A3B8;">· Caídos primero · Clic en un cuadro → Zabbix · Clic en el título → detalle</span>
  </div>
</div>` }
}));
delete panels[0].datasource;

panels.push(panel({
  title: 'Zabbix Server', description: 'Agente del host Zabbix server (1 = responde). Gris = sin datos recientes.',
  type: 'stat', gridPos: { x: 12, y: 0, w: 4, h: 3 },
  links: [{ title: 'Abrir detalle: Zabbix Server Health', url: '/d/milicic-zabbix-server-health' }],
  targets: [metric('A', 'Zabbix servers', 'Zabbix server', 'Zabbix agent ping')],
  fieldConfig: { defaults: { color: { mode: 'thresholds' }, thresholds: steps([C.dis, null], [C.ok, 1]), noValue: 'SIN DATOS',
    mappings: [{ type: 'value', options: { '0': { text: 'CAÍDO', color: C.dis, index: 0 }, '1': { text: 'ONLINE', color: C.ok, index: 1 } } }, upDownMappings[1]] }, overrides: [] },
  options: { reduceOptions: { values: false, calcs: ['last'], fields: '' }, textMode: 'value', colorMode: 'background', graphMode: 'none', justifyMode: 'center', orientation: 'auto', wideLayout: true, showPercentChange: false }
}));

panels.push(panel({
  title: 'Ítems atrasados > 10 min', description: 'zabbix[queue,10m]: ítems cuya recolección está demorada más de 10 minutos. Si sube, los colores del tablero dejan de ser confiables.',
  type: 'stat', gridPos: { x: 16, y: 0, w: 4, h: 3 },
  targets: [metric('A', 'Zabbix servers', 'Zabbix server', 'Queue over 10 minutes')],
  fieldConfig: { defaults: { color: { mode: 'thresholds' }, thresholds: steps([C.ok, null], [C.warn, 1], [C.dis, 50]), noValue: 'SIN DATOS', decimals: 0 }, overrides: [] },
  options: { reduceOptions: { values: false, calcs: ['lastNotNull'], fields: '' }, textMode: 'value', colorMode: 'background', graphMode: 'area', justifyMode: 'center', orientation: 'auto', wideLayout: true, showPercentChange: false }
}));

panels.push(panel({
  title: 'Último dato recibido', description: 'Antigüedad de la última muestra del agente de Zabbix server. Si crece, la recolección se frenó.',
  type: 'stat', gridPos: { x: 20, y: 0, w: 4, h: 3 },
  targets: [metric('A', 'Zabbix servers', 'Zabbix server', 'Zabbix agent ping')],
  fieldConfig: { defaults: { color: { mode: 'fixed', fixedColor: '#1E3A5F' }, unit: 'dateTimeFromNow', noValue: 'sin datos' }, overrides: [] },
  options: { reduceOptions: { values: false, calcs: ['lastNotNull'], fields: '/^Time$/' }, textMode: 'value', colorMode: 'background', graphMode: 'none', justifyMode: 'center', orientation: 'auto', wideLayout: true, showPercentChange: false }
}));

// ---- Fila 1: KPIs ----
const allPing = metric('A', '/.*/', '/.*/', ALL_PING);
panels.push(kpi({
  title: 'Hosts monitoreados', description: 'Hosts distintos con ICMP ping o agent ping (un host con ambos cuenta una vez).',
  gridPos: { x: 0, y: 3, w: 4, h: 3 }, targets: [allPing], transformations: [stripItem, ...perHostState],
  calcs: ['count'], fields: '/^Host$/', fixedColor: C.blue
}));
panels.push(kpi({
  title: 'Hosts sin respuesta', description: 'Hosts cuyo último ping (ICMP o agente) es 0.',
  gridPos: { x: 4, y: 3, w: 4, h: 3 }, targets: [allPing],
  transformations: [stripItem, ...perHostState, { id: 'filterByValue', options: { type: 'include', match: 'all', filters: [{ fieldName: 'Estado', config: { id: 'equal', options: { value: 0 } } }] } }],
  calcs: ['count'], fields: '/^Host$/', thresholds: steps([C.ok, null], [C.dis, 1])
}));
panels.push(kpi({
  title: 'Disponibilidad', description: 'Porcentaje de hosts que responden ahora mismo.',
  gridPos: { x: 8, y: 3, w: 4, h: 3 }, targets: [allPing], transformations: [stripItem, ...perHostState],
  calcs: ['mean'], fields: '/^Estado$/', unit: 'percentunit', decimals: 1, noValue: 'SIN DATOS',
  thresholds: steps([C.dis, null], [C.avg, 0.9], [C.warn, 0.95], [C.ok, 0.98])
}));
panels.push(kpi({
  title: 'Problemas P1 (High / Disaster)', description: 'Problemas activos con severidad High o Disaster (excluye hosts en mantenimiento).',
  gridPos: { x: 12, y: 3, w: 4, h: 3 }, targets: [problems([4, 5])], transformations: [countRows],
  thresholds: steps([C.ok, null], [C.dis, 1])
}));
panels.push(kpi({
  title: 'Problemas P2/P3 (Average / Warning)', description: 'Problemas activos con severidad Average o Warning.',
  gridPos: { x: 16, y: 3, w: 4, h: 3 }, targets: [problems([2, 3])], transformations: [countRows],
  thresholds: steps([C.ok, null], [C.warn, 1])
}));
panels.push(kpi({
  title: 'Sin reconocer (ACK)', description: 'Problemas activos (Warning o superior) que nadie reconoció todavía en Zabbix.',
  gridPos: { x: 20, y: 3, w: 4, h: 3 }, targets: [problems([2, 3, 4, 5], 0)], transformations: [countRows],
  thresholds: steps([C.ok, null], [C.avg, 1])
}));

// ---- Fila 2: Mosaicos de salud (un cuadro por host, caídos primero) ----
panels.push(mosaic({
  title: 'WAN · FortiGates e Internet', description: 'Un cuadro por FortiGate (ICMP ping) + sonda a Internet. Verde = responde, rojo = caído, gris = sin datos.',
  gridPos: { x: 0, y: 6, w: 6, h: 8 },
  target: metric('A', '/.*/', '/^(FTG_.*_SNMP|DNS Google.*)$/', 'ICMP ping'),
  renames: [rename('^FTG_(.*)$', '$1'), rename('^(.*)_SNMP$', '$1')],
  drill: { title: 'FortiGate SD-WAN', uid: 'milicic-fortigate-sdwan' }
}));
panels.push(mosaic({
  title: 'Red LAN · Switches y enlaces P2P', description: 'Grupos Zabbix "switch" y "ANTENAS P2P" (ICMP ping).',
  gridPos: { x: 6, y: 6, w: 5, h: 8 },
  target: metric('A', '/^(switch|ANTENAS P2P)$/', '/.*/', 'ICMP ping'),
  drill: { title: 'Switches Core', uid: 'milicic-switches-core' }
}));
panels.push(mosaic({
  title: 'Wi-Fi · Access Points Aruba', description: 'Grupo Zabbix "ARUBA APs" (ICMP ping). Se omite el prefijo SRO-.',
  gridPos: { x: 11, y: 6, w: 5, h: 8 },
  target: metric('A', 'ARUBA APs', '/.*/', 'ICMP ping'),
  renames: [rename('^SRO-(.*)$', '$1')],
  drill: { title: 'Aruba Wi-Fi', uid: 'milicic-aruba-wifi-switches' }
}));
panels.push(mosaic({
  title: 'Servidores · Virtualización · Storage', description: 'Servidores Windows/Linux, VMs, hipervisores, storage y backup. Un cuadro por host: se toma el peor valor entre ICMP ping y agent ping. Si el agente cae sin ICMP, pasa a gris al vencer el rango.',
  gridPos: { x: 16, y: 6, w: 8, h: 8 },
  target: metric('A', SRV_GROUPS, '/.*/', ALL_PING),
  drill: { title: 'Servidores', uid: 'milicic-servers-overview' }
}));

// ---- Fila 3: Telemetría que anticipa fallas ----
panels.push(panel({
  title: 'Calidad WAN por sitio', description: 'Pérdida de paquetes y latencia ICMP hacia cada FortiGate. Detecta enlaces degradados que todavía figuran UP. Ordenado por pérdida.',
  type: 'table', gridPos: { x: 0, y: 14, w: 8, h: 8 },
  links: [{ title: 'Abrir detalle: Matriz de latencia WAN', url: '/d/milicic-noc-latency-matrix' }],
  targets: [metric('A', '/.*/', '/^FTG_.*_SNMP$/', '/^ICMP (loss|response time)$/')],
  transformations: [...matrix, { id: 'organize', options: { renameByName: { 'host\\item': 'Sitio', 'ICMP loss': 'Pérdida', 'ICMP response time': 'Latencia' }, indexByName: { 'host\\item': 0, 'ICMP loss': 1, 'ICMP response time': 2 } } }],
  fieldConfig: {
    defaults: { custom: { align: 'auto', cellOptions: { type: 'auto' }, inspect: false }, noValue: '—' },
    overrides: [
      byName('Sitio', [{ id: 'mappings', value: [{ type: 'regex', options: { pattern: '^FTG_(.*)_SNMP$', result: { text: '$1', index: 0 } } }] }]),
      byName('Pérdida', [{ id: 'unit', value: 'percent' }, { id: 'decimals', value: 0 }, { id: 'thresholds', value: steps([C.ok, null], [C.warn, 1], [C.avg, 20], [C.dis, 100]) }, { id: 'color', value: { mode: 'thresholds' } }, cell('color-background', { mode: 'basic' }), { id: 'custom.width', value: 95 }]),
      byName('Latencia', [{ id: 'unit', value: 's' }, { id: 'decimals', value: 0 }, { id: 'thresholds', value: steps([C.ok, null], [C.warn, 0.15], [C.dis, 0.3]) }, { id: 'color', value: { mode: 'thresholds' } }, cell('color-text'), { id: 'custom.width', value: 95 }])
    ]
  },
  options: { showHeader: true, cellHeight: 'sm', sortBy: [{ displayName: 'Pérdida', desc: true }] }
}));

panels.push(panel({
  title: 'Energía · UPS', description: 'Estado de salida (RFC1628 upsOutputSource), autonomía, carga y tensión de entrada por UPS. "Carga %" toma el mayor entre UPS Load y Output Load Estimated.',
  type: 'table', gridPos: { x: 8, y: 14, w: 8, h: 8 },
  links: [{ title: 'Abrir detalle: Facilities & UPS', url: '/d/milicic-facilities-ups' }],
  targets: [metric('A', 'UPS', '/.*/', '/^(Output Source|Battery Time Remaining|Battery Charge Remaining|UPS Load \\(%\\)|Output Load Estimated|Ups Input Voltage)$/')],
  transformations: [
    ...matrix,
    { id: 'calculateField', options: { mode: 'reduceRow', reduce: { reducer: 'max', include: ['UPS Load (%)', 'Output Load Estimated'] }, alias: 'Carga', replaceFields: false } },
    { id: 'organize', options: {
      excludeByName: { 'UPS Load (%)': true, 'Output Load Estimated': true },
      indexByName: { 'host\\item': 0, 'Output Source': 1, 'Battery Time Remaining': 2, 'Battery Charge Remaining': 3, Carga: 4, 'Ups Input Voltage': 5 },
      renameByName: { 'host\\item': 'UPS', 'Output Source': 'Estado', 'Battery Time Remaining': 'Autonomía', 'Battery Charge Remaining': 'Batería', 'Ups Input Voltage': 'Tensión' }
    } }
  ],
  fieldConfig: {
    defaults: { custom: { align: 'center', cellOptions: { type: 'auto' }, inspect: false }, noValue: '—' },
    overrides: [
      byName('UPS', [{ id: 'custom.align', value: 'left' }]),
      byName('Estado', [{ id: 'mappings', value: [{ type: 'value', options: {
        '1': { text: 'OTRO', color: C.nodata, index: 0 }, '2': { text: 'SIN SALIDA', color: C.dis, index: 1 }, '3': { text: 'RED OK', color: C.ok, index: 2 },
        '4': { text: 'BYPASS', color: C.avg, index: 3 }, '5': { text: 'EN BATERÍA', color: C.dis, index: 4 }, '6': { text: 'BOOST', color: C.warn, index: 5 }, '7': { text: 'REDUCER', color: C.warn, index: 6 } } }] },
        { id: 'color', value: { mode: 'thresholds' } }, { id: 'thresholds', value: steps([C.nodata, null]) }, cell('color-background', { mode: 'basic' })]),
      byName('Autonomía', [{ id: 'unit', value: 'm' }, { id: 'thresholds', value: steps([C.dis, null], [C.warn, 10], [C.ok, 20]) }, { id: 'color', value: { mode: 'thresholds' } }, cell('color-text')]),
      byName('Batería', [{ id: 'unit', value: 'percent' }, { id: 'thresholds', value: steps([C.dis, null], [C.warn, 50], [C.ok, 90]) }, { id: 'color', value: { mode: 'thresholds' } }, cell('color-text')]),
      byName('Carga', [{ id: 'unit', value: 'percent' }, { id: 'decimals', value: 0 }, { id: 'min', value: 0 }, { id: 'max', value: 100 }, { id: 'thresholds', value: steps([C.ok, null], [C.warn, 70], [C.dis, 85]) }, { id: 'color', value: { mode: 'thresholds' } }, cell('gauge', { mode: 'basic', valueDisplayMode: 'text' })]),
      byName('Tensión', [{ id: 'unit', value: 'volt' }, { id: 'decimals', value: 0 }, { id: 'thresholds', value: steps([C.dis, null], [C.warn, 190], [C.ok, 205], [C.warn, 245], [C.dis, 255]) }, { id: 'color', value: { mode: 'thresholds' } }, cell('color-text')])
    ]
  },
  options: { showHeader: true, cellHeight: 'md' }
}));

panels.push(panel({
  title: 'Servidores · CPU y memoria', description: 'Uso actual de CPU y memoria por servidor, ordenado por CPU (los más exigidos arriba).',
  type: 'table', gridPos: { x: 16, y: 14, w: 8, h: 8 },
  links: [{ title: 'Abrir detalle: Servidores', url: '/d/milicic-servers-overview' }],
  targets: [metric('A', SRV_GROUPS, '/.*/', '/^(CPU utilization|Memory utilization)$/')],
  transformations: [...matrix, { id: 'organize', options: { renameByName: { 'host\\item': 'Servidor', 'CPU utilization': 'CPU', 'Memory utilization': 'Memoria' }, indexByName: { 'host\\item': 0, 'CPU utilization': 1, 'Memory utilization': 2 } } }],
  fieldConfig: {
    defaults: { custom: { align: 'auto', cellOptions: { type: 'auto' }, inspect: false }, noValue: '—' },
    overrides: ['CPU', 'Memoria'].map(n => byName(n, [
      { id: 'unit', value: 'percent' }, { id: 'decimals', value: 0 }, { id: 'min', value: 0 }, { id: 'max', value: 100 },
      { id: 'thresholds', value: steps([C.ok, null], [C.warn, 75], [C.dis, 90]) }, { id: 'color', value: { mode: 'thresholds' } },
      cell('gauge', { mode: 'gradient', valueDisplayMode: 'text' })
    ]))
  },
  options: { showHeader: true, cellHeight: 'sm', sortBy: [{ displayName: 'CPU', desc: true }] }
}));

// ---- Fila 4: Qué está pasando y dónde ----
panels.push(panel({
  title: 'Problemas activos (Zabbix)', description: 'Problemas abiertos desde Warning, ordenados por severidad. Excluye hosts en mantenimiento.',
  type: 'alexanderzobnin-zabbix-triggers-panel', gridPos: { x: 0, y: 22, w: 16, h: 10 },
  targets: [problems([2, 3, 4, 5])],
  options: {
    schemaVersion: 8, layout: 'table',
    hostField: true, hostTechNameField: false, hostGroups: false, hostProxy: false, showTags: false,
    statusField: false, statusIcon: false, severityField: true, ackField: true, ageField: true,
    descriptionField: false, descriptionAtNewLine: false, hostsInMaintenance: false,
    showTriggers: 'all triggers', sortProblems: 'priority', limit: null, fontSize: '110%', pageSize: 10,
    problemTimeline: true, highlightBackground: false, highlightNewEvents: true, highlightNewerThan: '1h',
    customLastChangeFormat: false, lastChangeFormat: '', resizedColumns: [], markAckEvents: true,
    okEventColor: C.ok, ackEventColor: '#3B82F6',
    triggerSeverity: [
      { priority: 0, severity: 'Not classified', color: C.nodata, show: true },
      { priority: 1, severity: 'Information', color: C.info, show: true },
      { priority: 2, severity: 'Warning', color: C.warn, show: true },
      { priority: 3, severity: 'Average', color: C.avg, show: true },
      { priority: 4, severity: 'High', color: C.high, show: true },
      { priority: 5, severity: 'Disaster', color: C.dis, show: true }
    ]
  }
}));

const sevCols = [['Disaster', C.dis], ['High', C.high], ['Average', C.avg], ['Warning', C.warn]];
panels.push(panel({
  title: 'Problemas por grupo', description: 'Cantidad de problemas activos por grupo de hosts y severidad. Un host puede estar en varios grupos.',
  type: 'table', gridPos: { x: 16, y: 22, w: 8, h: 10 },
  targets: [{ refId: 'A', datasource: DS, schema: 12, queryType: '4', group: { filter: '/.*/' }, host: { filter: '/.*/' }, application: { filter: '' }, trigger: { filter: '' }, tags: { filter: '' }, showProblems: 'problems', options: { minSeverity: 2, acknowledged: 2, hostsInMaintenance: false } }],
  transformations: [
    { id: 'filterByValue', options: { type: 'exclude', match: 'all', filters: sevCols.map(([n]) => ({ fieldName: n, config: { id: 'equal', options: { value: 0 } } })) } },
    { id: 'organize', options: { excludeByName: { Information: true, 'Not classified': true }, renameByName: { 'Host group': 'Grupo' } } }
  ],
  fieldConfig: {
    defaults: { custom: { align: 'center', cellOptions: { type: 'auto' }, inspect: false } },
    overrides: [
      byName('Grupo', [{ id: 'custom.align', value: 'left' }]),
      ...sevCols.map(([n, color]) => byName(n, [{ id: 'color', value: { mode: 'thresholds' } }, { id: 'thresholds', value: steps(['transparent', null], [color, 1]) }, cell('color-background', { mode: 'basic' }), { id: 'custom.width', value: 72 }]))
    ]
  },
  options: { showHeader: true, cellHeight: 'sm', sortBy: [{ displayName: 'Disaster', desc: true }] }
}));

// ================= DASHBOARD =================
const dashboard = {
  id: null, uid: 'noc-zabbix-command-center', title: 'NOC - Zabbix Command Center',
  description: 'Centro de comando NOC: estado de todos los hosts Zabbix, calidad WAN, energía y problemas activos.',
  tags: ['noc', 'zabbix', 'milicic', 'command-center', 'v8'],
  timezone: 'browser', schemaVersion: 40, editable: true, graphTooltip: 0,
  refresh: '30s', time: { from: 'now-15m', to: 'now' },
  timepicker: { refresh_intervals: ['30s', '1m', '5m'] },
  links: [
    { title: 'Dashboards NOC', type: 'dashboards', tags: ['noc'], asDropdown: true, includeVars: false, keepTime: true, targetBlank: false, icon: 'external link' }
  ],
  templating: { list: [] },
  annotations: { list: [{ builtIn: 1, datasource: { type: 'grafana', uid: '-- Grafana --' }, enable: true, hide: true, iconColor: 'rgba(0, 211, 255, 1)', name: 'Annotations & Alerts', type: 'dashboard' }] },
  panels
};

function post(body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request(`${grafanaUrl}/api/dashboards/db`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'Content-Length': Buffer.byteLength(payload) }
    }, res => { let b = ''; res.on('data', d => b += d); res.on('end', () => { try { resolve(JSON.parse(b)); } catch { resolve({ raw: b }); } }); });
    req.on('error', reject); req.write(payload); req.end();
  });
}

const dryRun = process.argv.includes('--dry-run');
fs.mkdirSync('dashboards', { recursive: true });
fs.mkdirSync(path.join('.zabbix_context', 'dashboards'), { recursive: true });
fs.writeFileSync(path.join('dashboards', 'noc-zabbix-command-center.json'), JSON.stringify(dashboard, null, 2));
fs.writeFileSync(path.join('.zabbix_context', 'dashboards', 'noc-zabbix-command-center.json'), JSON.stringify(dashboard, null, 2));
console.log(`Paneles: ${panels.length}${dryRun ? ' (dry-run, no se desplegó)' : ''}`);
if (!dryRun) {
  const res = await post({ dashboard, folderUid: 'milicic-noc', overwrite: true, message: 'NOC V8: mosaicos deduplicados, KPIs por problemas reales, calidad WAN, energía UPS' });
  console.log(res.status === 'success' ? `OK · version ${res.version} · ${grafanaUrl}${res.url}` : res);
}
