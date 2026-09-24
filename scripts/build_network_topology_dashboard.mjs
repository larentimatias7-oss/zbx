import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const DATASOURCE_UID = "efz4nzx8r30g0c";
const DATASOURCE_TYPE = "alexanderzobnin-zabbix-datasource";

// =============================================================================
// CÓDIGO JS DEL PANEL ECHARTS PARA EL MAPA TOPOLÓGICO INTERACTIVO
// =============================================================================
const echartsCode = `
// 1. Definición de Categorías Corporativas
const categories = [
  { name: 'WAN & Perímetro', itemStyle: { color: '#EA580C' } },
  { name: 'Core Switching', itemStyle: { color: '#0284C7' } },
  { name: 'Distribución & Acceso', itemStyle: { color: '#8B5CF6' } },
  { name: 'Cómputo & Storage', itemStyle: { color: '#10B981' } },
  { name: 'Energía Crítica (UPS)', itemStyle: { color: '#F59E0B' } },
  { name: 'Wi-Fi Corporativo Aruba', itemStyle: { color: '#06B6D4' } }
];

// 2. Definición de Nodos con Coordenadas Fijas de Alta Legibilidad
const nodes = [
  // --- WAN & PERÍMETRO ---
  { id: 'FTG_BORDER', name: 'FortiGate WAN\\n172.30.20.1', category: 0, symbolSize: 58, symbol: 'roundRect', x: 100, y: 120, ip: '172.30.20.1', role: 'Firewall Perímetro' },
  
  // --- CORE SWITCHING ---
  { id: 'CORE03', name: 'CORE03 (Aruba 1930)\\n172.30.20.211', category: 1, symbolSize: 52, symbol: 'rect', x: 340, y: 120, ip: '172.30.20.211', role: 'Core Switch Aruba' },
  { id: 'CORE01', name: 'CORE01 (Dell N4032)\\n172.30.20.201', category: 1, symbolSize: 56, symbol: 'rect', x: 550, y: 260, ip: '172.30.20.201', role: 'Core Switch 10G Master' },
  { id: 'CORE02', name: 'CORE02 (Dell N4032)\\n172.30.20.202', category: 1, symbolSize: 56, symbol: 'rect', x: 550, y: 500, ip: '172.30.20.202', role: 'Core Switch 10G Standby' },
  
  // --- EDIFICIO GRIS PB & ACCESO ---
  { id: 'ACC01_EG', name: 'ACC01 (Ed. Gris PB)\\n172.30.20.210', category: 2, symbolSize: 42, symbol: 'circle', x: 120, y: 310, ip: '172.30.20.210', role: 'Switch Acceso Ed. Gris' },
  { id: 'ACC02_EG', name: 'ACC02 (Ed. Gris PB)\\n172.30.20.217', category: 2, symbolSize: 42, symbol: 'circle', x: 120, y: 480, ip: '172.30.20.217', role: 'Switch Acceso Ed. Gris' },
  { id: 'VC_MASTER', name: 'AP Master VC\\n172.30.20.231', category: 5, symbolSize: 44, symbol: 'diamond', x: 330, y: 480, ip: '172.30.20.231', role: 'Aruba Virtual Controller Master' },

  // --- CÓMPUTO & STORAGE ---
  { id: 'ESX01', name: 'SRO-ESX01 (HPE DL380)\\n172.30.70.131', category: 3, symbolSize: 46, symbol: 'roundRect', x: 100, y: 720, ip: '172.30.70.131', role: 'Hypervisor VMware' },
  { id: 'ESX02', name: 'SRO-ESX02 (HPE DL380)\\n172.30.70.132', category: 3, symbolSize: 46, symbol: 'roundRect', x: 230, y: 720, ip: '172.30.70.132', role: 'Hypervisor VMware' },
  { id: 'STO01', name: 'SRO-STO01 (HPE MSA)\\n172.30.70.140', category: 3, symbolSize: 48, symbol: 'roundRect', x: 360, y: 720, ip: '172.30.70.140', role: 'Storage SAN SAN MSA 2060' },
  { id: 'VCENTER', name: 'vCenter Server\\n172.30.70.136', category: 3, symbolSize: 44, symbol: 'roundRect', x: 490, y: 720, ip: '172.30.70.136', role: 'Gestión VMware vCenter' },
  { id: 'DCO01', name: 'SRO-DCO01 (DC FSMO)\\n172.30.20.10', category: 3, symbolSize: 44, symbol: 'roundRect', x: 100, y: 880, ip: '172.30.20.10', role: 'Active Directory FSMO' },
  { id: 'SQL01', name: 'SRO-SQL01 (Database)\\n172.30.20.18', category: 3, symbolSize: 44, symbol: 'roundRect', x: 230, y: 880, ip: '172.30.20.18', role: 'Base de Datos SQL Server' },
  { id: 'BKP01', name: 'SRO-BKP01 (Veeam)\\n172.30.20.17', category: 3, symbolSize: 44, symbol: 'roundRect', x: 360, y: 880, ip: '172.30.20.17', role: 'Servidor Veeam Backup' },
  { id: 'ZBX', name: 'Zabbix Server\\n172.30.20.61', category: 3, symbolSize: 48, symbol: 'roundRect', x: 490, y: 880, ip: '172.30.20.61', role: 'Monitoreo Central Prod' },

  // --- ENERGÍA & FACILITIES (UPS) ---
  { id: 'UPS_EMERSON', name: 'UPS Emerson (Core)\\n172.30.20.80', category: 4, symbolSize: 48, symbol: 'triangle', x: 740, y: 920, ip: '172.30.20.80', role: 'UPS Emerson Liebert 10kVA' },
  { id: 'UPS_E02_P00', name: 'UPS Ed. Gris PB\\n172.30.20.81', category: 4, symbolSize: 46, symbol: 'triangle', x: 920, y: 920, ip: '172.30.20.81', role: 'UPS APC Smart-UPS 3kVA' },
  { id: 'UPS_E02_PA', name: 'UPS E02 PA\\n172.30.20.82', category: 4, symbolSize: 44, symbol: 'triangle', x: 740, y: 1080, ip: '172.30.20.82', role: 'UPS APC Smart-UPS 2kVA' },
  { id: 'UPS_G01', name: 'UPS Galpón 01\\n172.30.20.83', category: 4, symbolSize: 44, symbol: 'triangle', x: 920, y: 1080, ip: '172.30.20.83', role: 'UPS Eaton Galpón 01' },

  // --- ANEXO E03 & EDIFICIO BLANCO ---
  { id: 'D03', name: 'D03 (Edificio E03)\\n172.30.20.218', category: 2, symbolSize: 44, symbol: 'rect', x: 800, y: 640, ip: '172.30.20.218', role: 'Switch Aruba 1930 8G' },
  { id: 'D01', name: 'D01 (Ed. Blanco)\\n172.30.20.207', category: 2, symbolSize: 44, symbol: 'rect', x: 770, y: 470, ip: '172.30.20.207', role: 'Switch Troncal Edificio Blanco' },
  { id: 'AP_ADM', name: 'AP Administración\\n172.30.20.233', category: 5, symbolSize: 36, symbol: 'circle', x: 950, y: 450, ip: '172.30.20.233', role: 'Access Point Aruba' },
  { id: 'AP_REC', name: 'AP Recepción\\n172.30.20.232', category: 5, symbolSize: 36, symbol: 'circle', x: 950, y: 500, ip: '172.30.20.232', role: 'Access Point Aruba' },

  // --- GALPÓN 01 & RADIOENLACES ---
  { id: 'DIS01_G01', name: 'DIS01 (Galpón 01)\\n172.30.20.224', category: 2, symbolSize: 50, symbol: 'rect', x: 770, y: 170, ip: '172.30.20.224', role: 'Switch Distribución Galpón 01' },
  { id: 'ACC01_G01', name: 'ACC01 (G01 Port 3)\\n172.30.20.214', category: 2, symbolSize: 42, symbol: 'circle', x: 1040, y: 100, ip: '172.30.20.214', role: 'Switch Acceso Taller' },
  { id: 'ACC2_G01', name: 'ACC2 (G01 Port 24)\\n172.30.20.215', category: 2, symbolSize: 42, symbol: 'circle', x: 1040, y: 240, ip: '172.30.20.215', role: 'Switch Acceso Pañol' },
  { id: 'P2P_G06', name: 'P2P G06 (Ubiquiti)\\n172.30.20.240', category: 2, symbolSize: 38, symbol: 'diamond', x: 1250, y: 100, ip: '172.30.20.240', role: 'Radioenlace P2P Ubiquiti' },
  { id: 'POR_P2P01', name: 'POR-P2P01 (Portería)\\n172.30.20.241', category: 2, symbolSize: 38, symbol: 'diamond', x: 1250, y: 240, ip: '172.30.20.241', role: 'Radioenlace P2P Portería' },
  { id: 'AP_ABAST', name: 'AP Abastecimiento\\n172.30.20.234', category: 5, symbolSize: 36, symbol: 'circle', x: 1450, y: 100, ip: '172.30.20.234', role: 'Access Point Aruba' },
  { id: 'AP_PANOL', name: 'AP Pañol\\n172.30.20.235', category: 5, symbolSize: 36, symbol: 'circle', x: 1450, y: 240, ip: '172.30.20.235', role: 'Access Point Aruba' },

  // --- PARQUE WI-FI ARUBA ---
  { id: 'WIFI_CLUSTER', name: 'Clúster Wi-Fi Aruba\\n(14 APs AOS-8)', category: 5, symbolSize: 58, symbol: 'roundRect', x: 1420, y: 650, ip: '172.30.20.x', role: 'AOS-8 Virtual Controller Cluster' },
  { id: 'AP_DIR', name: 'AP Directorio\\n172.30.20.236', category: 5, symbolSize: 36, symbol: 'circle', x: 1250, y: 520, ip: '172.30.20.236', role: 'AP Ed. Blanco' },
  { id: 'AP_GER', name: 'AP Gerencias\\n172.30.20.237', category: 5, symbolSize: 36, symbol: 'circle', x: 1250, y: 780, ip: '172.30.20.237', role: 'AP Ed. Blanco' },
  { id: 'AP_AIMI', name: 'AP AIMI\\n172.30.20.238', category: 5, symbolSize: 36, symbol: 'circle', x: 1600, y: 520, ip: '172.30.20.238', role: 'AP Taller AIMI' },
  { id: 'AP_COMP', name: 'AP Compras\\n172.30.20.239', category: 5, symbolSize: 36, symbol: 'circle', x: 1600, y: 780, ip: '172.30.20.239', role: 'AP Ed. Gris' },
  { id: 'AP_COMED', name: 'AP Comedor\\n172.30.20.242', category: 5, symbolSize: 36, symbol: 'circle', x: 1420, y: 880, ip: '172.30.20.242', role: 'AP Comedor Principal' },
  { id: 'AP_CAS', name: 'AP CAS\\n172.30.20.243', category: 5, symbolSize: 36, symbol: 'circle', x: 1250, y: 880, ip: '172.30.20.243', role: 'AP CAS' }
];

// 3. Definición de Enlaces Físicos y Lógicos (Edges)
const links = [
  // Troncales Core
  { source: 'FTG_BORDER', target: 'CORE03', label: { show: true, formatter: 'WAN 1 Gbps' }, lineStyle: { width: 3.5, color: '#EA580C' } },
  { source: 'CORE03', target: 'CORE01', label: { show: true, formatter: 'Te1/0/6 (10G)' }, lineStyle: { width: 3.5, color: '#10B981' } },
  { source: 'CORE01', target: 'CORE02', label: { show: true, formatter: 'LAG Te1/0/20 (20G)' }, lineStyle: { width: 4.5, color: '#0284C7' } },
  { source: 'CORE01', target: 'DIS01_G01', label: { show: true, formatter: 'Te1/0/8 Fibra G01' }, lineStyle: { width: 3, color: '#10B981' } },
  { source: 'CORE01', target: 'D01', label: { show: true, formatter: 'Te1/0/5 Fibra E01' }, lineStyle: { width: 3, color: '#10B981' } },
  { source: 'CORE03', target: 'D03', label: { show: true, formatter: 'TRK1 Troncal E03' }, lineStyle: { width: 3, color: '#10B981' } },
  
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
  { source: 'DIS01_G01', target: 'ACC01_G01', label: { show: true, formatter: 'Port 3' }, lineStyle: { width: 2, color: '#10B981' } },
  { source: 'DIS01_G01', target: 'ACC2_G01', label: { show: true, formatter: 'Port 24' }, lineStyle: { width: 2, color: '#10B981' } },
  { source: 'ACC01_G01', target: 'P2P_G06', lineStyle: { width: 2, color: '#8B5CF6' } },
  { source: 'ACC2_G01', target: 'POR_P2P01', lineStyle: { width: 2, color: '#8B5CF6' } },
  { source: 'DIS01_G01', target: 'AP_ABAST', lineStyle: { width: 1.5, color: '#06B6D4' } },
  { source: 'DIS01_G01', target: 'AP_PANOL', lineStyle: { width: 1.5, color: '#06B6D4' } },

  // Edificio Blanco
  { source: 'D01', target: 'AP_ADM', lineStyle: { width: 1.5, color: '#06B6D4' } },
  { source: 'D01', target: 'AP_REC', lineStyle: { width: 1.5, color: '#06B6D4' } },

  // Clúster Wi-Fi Aruba
  { source: 'VC_MASTER', target: 'WIFI_CLUSTER', label: { show: true, formatter: 'AOS-8 Virtual Controller' }, lineStyle: { width: 3, type: 'dotted', color: '#06B6D4' } },
  { source: 'WIFI_CLUSTER', target: 'AP_DIR', lineStyle: { width: 1.5, type: 'dotted', color: '#06B6D4' } },
  { source: 'WIFI_CLUSTER', target: 'AP_GER', lineStyle: { width: 1.5, type: 'dotted', color: '#06B6D4' } },
  { source: 'WIFI_CLUSTER', target: 'AP_AIMI', lineStyle: { width: 1.5, type: 'dotted', color: '#06B6D4' } },
  { source: 'WIFI_CLUSTER', target: 'AP_COMP', lineStyle: { width: 1.5, type: 'dotted', color: '#06B6D4' } },
  { source: 'WIFI_CLUSTER', target: 'AP_COMED', lineStyle: { width: 1.5, type: 'dotted', color: '#06B6D4' } },
  { source: 'WIFI_CLUSTER', target: 'AP_CAS', lineStyle: { width: 1.5, type: 'dotted', color: '#06B6D4' } }
];

return {
  backgroundColor: '#0B0F19',
  title: {
    text: 'TOPOLOGÍA DE RED Y TELEMETRÍA GLOBAL (SRO)',
    subtext: 'Navegación interactiva con zoom, selección de nodos y estado en tiempo real',
    textStyle: { color: '#F8FAFC', fontSize: 14, fontWeight: 'bold' },
    subtextStyle: { color: '#94A3B8', fontSize: 11 },
    top: 10,
    left: 15
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
               '<div style="font-size:11px; color:#94A3B8;">IP: <span style="color:#0284C7;">' + params.data.ip + '</span></div>' +
               '<div style="font-size:11px; color:#94A3B8;">Categoría: <span style="color:#10B981;">' + cat + '</span></div>';
      } else if (params.dataType === 'edge') {
        return '<div style="font-weight:bold; color:#0284C7;">Enlace de Red:</div>' +
               '<div style="font-size:11px; color:#FFF;">' + params.data.source + ' ➔ ' + params.data.target + '</div>';
      }
    }
  },
  legend: {
    data: categories.map(function (a) { return a.name; }),
    textStyle: { color: '#94A3B8', fontSize: 11 },
    top: 10,
    right: 20
  },
  animationDuration: 1500,
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
      label: {
        show: true,
        position: 'bottom',
        color: '#F8FAFC',
        fontSize: 10.5,
        fontWeight: 'bold',
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        padding: [3, 6],
        borderRadius: 4
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
          width: 6,
          opacity: 1
        }
      }
    }
  ]
};
`;

// =============================================================================
// ESTRUCTURA COMPLETA DEL DASHBOARD DE GRAFANA
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
          group: { filter: "firewall" },
          host: { filter: "FTG_milicic_border1_SNMP" },
          item: { filter: "ICMP ping" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 1: KPI STAT CARDS RESUMEN DE ENLACES CORE (y: 4, h: 4)
    // -------------------------------------------------------------
    {
      id: 2,
      title: "WAN Perímetro - Tráfico UP (In)",
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
              { color: "#F59E0B", value: 300000000 },
              { color: "#EF4444", value: 800000000 }
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
          group: { filter: "firewall" },
          host: { filter: "FTG_milicic_border1_SNMP" },
          item: { filter: "/.*Bits received.*port1.*/" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 3,
      title: "WAN Perímetro - Tráfico DOWN (Out)",
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
              { color: "#F59E0B", value: 300000000 },
              { color: "#EF4444", value: 800000000 }
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
          group: { filter: "firewall" },
          host: { filter: "FTG_milicic_border1_SNMP" },
          item: { filter: "/.*Bits sent.*port1.*/" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 4,
      title: "Inter-Core LAG (Te1/0/20) - Tráfico",
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
          item: { filter: "/.*Bits received.*Te1\\/0\\/20.*/" },
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
      title: "UPS Emerson Core - Carga Inversor",
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
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "facilities" },
          host: { filter: "UPS_Emerson" },
          item: { filter: "/.*Load.*/" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 2: EL MAPA TOPOLÓGICO INTERACTIVO ECHARTS (y: 8, h: 18)
    // -------------------------------------------------------------
    {
      id: 10,
      title: "Mapa Topológico de Infraestructura y Redes (NOC Interactivo)",
      type: "volkovlabs-echarts-panel",
      gridPos: { x: 0, y: 8, w: 24, h: 18 },
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
          item: { filter: "ICMP ping" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 3: TELEMETRÍA DE ANCHO DE BANDA EN TRONCALES (y: 26, h: 8)
    // -------------------------------------------------------------
    {
      id: 20,
      title: "Tráfico en Troncales de Fibra Óptica (RX / TX)",
      type: "timeseries",
      gridPos: { x: 0, y: 26, w: 16, h: 8 },
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
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "/.*Bits (received|sent).*Te1\\/0\\/6.*/" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "B",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "/.*Bits (received|sent).*Te1\\/0\\/8.*/" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "C",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "/.*Bits (received|sent).*Te1\\/0\\/5.*/" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 21,
      title: "Utilización de Enlaces Troncales Clave",
      type: "gauge",
      gridPos: { x: 16, y: 26, w: 8, h: 8 },
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
          item: { filter: "/.*Bits received.*Te1\\/0\\/20.*/" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "B",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "/.*Bits received.*Te1\\/0\\/6.*/" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 4: INCIDENCIAS ACTIVAS DE RED EN VIVO (y: 34, h: 8)
    // -------------------------------------------------------------
    {
      id: 30,
      title: "Registro de Incidentes de Red Activos en Vivo (Zabbix Problems)",
      type: "table",
      gridPos: { x: 0, y: 34, w: 24, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          custom: { align: "auto", displayMode: "auto", inspect: true },
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "green", value: null },
              { color: "red", value: 80 }
            ]
          }
        },
        overrides: [
          {
            matcher: { id: "byName", options: "severity" },
            properties: [
              {
                id: "custom.displayMode",
                value: "color-background-nested"
              },
              {
                id: "mappings",
                value: [
                  { type: "value", options: { "Disaster": { color: "#E02F44", text: "DISASTER (P1)" } } },
                  { type: "value", options: { "High": { color: "#FF780A", text: "HIGH (P1)" } } },
                  { type: "value", options: { "Average": { color: "#EAB839", text: "AVERAGE (P2)" } } },
                  { type: "value", options: { "Warning": { color: "#FADE2A", text: "WARNING (P3)" } } },
                  { type: "value", options: { "Information": { color: "#5794F2", text: "INFO" } } }
                ]
              }
            ]
          }
        ]
      },
      transformations: [
        {
          id: "extractFields",
          options: { source: "Problems" }
        },
        {
          id: "organize",
          options: {
            excludeByName: {
              "Problems": true,
              "Time": true,
              "eventid": true,
              "objectid": true
            },
            indexByName: {
              "severity": 0,
              "host": 1,
              "name": 2,
              "acknowledged": 3,
              "age": 4
            },
            renameByName: {
              "severity": "Severidad",
              "host": "Dispositivo",
              "name": "Problema / Incidente",
              "acknowledged": "Reconocido",
              "age": "Tiempo Activo"
            }
          }
        }
      ],
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "5",
          group: { filter: "/(switch|router|firewall)/" },
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
