import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read original backup
const backupPath = path.resolve(__dirname, '../.zabbix_context/dashboards/dashboard_411_backup.json');
const originalDashboard = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

// Verified DC Definitions
const DCS = [
  {
    id: '10699',
    name: 'SRO-DCO01',
    label: 'DC01: SRO-DCO01 (Rosario - Primario / FSMO)',
    shortLabel: 'SRO-DCO01',
    role: 'Rosario · Primario PDC / FSMO',
    items: {
      pingRtt: '51481',
      ping: '51479',
      uptime: '75408',
      cpu: '75400',
      ram: '75412',
      ramUsed: '75411',
      ramTotal: '75413',
      diskCPercent: '75525',
      diskCUsed: '75523',
      diskCTotal: '75524',
      agentPing: '75415',
      netIn: '75446',
      netOut: '75449'
    }
  },
  {
    id: '10701',
    name: 'SRO-DCO02',
    label: 'DC02: SRO-DCO02 (Rosario - Secundario)',
    shortLabel: 'SRO-DCO02',
    role: 'Rosario · Secundario / Réplica AD DS',
    items: {
      pingRtt: '51487',
      ping: '51485',
      uptime: '75554',
      cpu: '75546',
      ram: '75558',
      ramUsed: '75557',
      ramTotal: '75559',
      diskCPercent: '75663',
      diskCUsed: '75661',
      diskCTotal: '75662',
      agentPing: '75561',
      netIn: '75667',
      netOut: '75670'
    }
  },
  {
    id: '10715',
    name: 'SSJ-DCO01',
    label: 'DC03: SSJ-DCO01 (San Juan - Sucursal)',
    shortLabel: 'SSJ-DCO01',
    role: 'San Juan · Sucursal / Réplica AD DS & DNS',
    items: {
      pingRtt: '51529',
      ping: '51527',
      uptime: '76476',
      cpu: '76468',
      ram: '76480',
      ramUsed: '76479',
      ramTotal: '76481',
      diskCPercent: '76515',
      diskCUsed: '76513',
      diskCTotal: '76514',
      agentPing: '76483',
      netIn: '76519',
      netOut: '76522'
    }
  }
];

// Helper to create single KPI item widget
function createKpiWidget(name, itemid, x, y, width, height, color = '10B981', decimals = 0, unitsShow = 1) {
  return {
    type: 'item',
    name: name,
    x: String(x),
    y: String(y),
    width: String(width),
    height: String(height),
    view_mode: '0',
    fields: [
      { type: '4', name: 'itemid.0', value: String(itemid) },
      { type: '0', name: 'show.0', value: '2' },
      { type: '0', name: 'decimal_places', value: String(decimals) },
      { type: '0', name: 'units_show', value: String(unitsShow) },
      { type: '0', name: 'value_size', value: '42' },
      { type: '1', name: 'value_color', value: color },
      { type: '0', name: 'rf_rate', value: '60' }
    ]
  };
}

// -------------------------------------------------------------
// PAGE 1: CYBER SOC & AUDITORÍA DE IDENTIDADES (Preserved & Enhanced)
// -------------------------------------------------------------
const page1 = JSON.parse(JSON.stringify(originalDashboard.pages[0]));
page1.name = 'Seguridad & Auditoría de Identidades (Cyber SOC)';
// Add SSJ-DCO01 to hostnavigator
const navWidget = page1.widgets.find(w => w.type === 'hostnavigator');
if (navWidget) {
  // Ensure all 3 hosts are in navigator
  const existingHosts = navWidget.fields.filter(f => f.name.startsWith('hosts.'));
  if (!existingHosts.some(f => f.value === 'SSJ-DCO01')) {
    navWidget.fields.push({
      type: '1',
      name: `hosts.${existingHosts.length}`,
      value: 'SSJ-DCO01'
    });
  }
}

// -------------------------------------------------------------
// PAGE 2: SALUD DEL BOSQUE & MATRIZ MULTI-DC
// -------------------------------------------------------------
const page2Widgets = [];

// 6 Core AD Services across ALL 3 DCs (12 cols each -> 72 total)
const adServices = [
  { name: 'Servicio NTDS (AD DS)', item: 'State of service "NTDS" (Active Directory Domain Services)' },
  { name: 'Servicio DNS Server', item: 'State of service "DNS" (DNS Server)' },
  { name: 'Servicio Kerberos (KDC)', item: 'State of service "Kdc" (Kerberos Key Distribution Center)' },
  { name: 'Servicio Netlogon', item: 'State of service "Netlogon" (Netlogon)' },
  { name: 'Servicio DFSR (SYSVOL)', item: 'State of service "DFSR" (DFS Replication)' },
  { name: 'Servicio W32Time (Hora)', item: 'State of service "W32Time" (Windows Time)' }
];

adServices.forEach((srv, idx) => {
  page2Widgets.push({
    type: 'tophosts',
    name: srv.name,
    x: String(idx * 12),
    y: '0',
    width: '12',
    height: '5',
    view_mode: '0',
    fields: [
      { type: '3', name: 'hostids.0', value: '10699' },
      { type: '3', name: 'hostids.1', value: '10701' },
      { type: '3', name: 'hostids.2', value: '10715' },
      { type: '1', name: 'columns.0.name', value: 'Controlador' },
      { type: '0', name: 'columns.0.data', value: '2' },
      { type: '1', name: 'columns.0.base_color', value: 'FFFFFF' },
      { type: '1', name: 'columns.1.name', value: 'Estado' },
      { type: '0', name: 'columns.1.data', value: '1' },
      { type: '1', name: 'columns.1.item', value: srv.item },
      { type: '1', name: 'columns.1.base_color', value: '10B981' },
      { type: '0', name: 'columns.1.display', value: '1' },
      { type: '1', name: 'columnsthresholds.1.color.0', value: '10B981' },
      { type: '1', name: 'columnsthresholds.1.threshold.0', value: '0' },
      { type: '1', name: 'columnsthresholds.1.color.1', value: 'E53935' },
      { type: '1', name: 'columnsthresholds.1.threshold.1', value: '1' },
      { type: '0', name: 'show_lines', value: '3' },
      { type: '0', name: 'rf_rate', value: '60' }
    ]
  });
});

// Row 2 (y: 5, h: 6): Multi-DC Performance Comparisons
// CPU Comparison (w: 36, x: 0)
page2Widgets.push({
  type: 'svggraph',
  name: 'Uso de CPU Comparado (DCO01 vs DCO02 vs SSJ-DCO01)',
  x: '0',
  y: '5',
  width: '36',
  height: '6',
  view_mode: '0',
  fields: [
    { type: '1', name: 'reference', value: 'CPUCMP' },
    { type: '0', name: 'show_problems', value: '1' },
    { type: '0', name: 'legend', value: '1' },
    { type: '0', name: 'righty', value: '0' },
    { type: '1', name: 'lefty_min', value: '0' },
    { type: '1', name: 'lefty_max', value: '100' },
    { type: '1', name: 'time_period.from', value: 'now-24h' },
    { type: '1', name: 'time_period.to', value: 'now' },
    // DCO01
    { type: '1', name: 'ds.0.hosts.0', value: 'SRO-DCO01' },
    { type: '1', name: 'ds.0.items.0', value: 'CPU utilization' },
    { type: '1', name: 'ds.0.color', value: 'EF4444' },
    { type: '0', name: 'ds.0.width', value: '2' },
    { type: '0', name: 'ds.0.transparency', value: '2' },
    { type: '0', name: 'ds.0.fill', value: '0' },
    // DCO02
    { type: '1', name: 'ds.1.hosts.0', value: 'SRO-DCO02' },
    { type: '1', name: 'ds.1.items.0', value: 'CPU utilization' },
    { type: '1', name: 'ds.1.color', value: 'F59E0B' },
    { type: '0', name: 'ds.1.width', value: '2' },
    { type: '0', name: 'ds.1.transparency', value: '2' },
    { type: '0', name: 'ds.1.fill', value: '0' },
    // SSJ-DCO01
    { type: '1', name: 'ds.2.hosts.0', value: 'SSJ-DCO01' },
    { type: '1', name: 'ds.2.items.0', value: 'CPU utilization' },
    { type: '1', name: 'ds.2.color', value: '3B82F6' },
    { type: '0', name: 'ds.2.width', value: '2' },
    { type: '0', name: 'ds.2.transparency', value: '2' },
    { type: '0', name: 'ds.2.fill', value: '0' }
  ]
});

// RAM Comparison (w: 36, x: 36)
page2Widgets.push({
  type: 'svggraph',
  name: 'Uso de Memoria RAM Comparado (DCO01 vs DCO02 vs SSJ-DCO01)',
  x: '36',
  y: '5',
  width: '36',
  height: '6',
  view_mode: '0',
  fields: [
    { type: '1', name: 'reference', value: 'RAMCMP' },
    { type: '0', name: 'show_problems', value: '1' },
    { type: '0', name: 'legend', value: '1' },
    { type: '0', name: 'righty', value: '0' },
    { type: '1', name: 'lefty_min', value: '0' },
    { type: '1', name: 'lefty_max', value: '100' },
    { type: '1', name: 'time_period.from', value: 'now-24h' },
    { type: '1', name: 'time_period.to', value: 'now' },
    // DCO01
    { type: '1', name: 'ds.0.hosts.0', value: 'SRO-DCO01' },
    { type: '1', name: 'ds.0.items.0', value: 'Memory utilization' },
    { type: '1', name: 'ds.0.color', value: '10B981' },
    { type: '0', name: 'ds.0.width', value: '2' },
    { type: '0', name: 'ds.0.transparency', value: '2' },
    { type: '0', name: 'ds.0.fill', value: '0' },
    // DCO02
    { type: '1', name: 'ds.1.hosts.0', value: 'SRO-DCO02' },
    { type: '1', name: 'ds.1.items.0', value: 'Memory utilization' },
    { type: '1', name: 'ds.1.color', value: '06B6D4' },
    { type: '0', name: 'ds.1.width', value: '2' },
    { type: '0', name: 'ds.1.transparency', value: '2' },
    { type: '0', name: 'ds.1.fill', value: '0' },
    // SSJ-DCO01
    { type: '1', name: 'ds.2.hosts.0', value: 'SSJ-DCO01' },
    { type: '1', name: 'ds.2.items.0', value: 'Memory utilization' },
    { type: '1', name: 'ds.2.color', value: '8B5CF6' },
    { type: '0', name: 'ds.2.width', value: '2' },
    { type: '0', name: 'ds.2.transparency', value: '2' },
    { type: '0', name: 'ds.2.fill', value: '0' }
  ]
});

// Row 3 (y: 11, h: 6): NTP Offset & Active Incidents across AD
page2Widgets.push({
  type: 'svggraph',
  name: 'Sincronización Horaria y Desvío NTP (DCO01 vs DCO02)',
  x: '0',
  y: '11',
  width: '36',
  height: '6',
  view_mode: '0',
  fields: [
    { type: '1', name: 'reference', value: 'NTPSV' },
    { type: '0', name: 'show_problems', value: '1' },
    { type: '0', name: 'legend', value: '1' },
    { type: '0', name: 'righty', value: '0' },
    { type: '1', name: 'time_period.from', value: 'now-24h' },
    { type: '1', name: 'time_period.to', value: 'now' },
    { type: '1', name: 'ds.0.hosts.0', value: 'SRO-DCO01' },
    { type: '1', name: 'ds.0.items.0', value: 'Desvío de Sincronización Horaria NTP (DCO01 vs DCO02)' },
    { type: '1', name: 'ds.0.color', value: '00BFFF' },
    { type: '0', name: 'ds.0.width', value: '2' },
    { type: '0', name: 'ds.0.transparency', value: '2' },
    { type: '0', name: 'ds.0.fill', value: '1' }
  ]
});

page2Widgets.push({
  type: 'problems',
  name: 'Alertas e Incidentes Activos en Bosque Active Directory',
  x: '36',
  y: '11',
  width: '36',
  height: '6',
  view_mode: '0',
  fields: [
    { type: '0', name: 'rf_rate', value: '60' },
    { type: '1', name: 'reference', value: 'ADPRB' },
    { type: '2', name: 'groupids.0', value: '29' }, // Hostgroup 29: AD
    { type: '0', name: 'show', value: '3' },
    { type: '0', name: 'sort_triggers', value: '1' },
    { type: '0', name: 'show_timeline', value: '0' },
    { type: '0', name: 'show_lines', value: '10' },
    { type: '0', name: 'show_tags', value: '1' },
    { type: '0', name: 'show_opdata', value: '2' },
    { type: '0', name: 'show_suppressed', value: '1' },
    { type: '0', name: 'highlight_row', value: '1' }
  ]
});

const page2 = {
  name: 'Salud del Bosque & Matriz Multi-DC',
  display_period: '30',
  widgets: page2Widgets
};

// -------------------------------------------------------------
// DEDICATED PAGES: DC01, DC02, DC03
// -------------------------------------------------------------
function buildDedicatedDcPage(dc, refPrefix) {
  const widgets = [];

  // ROW 1 (y: 0, h: 4): 6 KPI Cards (12 cols each)
  widgets.push(createKpiWidget('Latencia Ping ICMP', dc.items.pingRtt, 0, 0, 12, 4, '10B981', 3, 1));
  widgets.push(createKpiWidget('Agente Zabbix', dc.items.agentPing, 12, 0, 12, 4, '10B981', 0, 0));
  widgets.push(createKpiWidget('Uptime Servidor', dc.items.uptime, 24, 0, 12, 4, '3B82F6', 0, 1));
  widgets.push(createKpiWidget('Carga CPU Actual', dc.items.cpu, 36, 0, 12, 4, 'F59E0B', 1, 1));
  widgets.push(createKpiWidget('Memoria RAM Usada', dc.items.ram, 48, 0, 12, 4, '6366F1', 1, 1));
  widgets.push(createKpiWidget('Espacio Disco C:', dc.items.diskCPercent, 60, 0, 12, 4, 'EC4899', 1, 1));

  // ROW 2 (y: 4, h: 6): 3 Performance Graphs (24 cols each)
  // Graph 1: CPU & RAM Trends
  widgets.push({
    type: 'svggraph',
    name: 'Carga de Cómputo (CPU y Memoria RAM)',
    x: '0',
    y: '4',
    width: '24',
    height: '6',
    view_mode: '0',
    fields: [
      { type: '1', name: 'reference', value: `${refPrefix}CPURAM` },
      { type: '0', name: 'show_problems', value: '1' },
      { type: '0', name: 'legend', value: '1' },
      { type: '0', name: 'righty', value: '0' },
      { type: '1', name: 'lefty_min', value: '0' },
      { type: '1', name: 'lefty_max', value: '100' },
      { type: '1', name: 'time_period.from', value: 'now-24h' },
      { type: '1', name: 'time_period.to', value: 'now' },
      { type: '1', name: 'ds.0.hosts.0', value: dc.name },
      { type: '1', name: 'ds.0.items.0', value: 'CPU utilization' },
      { type: '1', name: 'ds.0.color', value: 'EF4444' },
      { type: '0', name: 'ds.0.width', value: '2' },
      { type: '0', name: 'ds.0.transparency', value: '2' },
      { type: '0', name: 'ds.0.fill', value: '0' },
      { type: '1', name: 'ds.1.hosts.0', value: dc.name },
      { type: '1', name: 'ds.1.items.0', value: 'Memory utilization' },
      { type: '1', name: 'ds.1.color', value: '10B981' },
      { type: '0', name: 'ds.1.width', value: '2' },
      { type: '0', name: 'ds.1.transparency', value: '2' },
      { type: '0', name: 'ds.1.fill', value: '0' }
    ]
  });

  // Graph 2: Network Traffic
  widgets.push({
    type: 'svggraph',
    name: 'Tráfico de Red Primaria (In / Out bps)',
    x: '24',
    y: '4',
    width: '24',
    height: '6',
    view_mode: '0',
    fields: [
      { type: '1', name: 'reference', value: `${refPrefix}NET` },
      { type: '0', name: 'show_problems', value: '1' },
      { type: '0', name: 'legend', value: '1' },
      { type: '0', name: 'righty', value: '0' },
      { type: '1', name: 'time_period.from', value: 'now-24h' },
      { type: '1', name: 'time_period.to', value: 'now' },
      { type: '1', name: 'ds.0.hosts.0', value: dc.name },
      { type: '1', name: 'ds.0.items.0', value: 'Bits received' },
      { type: '1', name: 'ds.0.color', value: '10B981' },
      { type: '0', name: 'ds.0.width', value: '2' },
      { type: '0', name: 'ds.0.transparency', value: '2' },
      { type: '0', name: 'ds.0.fill', value: '1' },
      { type: '1', name: 'ds.1.hosts.0', value: dc.name },
      { type: '1', name: 'ds.1.items.0', value: 'Bits sent' },
      { type: '1', name: 'ds.1.color', value: '06B6D4' },
      { type: '0', name: 'ds.1.width', value: '2' },
      { type: '0', name: 'ds.1.transparency', value: '2' },
      { type: '0', name: 'ds.1.fill', value: '1' }
    ]
  });

  // Graph 3: Storage C: (Used vs Total)
  widgets.push({
    type: 'svggraph',
    name: 'Almacenamiento Volumen C: (Usado vs Total)',
    x: '48',
    y: '4',
    width: '24',
    height: '6',
    view_mode: '0',
    fields: [
      { type: '1', name: 'reference', value: `${refPrefix}DSK` },
      { type: '0', name: 'show_problems', value: '1' },
      { type: '0', name: 'legend', value: '1' },
      { type: '0', name: 'righty', value: '0' },
      { type: '1', name: 'time_period.from', value: 'now-24h' },
      { type: '1', name: 'time_period.to', value: 'now' },
      { type: '1', name: 'ds.0.hosts.0', value: dc.name },
      { type: '1', name: 'ds.0.items.0', value: 'FS [(C:)]: Space: Used' },
      { type: '1', name: 'ds.0.color', value: 'F43F5E' },
      { type: '0', name: 'ds.0.width', value: '2' },
      { type: '0', name: 'ds.0.transparency', value: '2' },
      { type: '0', name: 'ds.0.fill', value: '1' },
      { type: '1', name: 'ds.1.hosts.0', value: dc.name },
      { type: '1', name: 'ds.1.items.0', value: 'FS [(C:)]: Space: Total' },
      { type: '1', name: 'ds.1.color', value: '64748B' },
      { type: '0', name: 'ds.1.width', value: '1' },
      { type: '0', name: 'ds.1.transparency', value: '1' },
      { type: '0', name: 'ds.1.fill', value: '0' }
    ]
  });

  // ROW 3 (y: 10, h: 6): Services Table & Host Problems
  // Multi-column service status table
  widgets.push({
    type: 'tophosts',
    name: `Estado de Servicios de Directorio Activo (${dc.shortLabel})`,
    x: '0',
    y: '10',
    width: '44',
    height: '6',
    view_mode: '0',
    fields: [
      { type: '0', name: 'rf_rate', value: '60' },
      { type: '1', name: 'reference', value: `${refPrefix}SRV` },
      { type: '3', name: 'hostids.0', value: dc.id },
      { type: '0', name: 'show_lines', value: '1' },
      // Col 0: Host
      { type: '1', name: 'columns.0.name', value: 'Controlador' },
      { type: '0', name: 'columns.0.data', value: '2' },
      { type: '1', name: 'columns.0.base_color', value: 'FFFFFF' },
      // Col 1: NTDS
      { type: '1', name: 'columns.1.name', value: 'NTDS' },
      { type: '0', name: 'columns.1.data', value: '1' },
      { type: '1', name: 'columns.1.item', value: 'State of service "NTDS" (Active Directory Domain Services)' },
      { type: '1', name: 'columns.1.base_color', value: '10B981' },
      { type: '0', name: 'columns.1.display', value: '1' },
      { type: '1', name: 'columnsthresholds.1.color.0', value: '10B981' },
      { type: '1', name: 'columnsthresholds.1.threshold.0', value: '0' },
      { type: '1', name: 'columnsthresholds.1.color.1', value: 'E53935' },
      { type: '1', name: 'columnsthresholds.1.threshold.1', value: '1' },
      // Col 2: DNS
      { type: '1', name: 'columns.2.name', value: 'DNS' },
      { type: '0', name: 'columns.2.data', value: '1' },
      { type: '1', name: 'columns.2.item', value: 'State of service "DNS" (DNS Server)' },
      { type: '1', name: 'columns.2.base_color', value: '10B981' },
      { type: '0', name: 'columns.2.display', value: '1' },
      { type: '1', name: 'columnsthresholds.2.color.0', value: '10B981' },
      { type: '1', name: 'columnsthresholds.2.threshold.0', value: '0' },
      { type: '1', name: 'columnsthresholds.2.color.1', value: 'E53935' },
      { type: '1', name: 'columnsthresholds.2.threshold.1', value: '1' },
      // Col 3: KDC
      { type: '1', name: 'columns.3.name', value: 'KDC' },
      { type: '0', name: 'columns.3.data', value: '1' },
      { type: '1', name: 'columns.3.item', value: 'State of service "Kdc" (Kerberos Key Distribution Center)' },
      { type: '1', name: 'columns.3.base_color', value: '10B981' },
      { type: '0', name: 'columns.3.display', value: '1' },
      { type: '1', name: 'columnsthresholds.3.color.0', value: '10B981' },
      { type: '1', name: 'columnsthresholds.3.threshold.0', value: '0' },
      { type: '1', name: 'columnsthresholds.3.color.1', value: 'E53935' },
      { type: '1', name: 'columnsthresholds.3.threshold.1', value: '1' },
      // Col 4: Netlogon
      { type: '1', name: 'columns.4.name', value: 'Netlogon' },
      { type: '0', name: 'columns.4.data', value: '1' },
      { type: '1', name: 'columns.4.item', value: 'State of service "Netlogon" (Netlogon)' },
      { type: '1', name: 'columns.4.base_color', value: '10B981' },
      { type: '0', name: 'columns.4.display', value: '1' },
      { type: '1', name: 'columnsthresholds.4.color.0', value: '10B981' },
      { type: '1', name: 'columnsthresholds.4.threshold.0', value: '0' },
      { type: '1', name: 'columnsthresholds.4.color.1', value: 'E53935' },
      { type: '1', name: 'columnsthresholds.4.threshold.1', value: '1' },
      // Col 5: DFSR
      { type: '1', name: 'columns.5.name', value: 'DFSR' },
      { type: '0', name: 'columns.5.data', value: '1' },
      { type: '1', name: 'columns.5.item', value: 'State of service "DFSR" (DFS Replication)' },
      { type: '1', name: 'columns.5.base_color', value: '10B981' },
      { type: '0', name: 'columns.5.display', value: '1' },
      { type: '1', name: 'columnsthresholds.5.color.0', value: '10B981' },
      { type: '1', name: 'columnsthresholds.5.threshold.0', value: '0' },
      { type: '1', name: 'columnsthresholds.5.color.1', value: 'E53935' },
      { type: '1', name: 'columnsthresholds.5.threshold.1', value: '1' },
      // Col 6: W32Time
      { type: '1', name: 'columns.6.name', value: 'W32Time' },
      { type: '0', name: 'columns.6.data', value: '1' },
      { type: '1', name: 'columns.6.item', value: 'State of service "W32Time" (Windows Time)' },
      { type: '1', name: 'columns.6.base_color', value: '10B981' },
      { type: '0', name: 'columns.6.display', value: '1' },
      { type: '1', name: 'columnsthresholds.6.color.0', value: '10B981' },
      { type: '1', name: 'columnsthresholds.6.threshold.0', value: '0' },
      { type: '1', name: 'columnsthresholds.6.color.1', value: 'E53935' },
      { type: '1', name: 'columnsthresholds.6.threshold.1', value: '1' },
      // Col 7: ADWS
      { type: '1', name: 'columns.7.name', value: 'ADWS' },
      { type: '0', name: 'columns.7.data', value: '1' },
      { type: '1', name: 'columns.7.item', value: 'State of service "ADWS" (Active Directory Web Services)' },
      { type: '1', name: 'columns.7.base_color', value: '10B981' },
      { type: '0', name: 'columns.7.display', value: '1' },
      { type: '1', name: 'columnsthresholds.7.color.0', value: '10B981' },
      { type: '1', name: 'columnsthresholds.7.threshold.0', value: '0' },
      { type: '1', name: 'columnsthresholds.7.color.1', value: 'E53935' },
      { type: '1', name: 'columnsthresholds.7.threshold.1', value: '1' }
    ]
  });

  // Host Problems Widget
  widgets.push({
    type: 'problems',
    name: `Alertas e Incidentes Activos en ${dc.shortLabel}`,
    x: '44',
    y: '10',
    width: '28',
    height: '6',
    view_mode: '0',
    fields: [
      { type: '0', name: 'rf_rate', value: '60' },
      { type: '1', name: 'reference', value: `${refPrefix}PRB` },
      { type: '3', name: 'hostids.0', value: dc.id },
      { type: '0', name: 'show', value: '3' },
      { type: '0', name: 'sort_triggers', value: '1' },
      { type: '0', name: 'show_timeline', value: '0' },
      { type: '0', name: 'show_lines', value: '10' },
      { type: '0', name: 'show_tags', value: '1' },
      { type: '0', name: 'show_opdata', value: '2' },
      { type: '0', name: 'show_suppressed', value: '1' },
      { type: '0', name: 'highlight_row', value: '1' }
    ]
  });

  return {
    name: dc.label,
    display_period: '30',
    widgets: widgets
  };
}

const page3 = buildDedicatedDcPage(DCS[0], 'D1');
const page4 = buildDedicatedDcPage(DCS[1], 'D2');
const page5 = buildDedicatedDcPage(DCS[2], 'D3');

// Build final Dashboard Object
const finalDashboard = {
  dashboardid: '411',
  name: 'Security Logs 2 - Active Directory Cyber SOC & Controladores de Dominio',
  display_period: '30',
  auto_start: '1',
  pages: [
    page1,
    page2,
    page3,
    page4,
    page5
  ]
};

// Save generated dashboard to .zabbix_context
const outputPath = path.resolve(__dirname, '../.zabbix_context/dashboards/dashboard_411_updated.json');
fs.writeFileSync(outputPath, JSON.stringify(finalDashboard, null, 2), 'utf8');
console.log(`Generated dashboard JSON saved to ${outputPath}`);
console.log(`Total Pages: ${finalDashboard.pages.length}`);
let overlaps = 0;
finalDashboard.pages.forEach((p, pIdx) => {
  console.log(`  Page ${pIdx + 1}: "${p.name}" (${p.widgets.length} widgets)`);
  const ws = p.widgets;
  for (let i = 0; i < ws.length; i++) {
    for (let j = i + 1; j < ws.length; j++) {
      const a = ws[i];
      const b = ws[j];
      const ax1 = parseInt(a.x), ay1 = parseInt(a.y), ax2 = ax1 + parseInt(a.width), ay2 = ay1 + parseInt(a.height);
      const bx1 = parseInt(b.x), by1 = parseInt(b.y), bx2 = bx1 + parseInt(b.width), by2 = by1 + parseInt(b.height);
      const xOverlap = Math.max(0, Math.min(ax2, bx2) - Math.max(ax1, bx1));
      const yOverlap = Math.max(0, Math.min(ay2, by2) - Math.max(ay1, by1));
      if (xOverlap > 0 && yOverlap > 0) {
        console.error(`    [OVERLAP] "${a.name}" and "${b.name}" overlap in Page ${pIdx + 1}!`);
        overlaps++;
      }
    }
  }
});
if (overlaps === 0) {
  console.log('Grid check: PERFECT! 0 overlapping widgets across all 5 pages.');
} else {
  console.error(`Grid check: ${overlaps} overlaps detected!`);
}
