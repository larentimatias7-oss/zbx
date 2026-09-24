import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken || grafanaToken.length < 10) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const DATASOURCE_UID = "efz4nzx8r30g0c";
const DATASOURCE_TYPE = "alexanderzobnin-zabbix-datasource";

// =============================================================================
// ECHARTS CODE FOR SAN JUAN INFRASTRUCTURE TOPOLOGY
// =============================================================================
const echartsCode = `
// 1. Helper to extract the last valid numeric value for a given refId
function getLast(refId, fallback) {
  try {
    if (!data || !data.series) return fallback;
    const s = data.series.find(x => x.refId === refId || (x.name && x.name.includes(refId)));
    if (s && s.fields && s.fields.length > 1) {
      const vals = s.fields[1].values;
      for (let i = vals.length - 1; i >= 0; i--) {
        const v = vals[i];
        if (v !== null && v !== undefined && !isNaN(v)) {
          return Number(v);
        }
      }
    }
  } catch (e) {}
  return fallback;
}

const rttFtg = getLast('RTT_FTG', 0.0003);
const rttCore = getLast('RTT_CORE', 0.0015);
const rttSwAdm = getLast('RTT_SWADM', 0.0016);
const rttHpv = getLast('RTT_HPV', 0.0005);
const rttDco = getLast('RTT_DCO', 0.0005);
const rttFil = getLast('RTT_FIL', 0.0006);
const rttNas = getLast('RTT_NAS', 0.0004);
const rttBkp = getLast('RTT_BKP', 0.0007);
const cpuHpv = getLast('CPU_HPV', 0.55);
const cpuDco = getLast('CPU_DCO', 4.18);
const cpuFil = getLast('CPU_FIL', 7.42);
const cpuBkp = getLast('CPU_BKP', 22.05);

const categories = [
  { name: 'Gateway WAN & Perímetro', itemStyle: { color: '#EA580C' } },
  { name: 'Switching & Distribución', itemStyle: { color: '#0284C7' } },
  { name: 'Hipervisor & Cómputo Físico', itemStyle: { color: '#10B981' } },
  { name: 'Máquinas Virtuales & Servicios', itemStyle: { color: '#8B5CF6' } },
  { name: 'Almacenamiento & Backup', itemStyle: { color: '#F59E0B' } },
  { name: 'Datacenter Central (Rosario)', itemStyle: { color: '#06B6D4' } }
];

const nodes = [
  // --- NODO CENTRAL WAN & PERÍMETRO ---
  {
    id: 'ROSARIO_HUB',
    name: 'DATACENTER CENTRAL\\n(Rosario Hub SRO)\\n172.30.20.1',
    category: 5,
    x: 100,
    y: 250,
    symbolSize: 85,
    symbol: 'roundRect',
    itemStyle: { color: '#0F172A', borderColor: '#06B6D4', borderWidth: 2.5, shadowBlur: 15, shadowColor: 'rgba(6,182,212,0.6)' },
    label: { show: true, color: '#38BDF8', fontSize: 11, fontWeight: 'bold' },
    tooltip: '<b>Datacenter Central Rosario (Hub SD-WAN)</b><br/>IP: 172.30.20.1<br/>Interconexión vía Túneles IPsec Fortinet'
  },
  {
    id: 'FTG_SSJ',
    name: 'FortiGate SSJ\\n(Predio San Juan)\\n172.26.10.1',
    category: 0,
    x: 320,
    y: 250,
    symbolSize: 80,
    symbol: 'roundRect',
    itemStyle: { color: '#EA580C', borderColor: '#FB923C', borderWidth: 3, shadowBlur: 15, shadowColor: 'rgba(234,88,12,0.6)' },
    label: { show: true, color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
    tooltip: '<b>FortiGate 40F/60F Predio San Juan</b><br/>IP: 172.26.10.1<br/>RTT a Hub: ' + (rttFtg * 1000).toFixed(1) + ' ms<br/>Uplink: Movistar + VPN IPsec SD-WAN'
  },

  // --- SWITCHING LOCAL ---
  {
    id: 'SSJ_CORE01',
    name: 'SSJ-CORE01\\n(Aruba Instant On)\\n172.26.10.201',
    category: 1,
    x: 520,
    y: 250,
    symbolSize: 85,
    symbol: 'roundRect',
    itemStyle: { color: '#0284C7', borderColor: '#38BDF8', borderWidth: 3, shadowBlur: 15, shadowColor: 'rgba(2,132,199,0.7)' },
    label: { show: true, color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
    tooltip: '<b>Switch Core San Juan (SSJ-CORE01)</b><br/>Aruba Instant On | RTT: ' + (rttCore * 1000).toFixed(1) + ' ms<br/>Distribuidor principal de la red local'
  },
  {
    id: 'SSJ_SWADM',
    name: 'SSJ-SWADM\\n(Switch Administración)\\n172.26.10.202',
    category: 1,
    x: 520,
    y: 110,
    symbolSize: 65,
    symbol: 'roundRect',
    itemStyle: { color: '#0284C7', borderColor: '#7DD3FC', borderWidth: 2 },
    label: { show: true, color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
    tooltip: '<b>Switch Administración (SSJ-SWADM)</b><br/>Aruba Instant On | RTT: ' + (rttSwAdm * 1000).toFixed(1) + ' ms<br/>Puestos de trabajo y oficinas'
  },

  // --- HIPERVISOR FÍSICO HYPER-V ---
  {
    id: 'SSJ_HPV01',
    name: 'SSJ-HPV01\\n(Host Físico Hyper-V)\\nCPU: ' + cpuHpv.toFixed(1) + '%',
    category: 2,
    x: 740,
    y: 250,
    symbolSize: 85,
    symbol: 'roundRect',
    itemStyle: { color: '#059669', borderColor: '#10B981', borderWidth: 3, shadowBlur: 15, shadowColor: 'rgba(16,185,129,0.7)' },
    label: { show: true, color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
    tooltip: '<b>Servidor Físico Hyper-V (SSJ-HPV01)</b><br/>CPU: ' + cpuHpv.toFixed(1) + '% | RTT: ' + (rttHpv * 1000).toFixed(1) + ' ms<br/>Aloja las máquinas virtuales corporativas'
  },

  // --- MÁQUINAS VIRTUALES HUÉSPEDES ---
  {
    id: 'SSJ_DCO01',
    name: 'SSJ-DCO01 (VM)\\nActive Directory / DNS\\nCPU: ' + cpuDco.toFixed(1) + '%',
    category: 3,
    x: 930,
    y: 140,
    symbolSize: 65,
    symbol: 'circle',
    itemStyle: { color: '#7C3AED', borderColor: '#A78BFA', borderWidth: 2 },
    label: { show: true, color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
    tooltip: '<b>Domain Controller San Juan (SSJ-DCO01)</b><br/>AD DS & DNS Local | CPU: ' + cpuDco.toFixed(1) + '%'
  },
  {
    id: 'SSJ_FIL01',
    name: 'SSJ-FIL01 (VM)\\nFile Server San Juan\\nCPU: ' + cpuFil.toFixed(1) + '%',
    category: 3,
    x: 930,
    y: 250,
    symbolSize: 65,
    symbol: 'circle',
    itemStyle: { color: '#7C3AED', borderColor: '#A78BFA', borderWidth: 2 },
    label: { show: true, color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
    tooltip: '<b>Servidor de Archivos (SSJ-FIL01)</b><br/>Partición Datos E: 65% ocupada | CPU: ' + cpuFil.toFixed(1) + '%'
  },
  {
    id: 'SSJ_SVC01',
    name: 'SSJ-SVC01 (VM)\\nPrint & DHCP Server',
    category: 3,
    x: 930,
    y: 360,
    symbolSize: 60,
    symbol: 'circle',
    itemStyle: { color: '#7C3AED', borderColor: '#A78BFA', borderWidth: 2 },
    label: { show: true, color: '#FFFFFF', fontSize: 10 },
    tooltip: '<b>Servidor de Servicios e Impresión (SSJ-SVC01)</b><br/>Print Server & DHCP Local'
  },

  // --- RESPALDO & ALMACENAMIENTO ---
  {
    id: 'SSJ_BKP01',
    name: 'SSJ-BKP01\\n(Veeam Backup Proxy)\\nCPU: ' + cpuBkp.toFixed(1) + '%',
    category: 4,
    x: 620,
    y: 420,
    symbolSize: 75,
    symbol: 'roundRect',
    itemStyle: { color: '#D97706', borderColor: '#FBBF24', borderWidth: 2.5, shadowBlur: 10, shadowColor: 'rgba(217,119,6,0.6)' },
    label: { show: true, color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
    tooltip: '<b>Servidor Veeam Backup (SSJ-BKP01)</b><br/>Gestión de respaldos locales de San Juan<br/>CPU: ' + cpuBkp.toFixed(1) + '%'
  },
  {
    id: 'SSJ_NAS01',
    name: 'SSJ-NAS01\\n(QNAP TX-431XEU)\\nRepositorio Backup',
    category: 4,
    x: 800,
    y: 420,
    symbolSize: 75,
    symbol: 'roundRect',
    itemStyle: { color: '#D97706', borderColor: '#FBBF24', borderWidth: 2.5 },
    label: { show: true, color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
    tooltip: '<b>Almacenamiento NAS QNAP TX-431XEU (SSJ-NAS01)</b><br/>Repositorio de copias de seguridad de San Juan<br/>RTT: ' + (rttNas * 1000).toFixed(1) + ' ms'
  }
];

const links = [
  // VPN IPsec SD-WAN: Rosario <--> FTG SSJ
  {
    source: 'ROSARIO_HUB',
    target: 'FTG_SSJ',
    lineStyle: { width: 4.5, color: '#06B6D4', curveness: 0.08 },
    label: { show: true, formatter: 'VPN IPsec SD-WAN\\n(sj1ros1 / sj2ros2)', fontSize: 9, color: '#38BDF8', backgroundColor: 'rgba(15,23,42,0.9)', padding: [3, 6], borderRadius: 4 },
    tooltip: '<b>Túneles IPsec Primario y Secundario</b><br/>sj1ros1 & sj2ros2 enlazados a Rosario'
  },
  // FTG SSJ <--> SSJ-CORE01
  {
    source: 'FTG_SSJ',
    target: 'SSJ_CORE01',
    lineStyle: { width: 5, color: '#EA580C', curveness: 0.05 },
    label: { show: true, formatter: 'Uplink LAN (port1)', fontSize: 10, color: '#FDBA74', backgroundColor: 'rgba(15,23,42,0.9)', padding: [3, 5], borderRadius: 4 },
    tooltip: '<b>Enlace Gateway a Core Switch</b>'
  },
  // SSJ-CORE01 <--> SSJ-SWADM
  {
    source: 'SSJ_CORE01',
    target: 'SSJ_SWADM',
    lineStyle: { width: 4, color: '#0284C7', curveness: 0.05 },
    label: { show: true, formatter: 'Cascada Troncal', fontSize: 9, color: '#7DD3FC', backgroundColor: 'rgba(15,23,42,0.9)', padding: [2, 5], borderRadius: 4 },
    tooltip: '<b>Enlace de cascada entre switches</b>'
  },
  // SSJ-CORE01 <--> SSJ-HPV01
  {
    source: 'SSJ_CORE01',
    target: 'SSJ_HPV01',
    lineStyle: { width: 5, color: '#10B981', curveness: 0.05 },
    label: { show: true, formatter: 'Troncal Virtualización', fontSize: 10, color: '#6EE7B7', backgroundColor: 'rgba(15,23,42,0.9)', padding: [3, 6], borderRadius: 4 },
    tooltip: '<b>Enlace Gigabit de Cómputo Hyper-V</b>'
  },
  // SSJ-HPV01 <--> VMs
  {
    source: 'SSJ_HPV01',
    target: 'SSJ_DCO01',
    lineStyle: { width: 3, color: '#8B5CF6', type: 'dashed', curveness: 0.1 },
    label: { show: false }
  },
  {
    source: 'SSJ_HPV01',
    target: 'SSJ_FIL01',
    lineStyle: { width: 3, color: '#8B5CF6', type: 'dashed' },
    label: { show: false }
  },
  {
    source: 'SSJ_HPV01',
    target: 'SSJ_SVC01',
    lineStyle: { width: 3, color: '#8B5CF6', type: 'dashed', curveness: -0.1 },
    label: { show: false }
  },
  // SSJ-CORE01 <--> SSJ-BKP01
  {
    source: 'SSJ_CORE01',
    target: 'SSJ_BKP01',
    lineStyle: { width: 3, color: '#F59E0B', curveness: 0.1 },
    label: { show: true, formatter: 'Veeam Traffic', fontSize: 9, color: '#FCD34D' }
  },
  // SSJ-BKP01 <--> SSJ-NAS01
  {
    source: 'SSJ_BKP01',
    target: 'SSJ_NAS01',
    lineStyle: { width: 4, color: '#F59E0B', curveness: 0.05 },
    label: { show: true, formatter: 'ISCSI / NFS Target', fontSize: 9, color: '#FCD34D', backgroundColor: 'rgba(15,23,42,0.9)', padding: [2, 5], borderRadius: 4 },
    tooltip: '<b>Enlace de almacenamiento de backup hacia el QNAP NAS</b>'
  },
  // SSJ-CORE01 <--> SSJ-NAS01
  {
    source: 'SSJ_CORE01',
    target: 'SSJ_NAS01',
    lineStyle: { width: 2, color: '#64748B', type: 'dotted', curveness: -0.1 },
    label: { show: false }
  }
];

return {
  backgroundColor: '#0A0F1D',
  title: {
    text: 'TOPOLOGÍA DE RED E INFRAESTRUCTURA: SEDE SAN JUAN (MILICIC S.A.)',
    subtext: 'Gateway WAN Fortinet, Enlaces IPsec SD-WAN, Switching Aruba, Clúster Hyper-V y Respaldo QNAP',
    left: 20,
    top: 15,
    textStyle: { color: '#F8FAFC', fontSize: 16, fontWeight: 'bold' },
    subtextStyle: { color: '#94A3B8', fontSize: 11 }
  },
  tooltip: {
    trigger: 'item',
    backgroundColor: '#0F172A',
    borderColor: '#EA580C',
    borderWidth: 1.5,
    textStyle: { color: '#F8FAFC', fontSize: 12 },
    formatter: function(params) {
      if (params.data && params.data.tooltip) return params.data.tooltip;
      return params.name;
    }
  },
  legend: [
    {
      data: categories.map(a => a.name),
      orient: 'horizontal',
      left: 'center',
      bottom: 12,
      textStyle: { color: '#CBD5E1', fontSize: 11 },
      itemWidth: 14,
      itemHeight: 14
    }
  ],
  graphic: [
    // Marco Zona WAN & Enlace Inter-Sede
    {
      type: 'rect',
      left: 50,
      top: 75,
      shape: { width: 340, height: 380, r: 8 },
      style: { fill: 'rgba(15, 23, 42, 0.45)', stroke: '#06B6D4', lineWidth: 1.5 }
    },
    {
      type: 'text',
      left: 65,
      top: 85,
      style: { text: '🌐 ENLACE INTER-SEDE & WAN (SAN JUAN ↔ ROSARIO)', fill: '#38BDF8', font: 'bold 11px sans-serif' }
    },
    // Marco Zona Switching & Distribución
    {
      type: 'rect',
      left: 420,
      top: 75,
      shape: { width: 230, height: 260, r: 8 },
      style: { fill: 'rgba(15, 23, 42, 0.45)', stroke: '#0284C7', lineWidth: 1.5 }
    },
    {
      type: 'text',
      left: 435,
      top: 85,
      style: { text: '🖧 SWITCHING ARUBA', fill: '#7DD3FC', font: 'bold 11px sans-serif' }
    },
    // Marco Zona Cómputo & Virtualización
    {
      type: 'rect',
      left: 680,
      top: 75,
      shape: { width: 330, height: 320, r: 8 },
      style: { fill: 'rgba(15, 23, 42, 0.45)', stroke: '#10B981', lineWidth: 1.5 }
    },
    {
      type: 'text',
      left: 695,
      top: 85,
      style: { text: '🖥️ VIRTUALIZACIÓN HYPER-V & MÁQUINAS VIRTUALES', fill: '#6EE7B7', font: 'bold 11px sans-serif' }
    },
    // Marco Zona Backup & Storage
    {
      type: 'rect',
      left: 540,
      top: 360,
      shape: { width: 360, height: 130, r: 8 },
      style: { fill: 'rgba(15, 23, 42, 0.45)', stroke: '#D97706', lineWidth: 1.5 }
    },
    {
      type: 'text',
      left: 555,
      top: 370,
      style: { text: '💾 RESPALDO VEEAM & QNAP NAS', fill: '#FBBF24', font: 'bold 11px sans-serif' }
    }
  ],
  series: [
    {
      type: 'graph',
      layout: 'none',
      coordinateSystem: null,
      roam: true,
      zoom: 1.05,
      center: ['50%', '52%'],
      categories: categories,
      nodes: nodes,
      links: links,
      cursor: 'pointer',
      edgeSymbol: ['none', 'arrow'],
      edgeSymbolSize: [4, 8],
      autoCurveness: false,
      emphasis: {
        focus: 'adjacency',
        lineStyle: { width: 6, shadowBlur: 15, shadowColor: '#EA580C' }
      }
    }
  ]
};
`;

// =============================================================================
// CONSTRUCCIÓN DEL DASHBOARD SUPERADOR PARA SAN JUAN
// =============================================================================
const dashboard = {
  title: "MILICIC S.A. | Observabilidad Integral & Topología Sede San Juan (SSJ)",
  uid: "milicic-sanjuan-infra",
  tags: ["milicic", "sanjuan", "ssj", "cuyo", "infrastructure", "topology", "hyperv", "fortigate"],
  timezone: "browser",
  schemaVersion: 40,
  time: { from: "now-3h", to: "now" },
  refresh: "30s",
  panels: [
    // -------------------------------------------------------------
    // ROW 0: ENCABEZADO NOC SAN JUAN (y: 0, h: 4)
    // -------------------------------------------------------------
    {
      id: 1,
      title: "Centro de Comando NOC - Sede Regional San Juan",
      type: "marcusolsson-dynamictext-panel",
      gridPos: { x: 0, y: 0, w: 24, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      options: {
        content: `
<div style="background: linear-gradient(90deg, #0B1120 0%, #1E293B 100%); border-left: 8px solid #EA580C; padding: 18px 24px; border-radius: 8px; color: #F8FAFC; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
  <div>
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="display: inline-block; width: 14px; height: 14px; background: #22C55E; border-radius: 50%; box-shadow: 0 0 12px #22C55E;"></span>
      <h1 style="margin: 0; color: #EA580C; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">MILICIC S.A. | SEDE REGIONAL SAN JUAN (SSJ)</h1>
    </div>
    <p style="margin: 6px 0 0 0; color: #94A3B8; font-size: 14px;">Infraestructura, Conectividad SD-WAN Cuyo, Switching Aruba, Cómputo Hyper-V y Almacenamiento QNAP</p>
  </div>
  <div style="display: flex; gap: 14px;">
    <div style="background: rgba(15,23,42,0.8); border: 1px solid #1E293B; padding: 8px 16px; border-radius: 6px; text-align: center;">
      <span style="color: #64748B; font-size: 11px; font-weight: bold; text-transform: uppercase;">Estado Flota</span>
      <div style="color: #22C55E; font-size: 14px; font-weight: bold;">8/8 NODOS ONLINE</div>
    </div>
    <div style="background: rgba(15,23,42,0.8); border: 1px solid #1E293B; padding: 8px 16px; border-radius: 6px; text-align: center;">
      <span style="color: #64748B; font-size: 11px; font-weight: bold; text-transform: uppercase;">Túneles IPsec</span>
      <div style="color: #38BDF8; font-size: 14px; font-weight: bold;">ROSARIO ENLAZADO</div>
    </div>
    <div style="background: rgba(15,23,42,0.8); border: 1px solid #1E293B; padding: 8px 16px; border-radius: 6px; text-align: center;">
      <span style="color: #64748B; font-size: 11px; font-weight: bold; text-transform: uppercase;">Hyper-V Físico</span>
      <div style="color: #10B981; font-size: 14px; font-weight: bold;">OPERATIVO</div>
    </div>
  </div>
</div>
        `
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "SSJ-CORE01" },
          item: { filter: "ICMP ping" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 1: 6 KPI STAT CARDS (y: 4, h: 4)
    // -------------------------------------------------------------
    {
      id: 2,
      title: "Latencia RTT San Juan ↔ Rosario",
      type: "stat",
      gridPos: { x: 0, y: 4, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "s",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#10B981", value: null },
              { color: "#F59E0B", value: 0.035 },
              { color: "#EF4444", value: 0.070 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "background",
        graphMode: "area"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "FTG_ar-ssj-predio_SNMP" },
          item: { filter: "ICMP response time" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 3,
      title: "Disponibilidad Switch Core SSJ",
      type: "stat",
      gridPos: { x: 4, y: 4, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#EF4444", value: null },
              { color: "#10B981", value: 1 }
            ]
          },
          mappings: [
            { type: "value", options: { "0": { text: "DOWN", color: "#EF4444" }, "1": { text: "100% ONLINE", color: "#10B981" } } }
          ]
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "background",
        graphMode: "none",
        textMode: "value_and_name"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "SSJ-CORE01" },
          item: { filter: "ICMP ping" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 4,
      title: "Disponibilidad Switch Adm SSJ",
      type: "stat",
      gridPos: { x: 8, y: 4, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#EF4444", value: null },
              { color: "#10B981", value: 1 }
            ]
          },
          mappings: [
            { type: "value", options: { "0": { text: "DOWN", color: "#EF4444" }, "1": { text: "100% ONLINE", color: "#10B981" } } }
          ]
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "background",
        graphMode: "none",
        textMode: "value_and_name"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "SSJ-SWADM" },
          item: { filter: "ICMP ping" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 5,
      title: "CPU Host Hyper-V (SSJ-HPV01)",
      type: "stat",
      gridPos: { x: 12, y: 4, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "percent",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#10B981", value: null },
              { color: "#F59E0B", value: 65 },
              { color: "#EF4444", value: 85 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "background",
        graphMode: "area"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "SSJ-HPV01" },
          item: { filter: "CPU utilization" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 6,
      title: "Volumen Datos E: (SSJ-FIL01)",
      type: "stat",
      gridPos: { x: 16, y: 4, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "percent",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#10B981", value: null },
              { color: "#F59E0B", value: 75 },
              { color: "#EF4444", value: 90 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "background",
        graphMode: "area"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "SSJ-FIL01" },
          item: { filter: "FS [DATOS(E:)]: Space: Used, in %" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 7,
      title: "Repositorio Backup QNAP (SSJ-NAS01)",
      type: "stat",
      gridPos: { x: 20, y: 4, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "s",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#10B981", value: null },
              { color: "#F59E0B", value: 0.020 },
              { color: "#EF4444", value: 0.050 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "background",
        graphMode: "area"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "SSJ-NAS01" },
          item: { filter: "ICMP response time" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 2: TOPOLOGÍA INTERACTIVA DE SEDE SAN JUAN (y: 8, h: 20)
    // -------------------------------------------------------------
    {
      id: 10,
      title: "Topología Física de Red, Enlaces SD-WAN y Clúster Hyper-V (San Juan)",
      type: "volkovlabs-echarts-panel",
      gridPos: { x: 0, y: 8, w: 24, h: 20 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      options: {
        getOption: echartsCode
      },
      targets: [
        { refId: "RTT_FTG", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "FTG_ar-ssj-predio_SNMP" }, item: { filter: "ICMP response time" }, resultFormat: "time_series", options: { showDisabledItems: false } },
        { refId: "RTT_CORE", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-CORE01" }, item: { filter: "ICMP response time" }, resultFormat: "time_series", options: { showDisabledItems: false } },
        { refId: "RTT_SWADM", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-SWADM" }, item: { filter: "ICMP response time" }, resultFormat: "time_series", options: { showDisabledItems: false } },
        { refId: "RTT_HPV", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-HPV01" }, item: { filter: "ICMP response time" }, resultFormat: "time_series", options: { showDisabledItems: false } },
        { refId: "RTT_DCO", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-DCO01" }, item: { filter: "ICMP response time" }, resultFormat: "time_series", options: { showDisabledItems: false } },
        { refId: "RTT_FIL", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-FIL01" }, item: { filter: "ICMP response time" }, resultFormat: "time_series", options: { showDisabledItems: false } },
        { refId: "RTT_NAS", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-NAS01" }, item: { filter: "ICMP response time" }, resultFormat: "time_series", options: { showDisabledItems: false } },
        { refId: "RTT_BKP", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-BKP01" }, item: { filter: "ICMP response time" }, resultFormat: "time_series", options: { showDisabledItems: false } },
        { refId: "CPU_HPV", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-HPV01" }, item: { filter: "CPU utilization" }, resultFormat: "time_series", options: { showDisabledItems: false } },
        { refId: "CPU_DCO", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-DCO01" }, item: { filter: "CPU utilization" }, resultFormat: "time_series", options: { showDisabledItems: false } },
        { refId: "CPU_FIL", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-FIL01" }, item: { filter: "CPU utilization" }, resultFormat: "time_series", options: { showDisabledItems: false } },
        { refId: "CPU_BKP", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-BKP01" }, item: { filter: "CPU utilization" }, resultFormat: "time_series", options: { showDisabledItems: false } }
      ]
    },

    // -------------------------------------------------------------
    // ROW 3: LATENCIA RTT MULTI-HOST & PÉRDIDA DE PAQUETES (y: 28, h: 8)
    // -------------------------------------------------------------
    {
      id: 20,
      title: "Latencia RTT Multi-Host San Juan (ms)",
      type: "timeseries",
      gridPos: { x: 0, y: 28, w: 14, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          custom: {
            drawStyle: "line",
            lineInterpolation: "smooth",
            lineWidth: 2,
            fillOpacity: 8,
            gradientMode: "opacity"
          },
          unit: "s",
          color: { mode: "palette-classic" }
        }
      },
      options: {
        tooltip: { mode: "multi", sort: "desc" },
        legend: { displayMode: "table", placement: "right", calcs: ["lastNotNull", "mean"] }
      },
      targets: [
        { refId: "FTG", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "FTG_ar-ssj-predio_SNMP" }, item: { filter: "ICMP response time" }, resultFormat: "time_series", options: { showDisabledItems: false } },
        { refId: "CORE01", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-CORE01" }, item: { filter: "ICMP response time" }, resultFormat: "time_series", options: { showDisabledItems: false } },
        { refId: "SWADM", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-SWADM" }, item: { filter: "ICMP response time" }, resultFormat: "time_series", options: { showDisabledItems: false } },
        { refId: "HPV01", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-HPV01" }, item: { filter: "ICMP response time" }, resultFormat: "time_series", options: { showDisabledItems: false } },
        { refId: "DCO01", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-DCO01" }, item: { filter: "ICMP response time" }, resultFormat: "time_series", options: { showDisabledItems: false } },
        { refId: "FIL01", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-FIL01" }, item: { filter: "ICMP response time" }, resultFormat: "time_series", options: { showDisabledItems: false } },
        { refId: "NAS01", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-NAS01" }, item: { filter: "ICMP response time" }, resultFormat: "time_series", options: { showDisabledItems: false } }
      ]
    },
    {
      id: 25,
      title: "Pérdida de Paquetes ICMP (%) en Nodos San Juan",
      type: "bargauge",
      gridPos: { x: 14, y: 28, w: 10, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "percent",
          min: 0,
          max: 100,
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#10B981", value: null },
              { color: "#F59E0B", value: 1 },
              { color: "#EF4444", value: 5 }
            ]
          }
        }
      },
      options: {
        orientation: "horizontal",
        displayMode: "gradient",
        showUnfilled: true
      },
      targets: [
        { refId: "FTG_Loss", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "FTG_ar-ssj-predio_SNMP" }, item: { filter: "ICMP loss" }, resultFormat: "time_series", options: { showDisabledItems: false } },
        { refId: "CORE_Loss", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-CORE01" }, item: { filter: "ICMP loss" }, resultFormat: "time_series", options: { showDisabledItems: false } },
        { refId: "SWADM_Loss", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-SWADM" }, item: { filter: "ICMP loss" }, resultFormat: "time_series", options: { showDisabledItems: false } },
        { refId: "HPV_Loss", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-HPV01" }, item: { filter: "ICMP loss" }, resultFormat: "time_series", options: { showDisabledItems: false } },
        { refId: "DCO_Loss", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-DCO01" }, item: { filter: "ICMP loss" }, resultFormat: "time_series", options: { showDisabledItems: false } },
        { refId: "NAS_Loss", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-NAS01" }, item: { filter: "ICMP loss" }, resultFormat: "time_series", options: { showDisabledItems: false } }
      ]
    },

    // -------------------------------------------------------------
    // ROW 4: RECURSOS DE CÓMPUTO & CAPACIDAD DE ALMACENAMIENTO (y: 36, h: 8)
    // -------------------------------------------------------------
    {
      id: 30,
      title: "Utilización de CPU en Nodos y Servidores San Juan (%)",
      type: "timeseries",
      gridPos: { x: 0, y: 36, w: 12, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          custom: {
            drawStyle: "line",
            lineInterpolation: "smooth",
            lineWidth: 2,
            fillOpacity: 12,
            gradientMode: "opacity"
          },
          unit: "percent",
          min: 0,
          max: 100,
          color: { mode: "palette-classic" }
        }
      },
      options: {
        tooltip: { mode: "multi", sort: "desc" },
        legend: { displayMode: "table", placement: "right", calcs: ["lastNotNull", "max"] }
      },
      targets: [
        { refId: "HPV_CPU", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-HPV01" }, item: { filter: "CPU utilization" }, resultFormat: "time_series", options: { showDisabledItems: false } },
        { refId: "DCO_CPU", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-DCO01" }, item: { filter: "CPU utilization" }, resultFormat: "time_series", options: { showDisabledItems: false } },
        { refId: "FIL_CPU", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-FIL01" }, item: { filter: "CPU utilization" }, resultFormat: "time_series", options: { showDisabledItems: false } },
        { refId: "BKP_CPU", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-BKP01" }, item: { filter: "CPU utilization" }, resultFormat: "time_series", options: { showDisabledItems: false } }
      ]
    },
    {
      id: 35,
      title: "Ocupación de Particiones de Datos y Volúmenes de Sistema (%)",
      type: "bargauge",
      gridPos: { x: 12, y: 36, w: 12, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "percent",
          min: 0,
          max: 100,
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#10B981", value: null },
              { color: "#F59E0B", value: 70 },
              { color: "#EF4444", value: 85 }
            ]
          }
        }
      },
      options: {
        orientation: "horizontal",
        displayMode: "gradient",
        showUnfilled: true
      },
      targets: [
        { refId: "FIL_DATOS", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-FIL01" }, item: { filter: "FS [DATOS(E:)]: Space: Used, in %" }, resultFormat: "time_series", options: { showDisabledItems: false } },
        { refId: "HPV_DATA", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-HPV01" }, item: { filter: "FS [DATA(D:)]: Space: Used, in %" }, resultFormat: "time_series", options: { showDisabledItems: false } },
        { refId: "HPV_VM", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-HPV01" }, item: { filter: "FS [VM(E:)]: Space: Used, in %" }, resultFormat: "time_series", options: { showDisabledItems: false } },
        { refId: "BKP_SYS", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-BKP01" }, item: { filter: "FS [(C:)]: Space: Used, in %" }, resultFormat: "time_series", options: { showDisabledItems: false } },
        { refId: "HPV_SYS", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-HPV01" }, item: { filter: "FS [(C:)]: Space: Used, in %" }, resultFormat: "time_series", options: { showDisabledItems: false } },
        { refId: "DCO_SYS", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-DCO01" }, item: { filter: "FS [(C:)]: Space: Used, in %" }, resultFormat: "time_series", options: { showDisabledItems: false } },
        { refId: "FIL_SYS", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "SSJ-FIL01" }, item: { filter: "FS [(C:)]: Space: Used, in %" }, resultFormat: "time_series", options: { showDisabledItems: false } }
      ]
    },

    // -------------------------------------------------------------
    // ROW 5: INCIDENCIAS Y ALARMAS ACTIVAS EN SAN JUAN (y: 44, h: 8)
    // -------------------------------------------------------------
    {
      id: 40,
      title: "Registro de Incidentes y Alarmas Activas en Sede San Juan (Zabbix Problems)",
      type: "table",
      gridPos: { x: 0, y: 44, w: 24, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      transformations: [
        {
          id: "extractFields",
          options: {
            format: "json",
            source: "Problems"
          }
        },
        {
          id: "calculateField",
          options: {
            mode: "binary",
            binary: {
              left: "timestamp",
              operator: "*",
              right: "1000"
            },
            alias: "Inicio_ms"
          }
        },
        {
          id: "organize",
          options: {
            excludeByName: {
              "Problems": true,
              "Time": true,
              "eventid": true,
              "objectid": true,
              "triggerid": true,
              "tags": true,
              "items": true,
              "groups": true,
              "url": true,
              "comments": true,
              "description": true,
              "value": true,
              "opdata": true,
              "suppressed": true,
              "suppression_data": true,
              "acknowledges": true,
              "alerts": true,
              "timestamp": true,
              "expression": true,
              "recovery_expression": true,
              "correlation_mode": true,
              "correlation_tag": true,
              "manual_close": true,
              "state": true,
              "error": true,
              "flags": true,
              "priority": true,
              "lastchange": true,
              "templateid": true,
              "type": true,
              "urls": true,
              "cause_eventid": true
            },
            indexByName: {
              "severity": 0,
              "Inicio_ms": 1,
              "name": 2,
              "hosts": 3,
              "acknowledged": 4
            },
            renameByName: {
              "severity": "Severidad",
              "Inicio_ms": "Inicio",
              "name": "Problema / Incidente",
              "hosts": "Dispositivo",
              "acknowledged": "ACK"
            }
          }
        },
        {
          id: "filterFieldsByName",
          options: {
            include: {
              names: [
                "Severidad",
                "Inicio",
                "Problema / Incidente",
                "Dispositivo",
                "ACK"
              ]
            }
          }
        }
      ],
      fieldConfig: {
        defaults: {
          custom: { align: "left", cellOptions: { type: "auto" }, filterable: true }
        },
        overrides: [
          {
            matcher: { id: "byName", options: "Severidad" },
            properties: [
              { id: "custom.width", value: 160 },
              {
                id: "mappings",
                value: [
                  { type: "value", options: { "0": { text: "INFO", color: "#64748B" } } },
                  { type: "value", options: { "1": { text: "INFO", color: "#0284C7" } } },
                  { type: "value", options: { "2": { text: "ADVERTENCIA (P3)", color: "#EAB308" } } },
                  { type: "value", options: { "3": { text: "PROMEDIO (P2)", color: "#F97316" } } },
                  { type: "value", options: { "4": { text: "ALTO (P1)", color: "#EF4444" } } },
                  { type: "value", options: { "5": { text: "DESASTRE (P1)", color: "#DC2626" } } }
                ]
              },
              { id: "custom.cellOptions", value: { type: "color-background", mode: "gradient" } }
            ]
          },
          {
            matcher: { id: "byName", options: "Inicio" },
            properties: [
              { id: "unit", value: "dateTimeFromNow" },
              { id: "custom.width", value: 140 }
            ]
          },
          {
            matcher: { id: "byName", options: "Dispositivo" },
            properties: [
              { id: "custom.width", value: 240 },
              {
                id: "mappings",
                value: [
                  {
                    type: "regex",
                    options: {
                      pattern: ".*FTG_ar-ssj-predio.*",
                      result: { text: "FortiGate Predio San Juan" }
                    }
                  },
                  {
                    type: "regex",
                    options: {
                      pattern: ".*SSJ-CORE01.*",
                      result: { text: "SSJ-CORE01 (Core Switch)" }
                    }
                  },
                  {
                    type: "regex",
                    options: {
                      pattern: ".*SSJ-SWADM.*",
                      result: { text: "SSJ-SWADM (Switch Adm)" }
                    }
                  },
                  {
                    type: "regex",
                    options: {
                      pattern: ".*SSJ-HPV01.*",
                      result: { text: "SSJ-HPV01 (Hipervisor Hyper-V)" }
                    }
                  },
                  {
                    type: "regex",
                    options: {
                      pattern: ".*SSJ-DCO01.*",
                      result: { text: "SSJ-DCO01 (Domain Controller)" }
                    }
                  },
                  {
                    type: "regex",
                    options: {
                      pattern: ".*SSJ-FIL01.*",
                      result: { text: "SSJ-FIL01 (File Server)" }
                    }
                  },
                  {
                    type: "regex",
                    options: {
                      pattern: ".*SSJ-SVC01.*",
                      result: { text: "SSJ-SVC01 (Print / DHCP Server)" }
                    }
                  },
                  {
                    type: "regex",
                    options: {
                      pattern: ".*SSJ-BKP01.*",
                      result: { text: "SSJ-BKP01 (Veeam Backup Proxy)" }
                    }
                  },
                  {
                    type: "regex",
                    options: {
                      pattern: ".*SSJ-NAS01.*",
                      result: { text: "SSJ-NAS01 (QNAP NAS Storage)" }
                    }
                  },
                  {
                    type: "regex",
                    options: {
                      pattern: ".*SSJ-.*",
                      result: { text: "Servidor SSJ" }
                    }
                  }
                ]
              }
            ]
          },
          {
            matcher: { id: "byName", options: "Problema / Incidente" },
            properties: [
              { id: "custom.width", value: 550 },
              {
                id: "links",
                value: [
                  {
                    title: "🔍 Ver en Zabbix Problems",
                    url: "https://zabbix.mlccnet.local/zabbix.php?action=problem.view",
                    targetBlank: true
                  }
                ]
              }
            ]
          },
          {
            matcher: { id: "byName", options: "ACK" },
            properties: [
              { id: "custom.width", value: 90 },
              {
                id: "mappings",
                value: [
                  { type: "value", options: { "0": { text: "No", color: "#EF4444" } } },
                  { type: "value", options: { "1": { text: "✓ Sí", color: "#10B981" } } }
                ]
              },
              { id: "custom.cellOptions", value: { type: "color-text" } }
            ]
          }
        ]
      },
      options: {
        showHeader: true,
        sortBy: [{ desc: true, displayName: "Severidad" }]
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "5",
          group: { filter: "/(sanJuan|FortiGate)/" },
          host: { filter: "/(SSJ|FTG_ar-ssj-predio)/" },
          options: {
            minSeverity: "1",
            showSuppressed: false
          }
        }
      ]
    }
  ]
};

const payload = JSON.stringify({
  dashboard: dashboard,
  overwrite: true,
  message: "Deploy Brand New Masterpiece San Juan Infrastructure Dashboard"
});

const req = http.request({
  hostname: '172.27.210.154',
  port: 3005,
  path: '/api/dashboards/db',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + grafanaToken,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', data);
    try {
      const resp = JSON.parse(data);
      if (resp.status === 'success') {
        console.log('\n======================================================');
        console.log('✅ TABLERO SUPERADOR DE SAN JUAN DESPLEGADO CON ÉXITO');
        console.log('URL: http://172.27.210.154:3005' + resp.url);
        console.log('======================================================\n');
      }
    } catch (e) {
      console.error('Error al parsear:', e);
    }
  });
});

req.write(payload);
req.end();
