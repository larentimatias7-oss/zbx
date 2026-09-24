import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken || grafanaToken.length < 10) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const DATASOURCE_UID = "efz4nzx8r30g0c";
const DATASOURCE_TYPE = "alexanderzobnin-zabbix-datasource";

// =============================================================================
// ECHARTS CODE FOR THE CAMPUS SRO ARCHITECTURAL WEATHERMAP
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

function formatBps(val) {
  if (val === null || val === undefined || isNaN(val)) return '0 bps';
  if (val >= 1000000000) return (val / 1000000000).toFixed(2) + ' Gbps';
  if (val >= 1000000) return (val / 1000000).toFixed(1) + ' Mbps';
  if (val >= 1000) return (val / 1000).toFixed(0) + ' kbps';
  return val.toFixed(0) + ' bps';
}

// 2. Extraer telemetría en vivo
const g01Rx = getLast('G01_RX', 36550000);
const g01Tx = getLast('G01_TX', 72720000);
const blancoRx = getLast('Blanco_RX', 247000);
const blancoTx = getLast('Blanco_TX', 159000);
const e03Rx = getLast('E03_RX', 65270000);
const e03Tx = getLast('E03_TX', 12390000);
const lagRx = getLast('LAG_RX', 410000);
const lagTx = getLast('LAG_TX', 37290000);
const uplink1930Rx = getLast('Uplink1930_RX', 218900000);
const uplink1930Tx = getLast('Uplink1930_TX', 44010000);
const upsWatts = getLast('UPS_W', 2080);
const upsLoad = getLast('UPS_Load', 23);
const upsMin = getLast('UPS_Min', 116);

// 3. Definición de Categorías Visuales
const categories = [
  { name: 'Zonas Arquitectónicas', itemStyle: { color: 'rgba(30, 41, 59, 0.4)' } },
  { name: 'Core & Switching 10G', itemStyle: { color: '#0284C7' } },
  { name: 'Cómputo & Storage SAN', itemStyle: { color: '#10B981' } },
  { name: 'Energía & UPS Liebert', itemStyle: { color: '#F59E0B' } },
  { name: 'Distribución & Sedes', itemStyle: { color: '#8B5CF6' } },
  { name: 'Wi-Fi & Radioenlaces', itemStyle: { color: '#06B6D4' } },
  { name: 'Perímetro & WAN Fortinet', itemStyle: { color: '#EA580C' } }
];

// 4. Nodos de Planta / Arquitectura Física Campus SRO
const nodes = [
  // --- EDIFICIO GRIS PB: DATACENTER CORE & WAN ---
  {
    id: 'FTG',
    name: 'FortiGate 200F\\n(Perímetro WAN)\\n172.30.20.1',
    category: 6,
    x: 80,
    y: 120,
    symbolSize: 65,
    symbol: 'roundRect',
    itemStyle: { color: '#EA580C', borderColor: '#FB923C', borderWidth: 2, shadowBlur: 10, shadowColor: 'rgba(234,88,12,0.5)' },
    label: { show: true, color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
    tooltip: '<b>FortiGate 200F WAN Gateway</b><br/>IP: 172.30.20.1<br/>Uplink TASA (port14) & Claro (port15)<br/>BGP Core & VPN IPsec SD-WAN'
  },
  {
    id: 'CORE03',
    name: 'CORE03\\n(Aruba 1930 24G)\\n172.30.20.211',
    category: 1,
    x: 230,
    y: 120,
    symbolSize: 60,
    symbol: 'roundRect',
    itemStyle: { color: '#0284C7', borderColor: '#38BDF8', borderWidth: 2 },
    label: { show: true, color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
    tooltip: '<b>Switch CORE03 (Aruba Instant On 1930)</b><br/>IP: 172.30.20.211<br/>Uplink Te1/0/6 desde CORE01<br/>Downlink TRK1 a Edificio E03'
  },
  {
    id: 'CORE01',
    name: 'CORE01 Dell N4032\\n(Master 10G)\\n172.30.20.201',
    category: 1,
    x: 140,
    y: 250,
    symbolSize: 85,
    symbol: 'roundRect',
    itemStyle: { color: '#0284C7', borderColor: '#38BDF8', borderWidth: 3, shadowBlur: 15, shadowColor: 'rgba(2,132,199,0.7)' },
    label: { show: true, color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
    tooltip: '<b>Switch CORE01 (Dell Networking N4032)</b><br/>IP: 172.30.20.201 | Master Stack 10G<br/>Distribuidor troncal de fibra a todo el predio'
  },
  {
    id: 'CORE02',
    name: 'CORE02 Dell N4032\\n(Standby 10G)\\n172.30.20.202',
    category: 1,
    x: 320,
    y: 250,
    symbolSize: 75,
    symbol: 'roundRect',
    itemStyle: { color: '#0284C7', borderColor: '#38BDF8', borderWidth: 2 },
    label: { show: true, color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
    tooltip: '<b>Switch CORE02 (Dell Networking N4032)</b><br/>IP: 172.30.20.202 | Standby Stack 10G<br/>Enlace LAG 20G redundante'
  },
  {
    id: 'ACC01_EG',
    name: 'ACC01 Ed. Gris PB\\n(Aruba 1930 24G)\\n172.30.20.210',
    category: 4,
    x: 80,
    y: 380,
    symbolSize: 55,
    symbol: 'roundRect',
    itemStyle: { color: '#334155', borderColor: '#64748B', borderWidth: 1.5 },
    label: { show: true, color: '#F8FAFC', fontSize: 10 },
    tooltip: '<b>Switch ACC01 (Edificio Gris PB)</b><br/>IP: 172.30.20.210'
  },
  {
    id: 'VC_MASTER',
    name: 'Aruba VC Master\\n(APs Clúster SRO)\\n172.30.20.231',
    category: 5,
    x: 230,
    y: 380,
    symbolSize: 55,
    symbol: 'circle',
    itemStyle: { color: '#0891B2', borderColor: '#22D3EE', borderWidth: 2 },
    label: { show: true, color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
    tooltip: '<b>Virtual Controller Aruba AOS-8</b><br/>IP Clúster: 172.30.20.231<br/>14 Puntos de Acceso integrados'
  },

  // --- CLÚSTER CÓMPUTO & SAN STORAGE (DATACENTER GRIS) ---
  {
    id: 'ESX01',
    name: 'HPE DL380 ESX01\\n172.30.70.131',
    category: 2,
    x: 80,
    y: 520,
    symbolSize: 60,
    symbol: 'roundRect',
    itemStyle: { color: '#059669', borderColor: '#10B981', borderWidth: 2 },
    label: { show: true, color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
    tooltip: '<b>Nodo Virtualización HPE ProLiant DL380 Gen10</b><br/>IP: 172.30.70.131<br/>VMware ESXi Clúster HA'
  },
  {
    id: 'ESX02',
    name: 'HPE DL380 ESX02\\n172.30.70.132',
    category: 2,
    x: 220,
    y: 520,
    symbolSize: 60,
    symbol: 'roundRect',
    itemStyle: { color: '#059669', borderColor: '#10B981', borderWidth: 2 },
    label: { show: true, color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
    tooltip: '<b>Nodo Virtualización HPE ProLiant DL380 Gen10</b><br/>IP: 172.30.70.132<br/>VMware ESXi Clúster HA'
  },
  {
    id: 'STO01',
    name: 'HPE MSA 2060 SAN\\n(Datastores SSD+HDD)\\n172.30.70.140',
    category: 2,
    x: 150,
    y: 630,
    symbolSize: 70,
    symbol: 'roundRect',
    itemStyle: { color: '#0284C7', borderColor: '#38BDF8', borderWidth: 2.5, shadowBlur: 10, shadowColor: 'rgba(2,132,199,0.5)' },
    label: { show: true, color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
    tooltip: '<b>Storage Central HPE MSA 2060 SAN</b><br/>IP: 172.30.70.140<br/>Pools RAID5 SSD Tier + HDD SAS'
  },
  {
    id: 'VMS',
    name: 'Servidores Vitales DC\\nAD FSMO | SQL | Veeam\\nZabbix 7.0 Server',
    category: 2,
    x: 310,
    y: 580,
    symbolSize: 65,
    symbol: 'roundRect',
    itemStyle: { color: '#1E293B', borderColor: '#64748B', borderWidth: 1.5 },
    label: { show: true, color: '#CBD5E1', fontSize: 9 },
    tooltip: '<b>Infraestructura de Servidores Centrales:</b><br/>• SRO-DCO01 (Active Directory & DNS)<br/>• SRO-SQL01 (Database Engine)<br/>• SRO-BKP01 (Veeam Backup Repository)<br/>• Zabbix 7.0 LTS Server (172.30.20.61)'
  },

  // --- SALA DE ENERGÍA Y BANCOS UPS ---
  {
    id: 'UPS_EMERSON',
    name: 'UPS Liebert 10 kVA\\nPotencia: ' + (upsWatts / 1000).toFixed(2) + ' kW\\nCarga: ' + upsLoad + '% | ' + upsMin + ' min',
    category: 3,
    x: 480,
    y: 520,
    symbolSize: 75,
    symbol: 'roundRect',
    itemStyle: { color: '#D97706', borderColor: '#FBBF24', borderWidth: 2.5, shadowBlur: 12, shadowColor: 'rgba(217,119,6,0.6)' },
    label: { show: true, color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
    tooltip: '<b>UPS Emerson Liebert GXT4 (Core DC)</b><br/>Potencia Activa: ' + upsWatts + ' W<br/>Carga: ' + upsLoad + '% | Autonomía: ' + upsMin + ' min'
  },
  {
    id: 'UPS_EG',
    name: 'UPS Ed. Gris PB\\n(APC 3kVA)',
    category: 3,
    x: 430,
    y: 630,
    symbolSize: 50,
    symbol: 'roundRect',
    itemStyle: { color: '#475569', borderColor: '#94A3B8', borderWidth: 1 },
    label: { show: true, color: '#F8FAFC', fontSize: 9 },
    tooltip: '<b>UPS APC Smart-UPS 3000VA</b><br/>Edificio Gris Planta Baja'
  },
  {
    id: 'UPS_E02',
    name: 'UPS Ed. E02 PA\\n(APC 2kVA)',
    category: 3,
    x: 540,
    y: 630,
    symbolSize: 50,
    symbol: 'roundRect',
    itemStyle: { color: '#475569', borderColor: '#94A3B8', borderWidth: 1 },
    label: { show: true, color: '#F8FAFC', fontSize: 9 },
    tooltip: '<b>UPS APC Smart-UPS 2000VA</b><br/>Edificio E02 Planta Alta'
  },

  // --- EDIFICIO BLANCO (ADMINISTRACIÓN) ---
  {
    id: 'D01',
    name: 'Switch D01 (Blanco)\\n(Aruba 2530 24G)\\n172.30.20.207',
    category: 4,
    x: 560,
    y: 150,
    symbolSize: 75,
    symbol: 'roundRect',
    itemStyle: { color: '#0284C7', borderColor: '#38BDF8', borderWidth: 2.5, shadowBlur: 10, shadowColor: 'rgba(2,132,199,0.5)' },
    label: { show: true, color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
    tooltip: '<b>Switch D01 (Edificio Blanco Administración)</b><br/>IP: 172.30.20.207<br/>Troncal Fibra Te1/0/5 desde CORE01<br/>Tráfico: ' + formatBps(blancoRx) + ' RX | ' + formatBps(blancoTx) + ' TX'
  },
  {
    id: 'APS_BLANCO',
    name: 'APs Edificio Blanco\\nAdmin | Presidencia\\nDirectorio | Recepción',
    category: 5,
    x: 720,
    y: 150,
    symbolSize: 65,
    symbol: 'circle',
    itemStyle: { color: '#0891B2', borderColor: '#22D3EE', borderWidth: 2 },
    label: { show: true, color: '#FFFFFF', fontSize: 10 },
    tooltip: '<b>Wi-Fi Edificio Blanco (AOS-8):</b><br/>• AP Administración (172.30.20.233)<br/>• AP Recepción (172.30.20.232)<br/>• AP Sala Directorio (172.30.20.236)<br/>• AP Gerencias & Presidencia (172.30.20.237)'
  },

  // --- GALPÓN 01 (LOGÍSTICA, PAÑOL & TALLERES) ---
  {
    id: 'DIS01',
    name: 'Switch DIS01 (G01)\\n(HP Comware 5120)\\n172.30.20.224',
    category: 4,
    x: 560,
    y: 340,
    symbolSize: 80,
    symbol: 'roundRect',
    itemStyle: { color: '#7C3AED', borderColor: '#A78BFA', borderWidth: 3, shadowBlur: 12, shadowColor: 'rgba(124,58,237,0.6)' },
    label: { show: true, color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
    tooltip: '<b>Switch Distribución DIS01 (Galpón 01)</b><br/>IP: 172.30.20.224<br/>Troncal Fibra Te1/0/8 desde CORE01<br/>Tráfico: ' + formatBps(g01Rx) + ' RX | ' + formatBps(g01Tx) + ' TX'
  },
  {
    id: 'ACC01_G',
    name: 'ACC01 Taller Mecánico\\n172.30.20.214',
    category: 4,
    x: 720,
    y: 280,
    symbolSize: 55,
    symbol: 'roundRect',
    itemStyle: { color: '#334155', borderColor: '#64748B', borderWidth: 1.5 },
    label: { show: true, color: '#F8FAFC', fontSize: 10 },
    tooltip: '<b>Switch ACC01 (Taller Mecánico)</b><br/>IP: 172.30.20.214'
  },
  {
    id: 'ACC2_G',
    name: 'ACC2 Pañol Central\\n172.30.20.215',
    category: 4,
    x: 720,
    y: 380,
    symbolSize: 55,
    symbol: 'roundRect',
    itemStyle: { color: '#334155', borderColor: '#64748B', borderWidth: 1.5 },
    label: { show: true, color: '#F8FAFC', fontSize: 10 },
    tooltip: '<b>Switch ACC2 (Pañol Central)</b><br/>IP: 172.30.20.215'
  },
  {
    id: 'P2P_G06',
    name: 'Radioenlaces P2P\\nUbiquiti G06 & Portería',
    category: 5,
    x: 860,
    y: 340,
    symbolSize: 60,
    symbol: 'circle',
    itemStyle: { color: '#0891B2', borderColor: '#22D3EE', borderWidth: 2 },
    label: { show: true, color: '#FFFFFF', fontSize: 10 },
    tooltip: '<b>Radioenlaces P2P Ubiquiti AirMax:</b><br/>• P2P G06 (172.30.20.240)<br/>• POR-P2P01 Portería Principal (172.30.20.241)'
  },
  {
    id: 'UPS_G01',
    name: 'UPS Galpón 01\\n(Eaton 172.30.20.83)',
    category: 3,
    x: 650,
    y: 440,
    symbolSize: 50,
    symbol: 'roundRect',
    itemStyle: { color: '#475569', borderColor: '#94A3B8', borderWidth: 1 },
    label: { show: true, color: '#F8FAFC', fontSize: 9 },
    tooltip: '<b>UPS Eaton Galpón 01</b><br/>IP: 172.30.20.83'
  },

  // --- EDIFICIO E03 (OFICINAS TÉCNICAS & TALLER) ---
  {
    id: 'D03',
    name: 'Switch D03 (Ed. E03)\\n(Aruba 1930 8G)\\n172.30.20.218',
    category: 4,
    x: 740,
    y: 540,
    symbolSize: 75,
    symbol: 'roundRect',
    itemStyle: { color: '#059669', borderColor: '#34D399', borderWidth: 2.5, shadowBlur: 10, shadowColor: 'rgba(5,150,105,0.5)' },
    label: { show: true, color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
    tooltip: '<b>Switch D03 (Edificio E03 Oficinas Técnicas)</b><br/>IP: 172.30.20.218<br/>Troncal TRK1 desde CORE03<br/>Tráfico: ' + formatBps(e03Rx) + ' RX | ' + formatBps(e03Tx) + ' TX'
  },
  {
    id: 'E03_USERS',
    name: 'Puestos Técnicos E03\\nCableado Cat6A & APs Taller',
    category: 5,
    x: 880,
    y: 540,
    symbolSize: 60,
    symbol: 'circle',
    itemStyle: { color: '#059669', borderColor: '#6EE7B7', borderWidth: 1.5 },
    label: { show: true, color: '#ECFDF5', fontSize: 9 },
    tooltip: '<b>Puestos de Trabajo y Oficinas E03:</b><br/>• Cableado Estructurado Cat6A<br/>• AP Oficina Taller PA & PB'
  }
];

// 5. Enlaces Físicos y Troncales de Fibra con Tráfico en Tiempo Real
const links = [
  // Inter-Core LAG 20G
  {
    source: 'CORE01',
    target: 'CORE02',
    lineStyle: { width: 5, color: '#38BDF8', curveness: 0.1 },
    label: { show: true, formatter: 'LAG 20G Inter-Core\\n' + formatBps(lagRx) + ' ↓ / ' + formatBps(lagTx) + ' ↑', fontSize: 10, color: '#38BDF8', backgroundColor: 'rgba(15,23,42,0.85)', padding: [3, 6], borderRadius: 4 },
    tooltip: '<b>LAG 20G Te1/0/20 (Inter-Core Switching)</b><br/>RX: ' + formatBps(lagRx) + '<br/>TX: ' + formatBps(lagTx)
  },
  // CORE01 <--> CORE03 Uplink
  {
    source: 'CORE01',
    target: 'CORE03',
    lineStyle: { width: 4, color: '#0284C7', curveness: 0.1 },
    label: { show: true, formatter: 'Te1/0/6 Uplink\\n' + formatBps(uplink1930Rx) + ' ↓', fontSize: 9, color: '#7DD3FC', backgroundColor: 'rgba(15,23,42,0.85)', padding: [2, 5], borderRadius: 4 },
    tooltip: '<b>Uplink Te1/0/6 hacia CORE03</b><br/>RX: ' + formatBps(uplink1930Rx) + '<br/>TX: ' + formatBps(uplink1930Tx)
  },
  // CORE01 <--> FTG Perímetro WAN
  {
    source: 'CORE01',
    target: 'FTG',
    lineStyle: { width: 4, color: '#EA580C', curveness: -0.1 },
    label: { show: true, formatter: 'Perímetro WAN', fontSize: 10, color: '#FDBA74', backgroundColor: 'rgba(15,23,42,0.85)', padding: [2, 5], borderRadius: 4 },
    tooltip: '<b>Enlace Gateway Perimetral FortiGate 200F</b>'
  },
  // CORE01 <--> ACC01 Ed. Gris
  {
    source: 'CORE01',
    target: 'ACC01_EG',
    lineStyle: { width: 2.5, color: '#64748B', curveness: 0.1 },
    label: { show: false }
  },
  // CORE01 <--> Clúster Virtual Controller Aruba
  {
    source: 'CORE01',
    target: 'VC_MASTER',
    lineStyle: { width: 2.5, color: '#06B6D4', curveness: 0.1 },
    label: { show: false }
  },
  // CORE01 <--> ESX01 & ESX02
  {
    source: 'CORE01',
    target: 'ESX01',
    lineStyle: { width: 3.5, color: '#10B981', curveness: 0.1 },
    label: { show: true, formatter: '10G SAN', fontSize: 9, color: '#6EE7B7', backgroundColor: 'rgba(15,23,42,0.85)', padding: [2, 4], borderRadius: 3 }
  },
  {
    source: 'CORE01',
    target: 'ESX02',
    lineStyle: { width: 3.5, color: '#10B981', curveness: 0.1 },
    label: { show: true, formatter: '10G SAN', fontSize: 9, color: '#6EE7B7', backgroundColor: 'rgba(15,23,42,0.85)', padding: [2, 4], borderRadius: 3 }
  },
  // ESX Nodes <--> HPE MSA 2060
  {
    source: 'ESX01',
    target: 'STO01',
    lineStyle: { width: 3, color: '#38BDF8', curveness: 0.05 },
    label: { show: false }
  },
  {
    source: 'ESX02',
    target: 'STO01',
    lineStyle: { width: 3, color: '#38BDF8', curveness: -0.05 },
    label: { show: false }
  },
  // ESX Nodes <--> VMs
  {
    source: 'ESX01',
    target: 'VMS',
    lineStyle: { width: 2, color: '#64748B', type: 'dashed' },
    label: { show: false }
  },
  {
    source: 'ESX02',
    target: 'VMS',
    lineStyle: { width: 2, color: '#64748B', type: 'dashed' },
    label: { show: false }
  },

  // --- TRONCALES DE FIBRA ÓPTICA INTER-EDIFICIOS ---
  // Troncal Edificio Blanco (Te1/0/5)
  {
    source: 'CORE01',
    target: 'D01',
    lineStyle: { width: 4.5, color: '#0284C7', curveness: 0.15 },
    label: {
      show: true,
      formatter: 'Troncal Edificio Blanco (Te1/0/5)\\n' + formatBps(blancoRx) + ' ↓ / ' + formatBps(blancoTx) + ' ↑',
      fontSize: 10,
      fontWeight: 'bold',
      color: '#38BDF8',
      backgroundColor: 'rgba(15,23,42,0.9)',
      padding: [4, 8],
      borderRadius: 4,
      borderColor: '#0284C7',
      borderWidth: 1
    },
    tooltip: '<b>Troncal Fibra Edificio Blanco (Te1/0/5)</b><br/>Uplink directo desde CORE01<br/>RX: ' + formatBps(blancoRx) + '<br/>TX: ' + formatBps(blancoTx)
  },
  // Switch D01 <--> APs Blanco
  {
    source: 'D01',
    target: 'APS_BLANCO',
    lineStyle: { width: 2.5, color: '#22D3EE' },
    label: { show: false }
  },

  // Troncal Galpón 01 (Te1/0/8)
  {
    source: 'CORE01',
    target: 'DIS01',
    lineStyle: { width: 5, color: '#8B5CF6', curveness: 0.1 },
    label: {
      show: true,
      formatter: 'Troncal Galpón 01 (Te1/0/8)\\n' + formatBps(g01Rx) + ' ↓ / ' + formatBps(g01Tx) + ' ↑',
      fontSize: 10,
      fontWeight: 'bold',
      color: '#C084FC',
      backgroundColor: 'rgba(15,23,42,0.9)',
      padding: [4, 8],
      borderRadius: 4,
      borderColor: '#7C3AED',
      borderWidth: 1
    },
    tooltip: '<b>Troncal Fibra Galpón 01 (Te1/0/8)</b><br/>Enlace de distribución a Logística, Pañol y Talleres<br/>RX: ' + formatBps(g01Rx) + '<br/>TX: ' + formatBps(g01Tx)
  },
  // Switch DIS01 <--> ACC01 & ACC2 & P2P
  {
    source: 'DIS01',
    target: 'ACC01_G',
    lineStyle: { width: 2.5, color: '#64748B', curveness: 0.05 },
    label: { show: true, formatter: 'Port 3', fontSize: 9, color: '#94A3B8' }
  },
  {
    source: 'DIS01',
    target: 'ACC2_G',
    lineStyle: { width: 2.5, color: '#64748B', curveness: -0.05 },
    label: { show: true, formatter: 'Port 24', fontSize: 9, color: '#94A3B8' }
  },
  {
    source: 'DIS01',
    target: 'P2P_G06',
    lineStyle: { width: 3, color: '#06B6D4', curveness: 0.05 },
    label: { show: true, formatter: 'P2P Links', fontSize: 9, color: '#22D3EE' }
  },
  {
    source: 'DIS01',
    target: 'UPS_G01',
    lineStyle: { width: 1.5, color: '#F59E0B', type: 'dotted' },
    label: { show: false }
  },

  // Troncal Edificio E03 (TRK1 desde CORE03)
  {
    source: 'CORE03',
    target: 'D03',
    lineStyle: { width: 4.5, color: '#10B981', curveness: 0.25 },
    label: {
      show: true,
      formatter: 'Troncal Edificio E03 (TRK1)\\n' + formatBps(e03Rx) + ' ↓ / ' + formatBps(e03Tx) + ' ↑',
      fontSize: 10,
      fontWeight: 'bold',
      color: '#34D399',
      backgroundColor: 'rgba(15,23,42,0.9)',
      padding: [4, 8],
      borderRadius: 4,
      borderColor: '#059669',
      borderWidth: 1
    },
    tooltip: '<b>Troncal Fibra Edificio E03 (TRK1)</b><br/>Alimentación desde CORE03 (Aruba 1930)<br/>RX: ' + formatBps(e03Rx) + '<br/>TX: ' + formatBps(e03Tx)
  },
  // Switch D03 <--> Puestos Técnicos E03
  {
    source: 'D03',
    target: 'E03_USERS',
    lineStyle: { width: 2.5, color: '#6EE7B7' },
    label: { show: false }
  },

  // UPS Emerson <--> CORE01 & Datacenter
  {
    source: 'UPS_EMERSON',
    target: 'CORE01',
    lineStyle: { width: 2, color: '#F59E0B', type: 'dashed', curveness: 0.1 },
    label: { show: false }
  },
  {
    source: 'UPS_EMERSON',
    target: 'STO01',
    lineStyle: { width: 2, color: '#F59E0B', type: 'dashed', curveness: 0.1 },
    label: { show: false }
  }
];

return {
  backgroundColor: '#0A0F1D',
  title: {
    text: 'PLANO DE PLANTA Y WEATHERMAP: CAMPUS CENTRAL SRO (MILICIC S.A.)',
    subtext: '4 Edificios Interconectados | Telemetría en Vivo de Troncales de Fibra Óptica, Clúster 10G y Respaldo UPS',
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
      if (params.data && params.data.tooltip) {
        return params.data.tooltip;
      }
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
    // Marco Edificio Gris PB (Datacenter & Cómputo)
    {
      type: 'rect',
      left: 40,
      top: 75,
      shape: { width: 350, height: 600, r: 8 },
      style: { fill: 'rgba(15, 23, 42, 0.55)', stroke: '#0284C7', lineWidth: 1.5 }
    },
    {
      type: 'text',
      left: 55,
      top: 85,
      style: { text: '🏢 EDIFICIO GRIS PB (Datacenter Core & Cómputo)', fill: '#38BDF8', font: 'bold 11px sans-serif' }
    },
    // Marco Edificio Blanco (Administración)
    {
      type: 'rect',
      left: 510,
      top: 75,
      shape: { width: 280, height: 160, r: 8 },
      style: { fill: 'rgba(15, 23, 42, 0.55)', stroke: '#38BDF8', lineWidth: 1.5 }
    },
    {
      type: 'text',
      left: 525,
      top: 85,
      style: { text: '🏛️ EDIFICIO BLANCO (Administración)', fill: '#7DD3FC', font: 'bold 11px sans-serif' }
    },
    // Marco Galpón 01 (Logística, Pañol & Talleres)
    {
      type: 'rect',
      left: 510,
      top: 255,
      shape: { width: 420, height: 215, r: 8 },
      style: { fill: 'rgba(15, 23, 42, 0.55)', stroke: '#7C3AED', lineWidth: 1.5 }
    },
    {
      type: 'text',
      left: 525,
      top: 265,
      style: { text: '📦 GALPÓN 01 (Logística, Pañol & Talleres)', fill: '#C084FC', font: 'bold 11px sans-serif' }
    },
    // Marco Edificio E03 (Oficinas Técnicas & Taller)
    {
      type: 'rect',
      left: 690,
      top: 485,
      shape: { width: 250, height: 190, r: 8 },
      style: { fill: 'rgba(15, 23, 42, 0.55)', stroke: '#059669', lineWidth: 1.5 }
    },
    {
      type: 'text',
      left: 705,
      top: 495,
      style: { text: '🏭 EDIFICIO E03 (Oficinas Técnicas)', fill: '#6EE7B7', font: 'bold 11px sans-serif' }
    },
    // Marco Sala UPS y Energía Crítica
    {
      type: 'rect',
      left: 410,
      top: 485,
      shape: { width: 240, height: 190, r: 8 },
      style: { fill: 'rgba(15, 23, 42, 0.55)', stroke: '#D97706', lineWidth: 1.5 }
    },
    {
      type: 'text',
      left: 425,
      top: 495,
      style: { text: '⚡ SALA DE ENERGÍA & UPS CRÍTICA', fill: '#FBBF24', font: 'bold 11px sans-serif' }
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
// CONSTRUCCIÓN COMPLETA DEL DASHBOARD EN GRAFANA
// =============================================================================
const dashboard = {
  title: "MILICIC S.A. | Plano de Planta, Arquitectura y Weathermap Campus Central SRO",
  uid: "milicic-canvas-campus-sro",
  tags: ["milicic", "campus", "sro", "networking", "datacenter", "planta", "weathermap", "echarts"],
  timezone: "browser",
  schemaVersion: 40,
  time: { from: "now-3h", to: "now" },
  refresh: "30s",
  panels: [
    // -------------------------------------------------------------
    // ROW 0: ENCABEZADO NOC CAMPUS SRO (y: 0, h: 4)
    // -------------------------------------------------------------
    {
      id: 1,
      title: "Centro de Comando NOC - Campus Rosario SRO",
      type: "marcusolsson-dynamictext-panel",
      gridPos: { x: 0, y: 0, w: 24, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      options: {
        content: `
<div style="background: linear-gradient(90deg, #0F172A 0%, #1E293B 100%); border-left: 6px solid #EA580C; padding: 16px; border-radius: 8px; color: #F8FAFC;">
  <div style="display: flex; justify-content: space-between; align-items: center;">
    <div>
      <h2 style="margin: 0; color: #EA580C; font-size: 20px; font-weight: 700;">MILICIC S.A. | Plano Arquitectónico y Weathermap Campus Central SRO</h2>
      <p style="margin: 4px 0 0 0; color: #94A3B8; font-size: 13px;">Topología Física de Planta: Edificio Gris (Datacenter & WAN), Edificio Blanco (Administración), Edificio E03 y Galpón 01 (Logística)</p>
    </div>
    <div style="display: flex; gap: 10px;">
      <span style="background: #16A34A; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold;">🟢 CORE 10G MASTER: ONLINE</span>
      <span style="background: #0284C7; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold;">🏢 4 EDIFICIOS ENLAZADOS</span>
      <span style="background: #D97706; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold;">⚡ UPS EMERSON: ONLINE</span>
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
    // ROW 1: RESUMEN DE SALUD CAMPUS SRO (y: 4, h: 4) - 6 CARDS (w: 4)
    // -------------------------------------------------------------
    {
      id: 2,
      title: "Troncal Galpón 01 (Te1/0/8)",
      type: "stat",
      gridPos: { x: 0, y: 4, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "bps",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#8B5CF6", value: null },
              { color: "#F59E0B", value: 500000000 },
              { color: "#EF4444", value: 900000000 }
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
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Interface Te1/0/8(Uplink_Galpones): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 3,
      title: "Troncal Edificio Blanco (Te1/0/5)",
      type: "stat",
      gridPos: { x: 4, y: 4, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "bps",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#0284C7", value: null },
              { color: "#F59E0B", value: 500000000 },
              { color: "#EF4444", value: 900000000 }
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
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Interface Te1/0/5(Uplink_edificio_viejo): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 4,
      title: "Troncal Edificio E03 (TRK1)",
      type: "stat",
      gridPos: { x: 8, y: 4, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "bps",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#10B981", value: null },
              { color: "#F59E0B", value: 500000000 },
              { color: "#EF4444", value: 900000000 }
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
          group: { filter: "switch" },
          host: { filter: "SRO-E03-P00-D03" },
          item: { filter: "Interface TRK1(Core03 (dowlink)): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 5,
      title: "Inter-Core LAG 20G (Te1/0/20)",
      type: "stat",
      gridPos: { x: 12, y: 4, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "bps",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#38BDF8", value: null },
              { color: "#F59E0B", value: 5000000000 },
              { color: "#EF4444", value: 15000000000 }
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
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Interface Te1/0/20(Uplink_SW_Dell): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 6,
      title: "Potencia Total Datacenter Core",
      type: "stat",
      gridPos: { x: 16, y: 4, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "watt",
          color: { mode: "fixed", fixedColor: "#D97706" }
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
          host: { filter: "UPS SRO CORE" },
          item: { filter: "UPS Power Consumption (W)" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 7,
      title: "Autonomía Baterías UPS Core",
      type: "stat",
      gridPos: { x: 20, y: 4, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "m",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#EF4444", value: null },
              { color: "#F59E0B", value: 30 },
              { color: "#10B981", value: 60 }
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
          host: { filter: "UPS SRO CORE" },
          item: { filter: "Battery Time Remaining" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 2: EL PLANO ARQUITECTÓNICO Y WEATHERMAP (ECHARTS) (y: 8, h: 22)
    // -------------------------------------------------------------
    {
      id: 10,
      title: "Plano Arquitectónico y Weathermap de Conectividad Física Campus SRO",
      type: "volkovlabs-echarts-panel",
      gridPos: { x: 0, y: 8, w: 24, h: 22 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      options: {
        getOption: echartsCode
      },
      targets: [
        {
          refId: "G01_RX",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Interface Te1/0/8(Uplink_Galpones): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "G01_TX",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Interface Te1/0/8(Uplink_Galpones): Bits sent" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "Blanco_RX",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Interface Te1/0/5(Uplink_edificio_viejo): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "Blanco_TX",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Interface Te1/0/5(Uplink_edificio_viejo): Bits sent" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "E03_RX",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E03-P00-D03" },
          item: { filter: "Interface TRK1(Core03 (dowlink)): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "E03_TX",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E03-P00-D03" },
          item: { filter: "Interface TRK1(Core03 (dowlink)): Bits sent" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "LAG_RX",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Interface Te1/0/20(Uplink_SW_Dell): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "LAG_TX",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Interface Te1/0/20(Uplink_SW_Dell): Bits sent" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "Uplink1930_RX",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Interface Te1/0/6(UPLINK SW211): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "Uplink1930_TX",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Interface Te1/0/6(UPLINK SW211): Bits sent" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "UPS_W",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "UPS SRO CORE" },
          item: { filter: "UPS Power Consumption (W)" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "UPS_Load",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "UPS SRO CORE" },
          item: { filter: "UPS Load (%)" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "UPS_Min",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "UPS SRO CORE" },
          item: { filter: "Battery Time Remaining" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 3: TRÁFICO TEMPORAL EN TRONCALES DE CAMPUS (y: 30, h: 8)
    // -------------------------------------------------------------
    {
      id: 20,
      title: "Tráfico en Troncales de Fibra Óptica Inter-Edificios (RX / TX)",
      type: "timeseries",
      gridPos: { x: 0, y: 30, w: 24, h: 8 },
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
          refId: "G01_RX",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Interface Te1/0/8(Uplink_Galpones): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "G01_TX",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Interface Te1/0/8(Uplink_Galpones): Bits sent" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "Blanco_RX",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Interface Te1/0/5(Uplink_edificio_viejo): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "Blanco_TX",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Interface Te1/0/5(Uplink_edificio_viejo): Bits sent" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "E03_RX",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E03-P00-D03" },
          item: { filter: "Interface TRK1(Core03 (dowlink)): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "E03_TX",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E03-P00-D03" },
          item: { filter: "Interface TRK1(Core03 (dowlink)): Bits sent" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 4: TELEMETRÍA DE ENERGÍA CRÍTICA DATACENTER (y: 38, h: 8)
    // -------------------------------------------------------------
    {
      id: 30,
      title: "Telemetría de Energía Crítica y Banco de Baterías Datacenter (UPS Emerson)",
      type: "timeseries",
      gridPos: { x: 0, y: 38, w: 24, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          custom: {
            drawStyle: "line",
            lineInterpolation: "smooth",
            lineWidth: 2,
            fillOpacity: 15,
            gradientMode: "opacity"
          },
          color: { mode: "palette-classic" }
        },
        overrides: [
          {
            matcher: { id: "byName", options: "UPS Power Consumption (W)" },
            properties: [
              { id: "unit", value: "watt" },
              { id: "custom.axisPlacement", value: "left" }
            ]
          },
          {
            matcher: { id: "byName", options: "UPS Load (%)" },
            properties: [
              { id: "unit", value: "percent" },
              { id: "custom.axisPlacement", value: "right" }
            ]
          },
          {
            matcher: { id: "byName", options: "Battery Time Remaining" },
            properties: [
              { id: "unit", value: "m" },
              { id: "custom.axisPlacement", value: "right" }
            ]
          }
        ]
      },
      options: {
        tooltip: { mode: "multi", sort: "desc" },
        legend: { displayMode: "table", placement: "right", calcs: ["lastNotNull", "mean", "max"] }
      },
      targets: [
        {
          refId: "Watts",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "UPS SRO CORE" },
          item: { filter: "UPS Power Consumption (W)" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "Load",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "UPS SRO CORE" },
          item: { filter: "UPS Load (%)" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "TimeLeft",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "UPS SRO CORE" },
          item: { filter: "Battery Time Remaining" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    }
  ]
};

// =============================================================================
// SUBIDA DEL DASHBOARD A GRAFANA
// =============================================================================
const payload = JSON.stringify({
  dashboard: dashboard,
  overwrite: true,
  message: "Deploy Masterpiece Architectural Weathermap Campus Central SRO"
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
        console.log('\\n======================================================');
        console.log('✅ MASTERPIECE WEATHERMAP CAMPUS SRO DESPLEGADO CON ÉXITO');
        console.log('URL: http://172.27.210.154:3005' + resp.url);
        console.log('======================================================\\n');
      }
    } catch (e) {
      console.error('Error al parsear respuesta:', e);
    }
  });
});

req.on('error', e => {
  console.error('Error en request HTTP:', e);
});

req.write(payload);
req.end();
