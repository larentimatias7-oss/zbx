import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!tokenCheck(grafanaToken)) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

function tokenCheck(t) {
  return t && t.length > 10;
}

const DATASOURCE_UID = "efz4nzx8r30g0c";
const DATASOURCE_TYPE = "alexanderzobnin-zabbix-datasource";

// =============================================================================
// DEFINICIÓN DE ELEMENTOS DEL PANEL CANVAS DE PLANTA SRO
// =============================================================================
const canvasElements = [
  // --- ZONAS DE EDIFICIOS (RECTÁNGULOS DE FONDO) ---
  {
    id: "zone_core",
    name: "Zona Datacenter Core",
    type: "rectangle",
    layout: { x: 30, y: 30, width: 440, height: 350 },
    background: { color: { fixed: "rgba(15, 23, 42, 0.75)" } },
    border: { color: { fixed: "#0284C7" }, width: 2 }
  },
  {
    id: "zone_compute",
    name: "Zona Cómputo & Storage",
    type: "rectangle",
    layout: { x: 30, y: 410, width: 440, height: 350 },
    background: { color: { fixed: "rgba(15, 23, 42, 0.75)" } },
    border: { color: { fixed: "#10B981" }, width: 2 }
  },
  {
    id: "zone_ups",
    name: "Zona Energía & UPS",
    type: "rectangle",
    layout: { x: 500, y: 410, width: 440, height: 350 },
    background: { color: { fixed: "rgba(15, 23, 42, 0.75)" } },
    border: { color: { fixed: "#F59E0B" }, width: 2 }
  },
  {
    id: "zone_blanco",
    name: "Zona Edificio Blanco",
    type: "rectangle",
    layout: { x: 500, y: 30, width: 440, height: 350 },
    background: { color: { fixed: "rgba(15, 23, 42, 0.75)" } },
    border: { color: { fixed: "#38BDF8" }, width: 2 }
  },
  {
    id: "zone_galpon",
    name: "Zona Galpón 01",
    type: "rectangle",
    layout: { x: 970, y: 30, width: 590, height: 350 },
    background: { color: { fixed: "rgba(15, 23, 42, 0.75)" } },
    border: { color: { fixed: "#8B5CF6" }, width: 2 }
  },
  {
    id: "zone_e03",
    name: "Zona Edificio E03",
    type: "rectangle",
    layout: { x: 970, y: 410, width: 590, height: 350 },
    background: { color: { fixed: "rgba(15, 23, 42, 0.75)" } },
    border: { color: { fixed: "#10B981" }, width: 2 }
  },

  // --- TÍTULOS DE ZONAS ---
  {
    id: "title_core",
    name: "Title Core",
    type: "text",
    text: "🏢 DATACENTER CORE & WAN (Ed. Gris PB)",
    color: { fixed: "#38BDF8" },
    size: 14,
    layout: { x: 50, y: 45, width: 380, height: 26 }
  },
  {
    id: "title_compute",
    name: "Title Compute",
    type: "text",
    text: "🖥️ CLÚSTER VIRTUALIZACIÓN & SAN MSA",
    color: { fixed: "#34D399" },
    size: 14,
    layout: { x: 50, y: 425, width: 380, height: 26 }
  },
  {
    id: "title_ups",
    name: "Title UPS",
    type: "text",
    text: "⚡ SALA DE ENERGÍA CRÍTICA & BANCOS UPS",
    color: { fixed: "#FBBF24" },
    size: 14,
    layout: { x: 520, y: 425, width: 380, height: 26 }
  },
  {
    id: "title_blanco",
    name: "Title Blanco",
    type: "text",
    text: "🏛️ EDIFICIO BLANCO (Administración)",
    color: { fixed: "#7DD3FC" },
    size: 14,
    layout: { x: 520, y: 45, width: 380, height: 26 }
  },
  {
    id: "title_galpon",
    name: "Title Galpón",
    type: "text",
    text: "📦 GALPÓN 01 (Logística, Pañol & Talleres)",
    color: { fixed: "#C084FC" },
    size: 14,
    layout: { x: 990, y: 45, width: 450, height: 26 }
  },
  {
    id: "title_e03",
    name: "Title E03",
    type: "text",
    text: "🏭 EDIFICIO E03 (Anexo Switching & Taller)",
    color: { fixed: "#6EE7B7" },
    size: 14,
    layout: { x: 990, y: 425, width: 450, height: 26 }
  },

  // --- DISPOSITIVOS CORE ---
  {
    id: "dev_ftg",
    name: "FortiGate 200F",
    type: "rectangle",
    layout: { x: 60, y: 90, width: 170, height: 65 },
    background: { color: { fixed: "#EA580C" } },
    border: { color: { fixed: "#FFA059" }, width: 1.5 }
  },
  {
    id: "txt_ftg",
    name: "Txt FTG",
    type: "text",
    text: "FortiGate 200F WAN\n172.30.20.1",
    color: { fixed: "#FFFFFF" },
    size: 11,
    layout: { x: 70, y: 100, width: 150, height: 45 }
  },
  {
    id: "dev_core03",
    name: "CORE03 Aruba",
    type: "rectangle",
    layout: { x: 260, y: 90, width: 180, height: 65 },
    background: { color: { fixed: "#0284C7" } },
    border: { color: { fixed: "#38BDF8" }, width: 1.5 }
  },
  {
    id: "txt_core03",
    name: "Txt Core03",
    type: "text",
    text: "CORE03 (Aruba 1930)\n172.30.20.211",
    color: { fixed: "#FFFFFF" },
    size: 11,
    layout: { x: 270, y: 100, width: 160, height: 45 }
  },
  {
    id: "dev_core01",
    name: "CORE01 Dell",
    type: "rectangle",
    layout: { x: 60, y: 180, width: 170, height: 75 },
    background: { color: { fixed: "#0284C7" } },
    border: { color: { fixed: "#38BDF8" }, width: 2 }
  },
  {
    id: "txt_core01",
    name: "Txt Core01",
    type: "text",
    text: "CORE01 (Dell N4032)\nMaster 10G | 172.30.20.201",
    color: { fixed: "#FFFFFF" },
    size: 11,
    layout: { x: 70, y: 195, width: 150, height: 45 }
  },
  {
    id: "dev_core02",
    name: "CORE02 Dell",
    type: "rectangle",
    layout: { x: 260, y: 180, width: 180, height: 75 },
    background: { color: { fixed: "#0284C7" } },
    border: { color: { fixed: "#38BDF8" }, width: 2 }
  },
  {
    id: "txt_core02",
    name: "Txt Core02",
    type: "text",
    text: "CORE02 (Dell N4032)\nStandby 10G | 172.30.20.202",
    color: { fixed: "#FFFFFF" },
    size: 11,
    layout: { x: 270, y: 195, width: 160, height: 45 }
  },
  {
    id: "dev_acc01",
    name: "ACC01 EG",
    type: "rectangle",
    layout: { x: 60, y: 280, width: 170, height: 60 },
    background: { color: { fixed: "#334155" } },
    border: { color: { fixed: "#64748B" }, width: 1 }
  },
  {
    id: "txt_acc01",
    name: "Txt ACC01",
    type: "text",
    text: "ACC01 (Ed. Gris PB)\n172.30.20.210",
    color: { fixed: "#F8FAFC" },
    size: 10,
    layout: { x: 70, y: 290, width: 150, height: 40 }
  },
  {
    id: "dev_vc",
    name: "AP Master VC",
    type: "rectangle",
    layout: { x: 260, y: 280, width: 180, height: 60 },
    background: { color: { fixed: "#0891B2" } },
    border: { color: { fixed: "#22D3EE" }, width: 1 }
  },
  {
    id: "txt_vc",
    name: "Txt VC",
    type: "text",
    text: "Aruba VC Master (APs)\n172.30.20.231",
    color: { fixed: "#F8FAFC" },
    size: 10,
    layout: { x: 270, y: 290, width: 160, height: 40 }
  },

  // --- DISPOSITIVOS CÓMPUTO & STORAGE ---
  {
    id: "dev_esx01",
    name: "ESX01",
    type: "rectangle",
    layout: { x: 60, y: 470, width: 170, height: 60 },
    background: { color: { fixed: "#059669" } },
    border: { color: { fixed: "#10B981" }, width: 1.5 }
  },
  {
    id: "txt_esx01",
    name: "Txt ESX01",
    type: "text",
    text: "SRO-ESX01 (HPE DL380)\n172.30.70.131",
    color: { fixed: "#FFFFFF" },
    size: 10,
    layout: { x: 70, y: 480, width: 150, height: 40 }
  },
  {
    id: "dev_esx02",
    name: "ESX02",
    type: "rectangle",
    layout: { x: 260, y: 470, width: 180, height: 60 },
    background: { color: { fixed: "#059669" } },
    border: { color: { fixed: "#10B981" }, width: 1.5 }
  },
  {
    id: "txt_esx02",
    name: "Txt ESX02",
    type: "text",
    text: "SRO-ESX02 (HPE DL380)\n172.30.70.132",
    color: { fixed: "#FFFFFF" },
    size: 10,
    layout: { x: 270, y: 480, width: 160, height: 40 }
  },
  {
    id: "dev_sto01",
    name: "STO01",
    type: "rectangle",
    layout: { x: 60, y: 550, width: 380, height: 65 },
    background: { color: { fixed: "#0284C7" } },
    border: { color: { fixed: "#38BDF8" }, width: 2 }
  },
  {
    id: "txt_sto01",
    name: "Txt STO01",
    type: "text",
    text: "SRO-STO01 (HPE MSA 2060 SAN Storage)\nDatastores R5 HDD & SSD | 172.30.70.140",
    color: { fixed: "#FFFFFF" },
    size: 11,
    layout: { x: 70, y: 560, width: 360, height: 45 }
  },
  {
    id: "dev_vms",
    name: "Core VMs",
    type: "rectangle",
    layout: { x: 60, y: 640, width: 380, height: 95 },
    background: { color: { fixed: "rgba(30, 41, 59, 0.9)" } },
    border: { color: { fixed: "#64748B" }, width: 1 }
  },
  {
    id: "txt_vms",
    name: "Txt VMs",
    type: "text",
    text: "Servidores Vitales de Infraestructura:\n• SRO-DCO01 (Active Directory FSMO)\n• SRO-SQL01 (Database Engine) | SRO-BKP01 (Veeam)\n• Zabbix 7.0 LTS Server (172.30.20.61)",
    color: { fixed: "#CBD5E1" },
    size: 10,
    layout: { x: 70, y: 650, width: 360, height: 75 }
  },

  // --- BANCOS DE BATERÍAS UPS ---
  {
    id: "dev_upsemerson",
    name: "UPS Emerson",
    type: "rectangle",
    layout: { x: 530, y: 470, width: 380, height: 80 },
    background: { color: { fixed: "#D97706" } },
    border: { color: { fixed: "#FBBF24" }, width: 2 }
  },
  {
    id: "txt_upsemerson",
    name: "Txt UPS Emerson",
    type: "text",
    text: "UPS Emerson Liebert 10 kVA (Core DC)\nCarga: ~23% | Autonomía: ~120 min | 2.03 kW",
    color: { fixed: "#FFFFFF" },
    size: 11,
    layout: { x: 540, y: 485, width: 360, height: 50 }
  },
  {
    id: "dev_upseg",
    name: "UPS Ed Gris",
    type: "rectangle",
    layout: { x: 530, y: 570, width: 180, height: 70 },
    background: { color: { fixed: "#475569" } },
    border: { color: { fixed: "#94A3B8" }, width: 1 }
  },
  {
    id: "txt_upseg",
    name: "Txt UPS EG",
    type: "text",
    text: "UPS APC 3kVA\nEd. Gris PB",
    color: { fixed: "#F8FAFC" },
    size: 10,
    layout: { x: 540, y: 585, width: 160, height: 40 }
  },
  {
    id: "dev_upse02",
    name: "UPS E02 PA",
    type: "rectangle",
    layout: { x: 730, y: 570, width: 180, height: 70 },
    background: { color: { fixed: "#475569" } },
    border: { color: { fixed: "#94A3B8" }, width: 1 }
  },
  {
    id: "txt_upse02",
    name: "Txt UPS E02",
    type: "text",
    text: "UPS APC 2kVA\nEd. E02 PA",
    color: { fixed: "#F8FAFC" },
    size: 10,
    layout: { x: 740, y: 585, width: 160, height: 40 }
  },
  {
    id: "dev_upsg01",
    name: "UPS Galpón",
    type: "rectangle",
    layout: { x: 530, y: 660, width: 380, height: 65 },
    background: { color: { fixed: "#475569" } },
    border: { color: { fixed: "#94A3B8" }, width: 1 }
  },
  {
    id: "txt_upsg01",
    name: "Txt UPS G01",
    type: "text",
    text: "UPS Eaton Galpón 01 (Talleres & Redes)\n172.30.20.83 | Monitoreo SNMP Activo",
    color: { fixed: "#F8FAFC" },
    size: 10,
    layout: { x: 540, y: 675, width: 360, height: 35 }
  },

  // --- EDIFICIO BLANCO ---
  {
    id: "dev_d01",
    name: "Switch D01",
    type: "rectangle",
    layout: { x: 530, y: 100, width: 380, height: 80 },
    background: { color: { fixed: "#0284C7" } },
    border: { color: { fixed: "#38BDF8" }, width: 2 }
  },
  {
    id: "txt_d01",
    name: "Txt D01",
    type: "text",
    text: "Switch D01 (Edificio Blanco)\nTroncal Fibra Te1/0/5 desde Core01 | 172.30.20.207",
    color: { fixed: "#FFFFFF" },
    size: 11,
    layout: { x: 540, y: 115, width: 360, height: 50 }
  },
  {
    id: "dev_apblanco",
    name: "APs Blanco",
    type: "rectangle",
    layout: { x: 530, y: 200, width: 380, height: 140 },
    background: { color: { fixed: "rgba(30, 41, 59, 0.9)" } },
    border: { color: { fixed: "#06B6D4" }, width: 1 }
  },
  {
    id: "txt_apblanco",
    name: "Txt APs Blanco",
    type: "text",
    text: "Parque Inalámbrico Edificio Blanco (AOS-8):\n• AP Administración (172.30.20.233)\n• AP Recepción Principal (172.30.20.232)\n• AP Sala Directorio (172.30.20.236)\n• AP Gerencias & Presidencia (172.30.20.237)",
    color: { fixed: "#E2E8F0" },
    size: 10,
    layout: { x: 540, y: 215, width: 360, height: 110 }
  },

  // --- GALPÓN 01 ---
  {
    id: "dev_dis01",
    name: "Switch DIS01",
    type: "rectangle",
    layout: { x: 1000, y: 90, width: 250, height: 85 },
    background: { color: { fixed: "#7C3AED" } },
    border: { color: { fixed: "#A78BFA" }, width: 2 }
  },
  {
    id: "txt_dis01",
    name: "Txt DIS01",
    type: "text",
    text: "Switch DIS01 (HP Comware)\nTroncal Fibra Te1/0/8 | 172.30.20.224",
    color: { fixed: "#FFFFFF" },
    size: 11,
    layout: { x: 1010, y: 105, width: 230, height: 55 }
  },
  {
    id: "dev_acc01g",
    name: "ACC01 G01",
    type: "rectangle",
    layout: { x: 1280, y: 90, width: 250, height: 85 },
    background: { color: { fixed: "#334155" } },
    border: { color: { fixed: "#64748B" }, width: 1 }
  },
  {
    id: "txt_acc01g",
    name: "Txt ACC01 G",
    type: "text",
    text: "ACC01 (Taller Mecánico)\nDownlink Port 3 | 172.30.20.214",
    color: { fixed: "#F8FAFC" },
    size: 10,
    layout: { x: 1290, y: 105, width: 230, height: 55 }
  },
  {
    id: "dev_acc2g",
    name: "ACC2 G01",
    type: "rectangle",
    layout: { x: 1000, y: 200, width: 250, height: 85 },
    background: { color: { fixed: "#334155" } },
    border: { color: { fixed: "#64748B" }, width: 1 }
  },
  {
    id: "txt_acc2g",
    name: "Txt ACC2 G",
    type: "text",
    text: "ACC2 (Pañol Central)\nDownlink Port 24 | 172.30.20.215",
    color: { fixed: "#F8FAFC" },
    size: 10,
    layout: { x: 1010, y: 215, width: 230, height: 55 }
  },
  {
    id: "dev_p2p",
    name: "Radioenlaces",
    type: "rectangle",
    layout: { x: 1280, y: 200, width: 250, height: 85 },
    background: { color: { fixed: "#0891B2" } },
    border: { color: { fixed: "#22D3EE" }, width: 1 }
  },
  {
    id: "txt_p2p",
    name: "Txt P2P",
    type: "text",
    text: "Radioenlaces P2P Ubiquiti:\n• P2P G06 (172.30.20.240)\n• POR-P2P01 Portería (172.30.20.241)",
    color: { fixed: "#FFFFFF" },
    size: 10,
    layout: { x: 1290, y: 215, width: 230, height: 55 }
  },

  // --- EDIFICIO E03 ---
  {
    id: "dev_d03",
    name: "Switch D03",
    type: "rectangle",
    layout: { x: 1000, y: 470, width: 530, height: 90 },
    background: { color: { fixed: "#059669" } },
    border: { color: { fixed: "#34D399" }, width: 2 }
  },
  {
    id: "txt_d03",
    name: "Txt D03",
    type: "text",
    text: "Switch D03 (Aruba 1930 8G)\nTroncal TRK1 desde CORE03 | 172.30.20.218\nAlimenta puestos de trabajo y talleres de Edificio E03",
    color: { fixed: "#FFFFFF" },
    size: 11,
    layout: { x: 1015, y: 485, width: 500, height: 60 }
  },
  {
    id: "dev_e03info",
    name: "E03 Info",
    type: "rectangle",
    layout: { x: 1000, y: 580, width: 530, height: 145 },
    background: { color: { fixed: "rgba(30, 41, 59, 0.9)" } },
    border: { color: { fixed: "#64748B" }, width: 1 }
  },
  {
    id: "txt_e03info",
    name: "Txt E03 Info",
    type: "text",
    text: "Infraestructura & Puntos de Red E03:\n• Cableado estructurado Cat6A para Oficinas Técnicas\n• Respaldo de energía mediante UPS E02 PA\n• Puntos Wi-Fi distribuidos y vinculados al clúster AOS-8",
    color: { fixed: "#CBD5E1" },
    size: 11,
    layout: { x: 1015, y: 600, width: 500, height: 100 }
  }
];

// =============================================================================
// ESTRUCTURA COMPLETA DEL DASHBOARD
// =============================================================================
const dashboard = {
  title: "Plano Arquitectónico y Weathermap Campus SRO (Canvas)",
  uid: "milicic-canvas-campus-sro",
  tags: ["milicic", "campus", "canvas", "sro", "networking", "datacenter", "planta", "weathermap"],
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
      <h2 style="margin: 0; color: #EA580C; font-size: 20px; font-weight: 700;">MILICIC S.A. | Plano de Planta y Conectividad Campus Central SRO</h2>
      <p style="margin: 4px 0 0 0; color: #94A3B8; font-size: 13px;">Topología Arquitectónica: Edificio Gris, Edificio Blanco, Edificio E03 y Galpón 01</p>
    </div>
    <div style="display: flex; gap: 12px;">
      <span style="background: #16A34A; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold;">🟢 CAMPUS CORE 10G: OPERATIVO</span>
      <span style="background: #0284C7; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold;">🏢 4 EDIFICIOS INTERCONECTADOS</span>
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
    // ROW 1: RESUMEN DE SALUD CAMPUS SRO (y: 4, h: 4)
    // -------------------------------------------------------------
    {
      id: 2,
      title: "Troncal Galpón 01 (Te1/0/8)",
      type: "stat",
      gridPos: { x: 0, y: 4, w: 6, h: 4 },
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
      gridPos: { x: 6, y: 4, w: 6, h: 4 },
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
      gridPos: { x: 12, y: 4, w: 6, h: 4 },
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
          host: { filter: "SRO-E02-PB00-CORE03" },
          item: { filter: "/.*Bits received.*TRK1.*/" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 5,
      title: "Potencia Total Datacenter Core",
      type: "stat",
      gridPos: { x: 18, y: 4, w: 6, h: 4 },
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

    // -------------------------------------------------------------
    // ROW 2: EL PLANO ARQUITECTÓNICO CANVAS DE PLANTA SRO (y: 8, h: 22)
    // -------------------------------------------------------------
    {
      id: 10,
      title: "Plano Arquitectónico y Conectividad Física Campus SRO",
      type: "canvas",
      gridPos: { x: 0, y: 8, w: 24, h: 22 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      options: {
        root: {
          elements: canvasElements
        }
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
        }
      ]
    }
  ]
};

// Despliegue en Grafana vía API HTTP
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
    console.log('Grafana Response:', b);
  });
});

req.on('error', e => console.error('Error deploying Canvas dashboard:', e));
req.write(payload);
req.end();
