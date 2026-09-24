import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const DATASOURCE_UID = "efz4nzx8r30g0c";
const DATASOURCE_TYPE = "alexanderzobnin-zabbix-datasource";

// =============================================================================
// CÓDIGO JS OPTIMIZADO PARA APACHE ECHARTS (MAPA TOPOLÓGICO INTERACTIVO)
// =============================================================================
const echartsCode = `
// 1. Definición de Categorías Corporativas
const categories = [
  { name: 'WAN & Perímetro', itemStyle: { color: '#EA580C', borderColor: '#F97316', borderWidth: 2 } },
  { name: 'Core Switching', itemStyle: { color: '#0284C7', borderColor: '#38BDF8', borderWidth: 2 } },
  { name: 'Distribución & Acceso', itemStyle: { color: '#8B5CF6', borderColor: '#A78BFA', borderWidth: 2 } },
  { name: 'Cómputo & Datacenter', itemStyle: { color: '#10B981', borderColor: '#34D399', borderWidth: 2 } },
  { name: 'Energía Crítica (UPS)', itemStyle: { color: '#F59E0B', borderColor: '#FBBF24', borderWidth: 2 } },
  { name: 'Wi-Fi Corporativo Aruba', itemStyle: { color: '#06B6D4', borderColor: '#22D3EE', borderWidth: 2 } }
];

// 2. Definición de Nodos con Coordenadas Cuidadosamente Espaciadas (Zero Overlaps)
const nodes = [
  // --- WAN & PERÍMETRO ---
  { id: 'FTG_BORDER', name: 'FortiGate WAN\\n172.30.20.1', category: 0, symbolSize: 58, symbol: 'roundRect', x: 80, y: 120, ip: '172.30.20.1', role: 'Firewall Perímetro (FortiGate 200F)' },
  
  // --- CORE SWITCHING ---
  { id: 'CORE03', name: 'CORE03 (Aruba 1930)\\n172.30.20.211', category: 1, symbolSize: 52, symbol: 'rect', x: 300, y: 120, ip: '172.30.20.211', role: 'Switch Core Aruba JL682A' },
  { id: 'CORE01', name: 'CORE01 (Dell N4032)\\n172.30.20.201', category: 1, symbolSize: 58, symbol: 'rect', x: 540, y: 260, ip: '172.30.20.201', role: 'Core 10G Master (Dell N4032)' },
  { id: 'CORE02', name: 'CORE02 (Dell N4032)\\n172.30.20.202', category: 1, symbolSize: 58, symbol: 'rect', x: 540, y: 520, ip: '172.30.20.202', role: 'Core 10G Standby (Dell N4032)' },
  
  // --- EDIFICIO GRIS PB & ACCESO ---
  { id: 'ACC01_EG', name: 'ACC01 (Ed. Gris PB)\\n172.30.20.210', category: 2, symbolSize: 42, symbol: 'circle', x: 100, y: 320, ip: '172.30.20.210', role: 'Switch Acceso Edificio Gris PB' },
  { id: 'ACC02_EG', name: 'ACC02 (Ed. Gris PB)\\n172.30.20.217', category: 2, symbolSize: 42, symbol: 'circle', x: 100, y: 480, ip: '172.30.20.217', role: 'Switch Acceso Edificio Gris PB' },
  { id: 'VC_MASTER', name: 'AP Master VC\\n172.30.20.231', category: 5, symbolSize: 44, symbol: 'diamond', x: 300, y: 480, ip: '172.30.20.231', role: 'Aruba Virtual Controller Master' },

  // --- CÓMPUTO & STORAGE (DATACENTER CLUSTER) ---
  { id: 'ESX01', name: 'SRO-ESX01 (HPE DL380)\\n172.30.70.131', category: 3, symbolSize: 46, symbol: 'roundRect', x: 80, y: 720, ip: '172.30.70.131', role: 'Hypervisor VMware ESXi 01' },
  { id: 'ESX02', name: 'SRO-ESX02 (HPE DL380)\\n172.30.70.132', category: 3, symbolSize: 46, symbol: 'roundRect', x: 230, y: 720, ip: '172.30.70.132', role: 'Hypervisor VMware ESXi 02' },
  { id: 'STO01', name: 'SRO-STO01 (HPE MSA)\\n172.30.70.140', category: 3, symbolSize: 48, symbol: 'roundRect', x: 380, y: 720, ip: '172.30.70.140', role: 'Storage SAN HPE MSA 2060' },
  { id: 'VCENTER', name: 'vCenter Server\\n172.30.70.136', category: 3, symbolSize: 44, symbol: 'roundRect', x: 530, y: 720, ip: '172.30.70.136', role: 'Gestión VMware vCenter 7.0' },
  { id: 'DCO01', name: 'SRO-DCO01 (DC FSMO)\\n172.30.20.10', category: 3, symbolSize: 44, symbol: 'roundRect', x: 80, y: 880, ip: '172.30.20.10', role: 'Controlador de Dominio FSMO' },
  { id: 'SQL01', name: 'SRO-SQL01 (Database)\\n172.30.20.18', category: 3, symbolSize: 44, symbol: 'roundRect', x: 230, y: 880, ip: '172.30.20.18', role: 'Servidor Base de Datos SQL' },
  { id: 'BKP01', name: 'SRO-BKP01 (Veeam)\\n172.30.20.17', category: 3, symbolSize: 44, symbol: 'roundRect', x: 380, y: 880, ip: '172.30.20.17', role: 'Servidor Veeam Backup Repos' },
  { id: 'ZBX', name: 'Zabbix Server\\n172.30.20.61', category: 3, symbolSize: 48, symbol: 'roundRect', x: 530, y: 880, ip: '172.30.20.61', role: 'Monitoreo Central Prod 7.0' },

  // --- ENERGÍA & FACILITIES (BANCOS DE BATERÍAS UPS) ---
  { id: 'UPS_EMERSON', name: 'UPS Emerson (Core)\\n172.30.20.80', category: 4, symbolSize: 48, symbol: 'triangle', x: 740, y: 720, ip: '172.30.20.80', role: 'UPS Emerson Liebert 10 kVA' },
  { id: 'UPS_E02_P00', name: 'UPS Ed. Gris PB\\n172.30.20.81', category: 4, symbolSize: 46, symbol: 'triangle', x: 920, y: 720, ip: '172.30.20.81', role: 'UPS APC Smart-UPS 3 kVA' },
  { id: 'UPS_E02_PA', name: 'UPS E02 PA\\n172.30.20.82', category: 4, symbolSize: 44, symbol: 'triangle', x: 740, y: 880, ip: '172.30.20.82', role: 'UPS APC Smart-UPS 2 kVA' },
  { id: 'UPS_G01', name: 'UPS Galpón 01\\n172.30.20.83', category: 4, symbolSize: 44, symbol: 'triangle', x: 920, y: 880, ip: '172.30.20.83', role: 'UPS Eaton Galpón 01' },

  // --- ANEXO E03 & EDIFICIO BLANCO ---
  { id: 'D03', name: 'D03 (Edificio E03)\\n172.30.20.218', category: 2, symbolSize: 44, symbol: 'rect', x: 780, y: 520, ip: '172.30.20.218', role: 'Switch Aruba 1930 8G (E03)' },
  { id: 'D01', name: 'D01 (Ed. Blanco)\\n172.30.20.207', category: 2, symbolSize: 44, symbol: 'rect', x: 780, y: 320, ip: '172.30.20.207', role: 'Switch Troncal Edificio Blanco' },
  { id: 'AP_ADM', name: 'AP Administración\\n172.30.20.233', category: 5, symbolSize: 36, symbol: 'circle', x: 960, y: 280, ip: '172.30.20.233', role: 'Access Point Aruba (Adm)' },
  { id: 'AP_REC', name: 'AP Recepción\\n172.30.20.232', category: 5, symbolSize: 36, symbol: 'circle', x: 960, y: 360, ip: '172.30.20.232', role: 'Access Point Aruba (Recepción)' },

  // --- GALPÓN 01 & RADIOENLACES ---
  { id: 'DIS01_G01', name: 'DIS01 (Galpón 01)\\n172.30.20.224', category: 2, symbolSize: 50, symbol: 'rect', x: 800, y: 120, ip: '172.30.20.224', role: 'Switch Distribución G01' },
  { id: 'ACC01_G01', name: 'ACC01 (G01 Port 3)\\n172.30.20.214', category: 2, symbolSize: 42, symbol: 'circle', x: 1060, y: 70, ip: '172.30.20.214', role: 'Switch Acceso Taller Mecánico' },
  { id: 'ACC2_G01', name: 'ACC2 (G01 Port 24)\\n172.30.20.215', category: 2, symbolSize: 42, symbol: 'circle', x: 1060, y: 190, ip: '172.30.20.215', role: 'Switch Acceso Pañol Central' },
  { id: 'P2P_G06', name: 'P2P G06 (Ubiquiti)\\n172.30.20.240', category: 2, symbolSize: 38, symbol: 'diamond', x: 1280, y: 70, ip: '172.30.20.240', role: 'Radioenlace P2P G06' },
  { id: 'POR_P2P01', name: 'POR-P2P01 (Portería)\\n172.30.20.241', category: 2, symbolSize: 38, symbol: 'diamond', x: 1280, y: 190, ip: '172.30.20.241', role: 'Radioenlace P2P Portería' },
  { id: 'AP_ABAST', name: 'AP Abastecimiento\\n172.30.20.234', category: 5, symbolSize: 36, symbol: 'circle', x: 1480, y: 70, ip: '172.30.20.234', role: 'Access Point Abastecimiento' },
  { id: 'AP_PANOL', name: 'AP Pañol\\n172.30.20.235', category: 5, symbolSize: 36, symbol: 'circle', x: 1480, y: 190, ip: '172.30.20.235', role: 'Access Point Pañol' },

  // --- PARQUE WI-FI ARUBA CORPORATIVO ---
  { id: 'WIFI_CLUSTER', name: 'Clúster Wi-Fi Aruba\\n(14 APs AOS-8)', category: 5, symbolSize: 58, symbol: 'roundRect', x: 1320, y: 550, ip: '172.30.20.x', role: 'Clúster Virtual Controller AOS-8' },
  { id: 'AP_DIR', name: 'AP Directorio\\n172.30.20.236', category: 5, symbolSize: 36, symbol: 'circle', x: 1140, y: 440, ip: '172.30.20.236', role: 'AP Edificio Blanco Directorio' },
  { id: 'AP_GER', name: 'AP Gerencias\\n172.30.20.237', category: 5, symbolSize: 36, symbol: 'circle', x: 1140, y: 660, ip: '172.30.20.237', role: 'AP Edificio Blanco Gerencias' },
  { id: 'AP_AIMI', name: 'AP AIMI\\n172.30.20.238', category: 5, symbolSize: 36, symbol: 'circle', x: 1500, y: 440, ip: '172.30.20.238', role: 'AP Taller AIMI' },
  { id: 'AP_COMP', name: 'AP Compras\\n172.30.20.239', category: 5, symbolSize: 36, symbol: 'circle', x: 1500, y: 660, ip: '172.30.20.239', role: 'AP Edificio Gris Compras' },
  { id: 'AP_COMED', name: 'AP Comedor\\n172.30.20.242', category: 5, symbolSize: 36, symbol: 'circle', x: 1320, y: 750, ip: '172.30.20.242', role: 'AP Comedor Principal' },
  { id: 'AP_CAS', name: 'AP CAS\\n172.30.20.243', category: 5, symbolSize: 36, symbol: 'circle', x: 1140, y: 780, ip: '172.30.20.243', role: 'AP CAS' }
];

// 3. Definición de Enlaces Físicos y Lógicos (Edges)
const links = [
  // Troncales Core
  { source: 'FTG_BORDER', target: 'CORE03', label: { show: true, formatter: 'WAN 1G' }, lineStyle: { width: 3.5, color: '#EA580C' } },
  { source: 'CORE03', target: 'CORE01', label: { show: true, formatter: 'Te1/0/6 (10G)' }, lineStyle: { width: 3.5, color: '#10B981' } },
  { source: 'CORE01', target: 'CORE02', label: { show: true, formatter: 'LAG Te1/0/20 (20G)' }, lineStyle: { width: 4.5, color: '#0284C7' } },
  { source: 'CORE01', target: 'DIS01_G01', label: { show: true, formatter: 'Te1/0/8 G01' }, lineStyle: { width: 3, color: '#10B981' } },
  { source: 'CORE01', target: 'D01', label: { show: true, formatter: 'Te1/0/5 E01' }, lineStyle: { width: 3, color: '#10B981' } },
  { source: 'CORE03', target: 'D03', label: { show: true, formatter: 'TRK1 E03' }, lineStyle: { width: 3, color: '#10B981' } },
  
  // Acceso Edificio Gris
  { source: 'CORE01', target: 'ACC01_EG', lineStyle: { width: 2, color: '#64748B' } },
  { source: 'CORE01', target: 'ACC02_EG', lineStyle: { width: 2, color: '#64748B' } },
  { source: 'ACC01_EG', target: 'VC_MASTER', lineStyle: { width: 2, color: '#06B6D4' } },

  // Cómputo Datacenter
  { source: 'CORE02', target: 'ESX01', lineStyle: { width: 2.5, color: '#10B981' } },
  { source: 'CORE02', target: 'ESX02', lineStyle: { width: 2.5, color: '#10B981' } },
  { source: 'CORE02', target: 'STO01', lineStyle: { width: 3.5, color: '#0284C7' } },
  { source: 'CORE02', target: 'VCENTER', lineStyle: { width: 2, color: '#10B981' } },
  { source: 'CORE02', target: 'DCO01', lineStyle: { width: 2, color: '#10B981' } },
  { source: 'CORE02', target: 'SQL01', lineStyle: { width: 2.5, color: '#10B981' } },
  { source: 'CORE02', target: 'BKP01', lineStyle: { width: 2.5, color: '#10B981' } },
  { source: 'CORE02', target: 'ZBX', lineStyle: { width: 2.5, color: '#10B981' } },

  // Alimentación Crítica UPS
  { source: 'CORE02', target: 'UPS_EMERSON', lineStyle: { width: 1.5, type: 'dashed', color: '#F59E0B' } },
  { source: 'ESX01', target: 'UPS_E02_P00', lineStyle: { width: 1.5, type: 'dashed', color: '#F59E0B' } },
  { source: 'D03', target: 'UPS_E02_PA', lineStyle: { width: 1.5, type: 'dashed', color: '#F59E0B' } },
  { source: 'DIS01_G01', target: 'UPS_G01', lineStyle: { width: 1.5, type: 'dashed', color: '#F59E0B' } },

  // Galpón 01 & Radioenlaces
  { source: 'DIS01_G01', target: 'ACC01_G01', label: { show: true, formatter: 'P3' }, lineStyle: { width: 2, color: '#10B981' } },
  { source: 'DIS01_G01', target: 'ACC2_G01', label: { show: true, formatter: 'P24' }, lineStyle: { width: 2, color: '#10B981' } },
  { source: 'ACC01_G01', target: 'P2P_G06', lineStyle: { width: 2, color: '#8B5CF6' } },
  { source: 'ACC2_G01', target: 'POR_P2P01', lineStyle: { width: 2, color: '#8B5CF6' } },
  { source: 'DIS01_G01', target: 'AP_ABAST', lineStyle: { width: 1.5, color: '#06B6D4' } },
  { source: 'DIS01_G01', target: 'AP_PANOL', lineStyle: { width: 1.5, color: '#06B6D4' } },

  // Edificio Blanco
  { source: 'D01', target: 'AP_ADM', lineStyle: { width: 1.5, color: '#06B6D4' } },
  { source: 'D01', target: 'AP_REC', lineStyle: { width: 1.5, color: '#06B6D4' } },

  // Clúster Wi-Fi Aruba
  { source: 'VC_MASTER', target: 'WIFI_CLUSTER', label: { show: true, formatter: 'AOS-8 VC' }, lineStyle: { width: 3, type: 'dotted', color: '#06B6D4' } },
  { source: 'WIFI_CLUSTER', target: 'AP_DIR', lineStyle: { width: 1.5, type: 'dotted', color: '#06B6D4' } },
  { source: 'WIFI_CLUSTER', target: 'AP_GER', lineStyle: { width: 1.5, type: 'dotted', color: '#06B6D4' } },
  { source: 'WIFI_CLUSTER', target: 'AP_AIMI', lineStyle: { width: 1.5, type: 'dotted', color: '#06B6D4' } },
  { source: 'WIFI_CLUSTER', target: 'AP_COMP', lineStyle: { width: 1.5, type: 'dotted', color: '#06B6D4' } },
  { source: 'WIFI_CLUSTER', target: 'AP_COMED', lineStyle: { width: 1.5, type: 'dotted', color: '#06B6D4' } },
  { source: 'WIFI_CLUSTER', target: 'AP_CAS', lineStyle: { width: 1.5, type: 'dotted', color: '#06B6D4' } }
];

return {
  backgroundColor: '#090D16',
  title: {
    text: 'TOPOLOGÍA DE RED Y TELEMETRÍA GLOBAL (SRO)',
    subtext: 'Navegación interactiva NOC: Zoom (rueda), Panorámica (arrastre), Resaltado de adyacencia y Tooltips',
    textStyle: { color: '#F8FAFC', fontSize: 14, fontWeight: 'bold' },
    subtextStyle: { color: '#94A3B8', fontSize: 11 },
    top: 15,
    left: 20
  },
  tooltip: {
    trigger: 'item',
    backgroundColor: '#0F172A',
    borderColor: '#EA580C',
    borderWidth: 1.5,
    textStyle: { color: '#F8FAFC' },
    formatter: function (params) {
      if (params.dataType === 'node') {
        const cat = categories[params.data.category] ? categories[params.data.category].name : 'Nodo';
        return '<div style="font-weight:bold; color:#EA580C; font-size:13px; margin-bottom:4px;">' + params.data.name.replace('\\\\n', '<br>') + '</div>' +
               '<div style="font-size:11px; color:#94A3B8;">Rol: <span style="color:#FFF;">' + params.data.role + '</span></div>' +
               '<div style="font-size:11px; color:#94A3B8;">IP: <span style="color:#0284C7; font-weight:bold;">' + params.data.ip + '</span></div>' +
               '<div style="font-size:11px; color:#94A3B8;">Zona: <span style="color:#10B981;">' + cat + '</span></div>';
      } else if (params.dataType === 'edge') {
        return '<div style="font-weight:bold; color:#0284C7;">Enlace de Infraestructura:</div>' +
               '<div style="font-size:11px; color:#FFF;">' + params.data.source + ' ➔ ' + params.data.target + '</div>';
      }
    }
  },
  legend: {
    data: categories.map(function (a) { return a.name; }),
    textStyle: { color: '#CBD5E1', fontSize: 11, fontWeight: 'bold' },
    orient: 'horizontal',
    bottom: 12,
    left: 'center',
    itemGap: 20,
    icon: 'roundRect'
  },
  animationDuration: 1200,
  animationEasingUpdate: 'quinticInOut',
  series: [
    {
      name: 'Topología Milicic',
      type: 'graph',
      layout: 'none',
      data: nodes,
      links: links,
      categories: categories,
      roam: true,
      draggable: true,
      focusNodeAdjacency: true,
      zoom: 0.95,
      label: {
        show: true,
        position: 'bottom',
        color: '#F8FAFC',
        fontSize: 10,
        fontWeight: 'bold',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        padding: [3, 6],
        borderRadius: 4,
        distance: 5
      },
      edgeLabel: {
        fontSize: 9,
        color: '#94A3B8'
      },
      lineStyle: {
        curveness: 0.04,
        opacity: 0.85
      },
      emphasis: {
        focus: 'adjacency',
        lineStyle: {
          width: 5,
          opacity: 1
        }
      }
    }
  ]
};
`;

// =============================================================================
// ESTRUCTURA COMPLETA DEL DASHBOARD DE GRAFANA CON TARGETS CORREGIDOS
// =============================================================================
const dashboard = {
  title: "Topología de Red e Infraestructura Global SRO",
  uid: "milicic-network-topology",
  tags: ["milicic", "networking", "topology", "weathermap", "map", "core", "infrastructure"],
  timezone: "browser",
  schemaVersion: 40,
  time: { from: "now-3h", to: "now" },
  refresh: "30s",
  panels: [
    // -------------------------------------------------------------
    // ROW 0: ENCABEZADO BUSINESS TEXT / DYNAMIC TEXT (y: 0, h: 4)
    // -------------------------------------------------------------
    {
      id: 1,
      title: "Centro de Comando NOC - Topología de Red y Flujos Globales",
      type: "marcusolsson-dynamictext-panel",
      gridPos: { x: 0, y: 0, w: 24, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      options: {
        content: `
<div style="background: linear-gradient(90deg, #0F172A 0%, #1E293B 100%); border-left: 6px solid #EA580C; padding: 16px; border-radius: 8px; color: #F8FAFC;">
  <div style="display: flex; justify-content: space-between; align-items: center;">
    <div>
      <h2 style="margin: 0; color: #EA580C; font-size: 20px; font-weight: 700;">MILICIC S.A. | Network Operations Center (NOC) — Topología de Red</h2>
      <p style="margin: 4px 0 0 0; color: #94A3B8; font-size: 13px;">Supervisión Topológica Interactiva, Troncales de Fibra Óptica, Capa de Acceso y Clúster de Datacenter</p>
    </div>
    <div style="display: flex; gap: 12px;">
      <span style="background: #16A34A; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold;">🟢 TRONCALES 10G: OPERATIVO</span>
      <span style="background: #0284C7; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold;">🏢 PERÍMETRO WAN: OK</span>
      <span style="background: #D97706; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold;">⚡ UPS BACKUP: ONLINE</span>
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
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Dell N-Series: CPU usage 1m" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 1: KPI STAT CARDS CON MÉTRICAS REALES VERIFICADAS (y: 4, h: 4)
    // -------------------------------------------------------------
    {
      id: 2,
      title: "WAN TASA - Tráfico UP / DOWN",
      type: "stat",
      gridPos: { x: 0, y: 4, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "bps",
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#10B981", value: null },
              { color: "#F59E0B", value: 150000000 },
              { color: "#EF4444", value: 250000000 }
            ]
          },
          color: { mode: "thresholds" }
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "background",
        graphMode: "area"
      },
      targets: [
        {
          refId: "In",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "FTG_milicic_border1_SNMP" },
          item: { filter: "Interface port14(tasa): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "Out",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "FTG_milicic_border1_SNMP" },
          item: { filter: "Interface port14(tasa): Bits sent" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 3,
      title: "WAN Claro - Tráfico UP / DOWN",
      type: "stat",
      gridPos: { x: 4, y: 4, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "bps",
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#10B981", value: null },
              { color: "#F59E0B", value: 50000000 },
              { color: "#EF4444", value: 85000000 }
            ]
          },
          color: { mode: "thresholds" }
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "background",
        graphMode: "area"
      },
      targets: [
        {
          refId: "In",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "FTG_milicic_border1_SNMP" },
          item: { filter: "Interface port15(claro): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "Out",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "FTG_milicic_border1_SNMP" },
          item: { filter: "Interface port15(claro): Bits sent" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 4,
      title: "Inter-Core LAG 20G (Te1/0/20)",
      type: "stat",
      gridPos: { x: 8, y: 4, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "bps",
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#0284C7", value: null },
              { color: "#F59E0B", value: 5000000000 },
              { color: "#EF4444", value: 15000000000 }
            ]
          },
          color: { mode: "thresholds" }
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
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Interface Te1/0/20(Uplink_SW_Dell): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 5,
      title: "CORE01 (Dell N4032) - CPU Avg 1m",
      type: "stat",
      gridPos: { x: 12, y: 4, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "percent",
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#10B981", value: null },
              { color: "#F59E0B", value: 60 },
              { color: "#EF4444", value: 85 }
            ]
          },
          color: { mode: "thresholds" }
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
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Dell N-Series: CPU usage 1m" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 6,
      title: "CORE02 (Dell N4032) - CPU Avg 1m",
      type: "stat",
      gridPos: { x: 16, y: 4, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "percent",
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#10B981", value: null },
              { color: "#F59E0B", value: 60 },
              { color: "#EF4444", value: 85 }
            ]
          },
          color: { mode: "thresholds" }
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
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE02" },
          item: { filter: "Dell N-Series: CPU usage 1m" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 7,
      title: "UPS Emerson Core - Carga & Autonomía",
      type: "stat",
      gridPos: { x: 20, y: 4, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "percent",
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#10B981", value: null },
              { color: "#F59E0B", value: 60 },
              { color: "#EF4444", value: 85 }
            ]
          },
          color: { mode: "thresholds" }
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "background",
        graphMode: "area"
      },
      targets: [
        {
          refId: "Load",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "UPS SRO CORE" },
          item: { filter: "UPS Load (%)" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 2: EL MAPA TOPOLÓGICO INTERACTIVO ECHARTS (y: 8, h: 22)
    // -------------------------------------------------------------
    {
      id: 10,
      title: "Mapa Topológico de Infraestructura y Redes (NOC Interactivo)",
      type: "volkovlabs-echarts-panel",
      gridPos: { x: 0, y: 8, w: 24, h: 22 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      options: {
        getOption: echartsCode
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Dell N-Series: CPU usage 1m" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 3: TELEMETRÍA DE ANCHO DE BANDA EN TRONCALES (y: 30, h: 8)
    // -------------------------------------------------------------
    {
      id: 20,
      title: "Tráfico en Troncales de Fibra Óptica (RX / TX)",
      type: "timeseries",
      gridPos: { x: 0, y: 30, w: 16, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          custom: {
            drawStyle: "line",
            lineInterpolation: "smooth",
            lineWidth: 2,
            fillOpacity: 10,
            gradientMode: "opacity"
          },
          unit: "bps",
          color: { mode: "palette-classic" }
        }
      },
      options: {
        tooltip: { mode: "multi", sort: "desc" },
        legend: { displayMode: "table", placement: "right", calcs: ["lastNotNull", "max"] }
      },
      targets: [
        {
          refId: "Te1_0_6",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Interface Te1/0/6(UPLINK SW211): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "Te1_0_8",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Interface Te1/0/8(Uplink_Galpones): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "Te1_0_5",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Interface Te1/0/5(Uplink_edificio_viejo): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "Te1_0_20",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Interface Te1/0/20(Uplink_SW_Dell): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 21,
      title: "Utilización de Enlaces Troncales Clave",
      type: "gauge",
      gridPos: { x: 16, y: 30, w: 8, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "bps",
          min: 0,
          max: 10000000000,
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#10B981", value: null },
              { color: "#F59E0B", value: 5000000000 },
              { color: "#EF4444", value: 8500000000 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        showThresholdLabels: false,
        showThresholdMarkers: true
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Interface Te1/0/20(Uplink_SW_Dell): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "B",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Interface Te1/0/6(UPLINK SW211): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 4: INCIDENCIAS ACTIVAS DE RED EN VIVO (y: 38, h: 8)
    // -------------------------------------------------------------
    {
      id: 30,
      title: "Registro de Incidentes de Red Activos en Vivo (Zabbix Problems)",
      type: "table",
      gridPos: { x: 0, y: 38, w: 24, h: 8 },
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
              "timestamp": true
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
        }
      ],
      fieldConfig: {
        defaults: {
          custom: {
            align: "left",
            cellOptions: { type: "auto" },
            filterable: true,
            inspect: true
          }
        },
        overrides: [
          {
            matcher: { id: "byName", options: "Severidad" },
            properties: [
              { id: "custom.width", value: 150 },
              {
                id: "mappings",
                value: [
                  { type: "value", options: { "0": { text: "—", color: "text", index: 0 } } },
                  { type: "value", options: { "1": { text: "INFO", color: "#64748b", index: 1 } } },
                  { type: "value", options: { "2": { text: "ADVERTENCIA (P3)", color: "#FFC859", index: 2 } } },
                  { type: "value", options: { "3": { text: "PROMEDIO (P2)", color: "#FF9800", index: 3 } } },
                  { type: "value", options: { "4": { text: "ALTO (P1)", color: "#E45959", index: 4 } } },
                  { type: "value", options: { "5": { text: "DESASTRE (P1)", color: "#cc44ff", index: 5 } } }
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
                      pattern: ".*\"name\":\\s*\"([^\"]+)\".*",
                      result: {
                        text: "$1"
                      }
                    }
                  },
                  {
                    type: "regex",
                    options: {
                      pattern: ".*\"host\":\\s*\"([^\"]+)\".*",
                      result: {
                        text: "$1"
                      }
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
                  { type: "value", options: { "0": { text: "No", color: "#6b7280", index: 0 } } },
                  { type: "value", options: { "1": { text: "✓ Sí", color: "#16A34A", index: 1 } } }
                ]
              },
              { id: "custom.cellOptions", value: { type: "color-text" } }
            ]
          }
        ]
      },
      options: {
        sortBy: [{ displayName: "Severidad", desc: true }],
        frameIndex: 0,
        showHeader: true,
        footer: { show: false, reducer: ["sum"] }
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "5",
          group: { filter: "/(switch|router|FortiGate|FortiWorld)/" },
          options: {
            minSeverity: "1",
            showSuppressed: false
          }
        }
      ]
    }
  ]
};

// =============================================================================
// DESPLIEGUE A GRAFANA VÍA API HTTP
// =============================================================================
const payload = JSON.stringify({ dashboard, overwrite: true });

const req = http.request('http://172.27.210.154:3005/api/dashboards/db', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + grafanaToken,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    console.log('Grafana Status Code:', res.statusCode);
    console.log('Grafana API Response:', b);
  });
});

req.on('error', e => console.error('Error deploying dashboard:', e));
req.write(payload);
req.end();
