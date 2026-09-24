import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =========================================================================
// 1. DEFINICIÓN DE ELEMENTOS DEL MAPA (SELEMENTS)
// =========================================================================
const selements = [
  // --- ZONA 1: DATACENTER CORE & WAN ---
  {
    selementid: "1",
    elementtype: 0,
    iconid_off: "28", // Firewall_(48)
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/FTG_milicic_border1_SNMP/icmppingsec)}",
    label_location: -1,
    x: 90,
    y: 110,
    elements: [{ hostid: "10697" }]
  },
  {
    selementid: "2",
    elementtype: 0,
    iconid_off: "154", // Switch_(48)
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPoE: {?last(/{HOST.HOST}/poe.power.consumption)}",
    label_location: -1,
    x: 420,
    y: 110,
    elements: [{ hostid: "10724" }]
  },
  {
    selementid: "3",
    elementtype: 0,
    iconid_off: "154", // Switch_(48)
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nCPU: {?last(/{HOST.HOST}/system.cpu.usage.avg1m[system])}",
    label_location: -1,
    x: 610,
    y: 260,
    elements: [{ hostid: "10708" }]
  },
  {
    selementid: "4",
    elementtype: 0,
    iconid_off: "154", // Switch_(48)
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nCPU: {?last(/{HOST.HOST}/system.cpu.usage.avg1m[system])}",
    label_location: -1,
    x: 610,
    y: 490,
    elements: [{ hostid: "10722" }]
  },
  {
    selementid: "5",
    elementtype: 0,
    iconid_off: "154", // Switch_(48)
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 110,
    y: 300,
    elements: [{ hostid: "10796" }]
  },
  {
    selementid: "6",
    elementtype: 0,
    iconid_off: "154", // Switch_(48)
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 110,
    y: 470,
    elements: [{ hostid: "10797" }]
  },
  {
    selementid: "7",
    elementtype: 0,
    iconid_off: "124", // Router_(48)
    label: "{HOST.NAME} (VC Master)\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 330,
    y: 470,
    elements: [{ hostid: "10804" }]
  },

  // --- ZONA 2: DATACENTER CÓMPUTO & STORAGE ---
  {
    selementid: "8",
    elementtype: 0,
    iconid_off: "149", // Server_(48)
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/SRO-ESX01/icmppingsec)}",
    label_location: -1,
    x: 90,
    y: 730,
    elements: [{ hostid: "10704" }]
  },
  {
    selementid: "9",
    elementtype: 0,
    iconid_off: "149", // Server_(48)
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/SRO-ESX02/icmppingsec)}",
    label_location: -1,
    x: 240,
    y: 730,
    elements: [{ hostid: "10705" }]
  },
  {
    selementid: "10",
    elementtype: 0,
    iconid_off: "149", // Server_(48)
    label: "{HOST.NAME} (HPE MSA)\r\n{HOST.IP}\r\nPing: {?last(/SRO-STO01/icmppingsec)}",
    label_location: -1,
    x: 390,
    y: 730,
    elements: [{ hostid: "10706" }]
  },
  {
    selementid: "11",
    elementtype: 0,
    iconid_off: "149", // Server_(48)
    label: "vCenter (VMware)\r\n172.30.70.136\r\nPing: {?last(/vCenter/icmppingsec)}",
    label_location: -1,
    x: 540,
    y: 730,
    elements: [{ hostid: "10680" }]
  },
  {
    selementid: "12",
    elementtype: 0,
    iconid_off: "149", // Server_(48)
    label: "{HOST.NAME} (DC FSMO)\r\n{HOST.IP}\r\nCPU: {?last(/SRO-DCO01/system.cpu.util)}%\r\nRAM: {?last(/SRO-DCO01/vm.memory.util)}%",
    label_location: -1,
    x: 90,
    y: 920,
    elements: [{ hostid: "10699" }]
  },
  {
    selementid: "13",
    elementtype: 0,
    iconid_off: "149", // Server_(48)
    label: "{HOST.NAME} (SQL Server)\r\n{HOST.IP}\r\nPing: {?last(/SRO-SQL01/icmppingsec)}",
    label_location: -1,
    x: 240,
    y: 920,
    elements: [{ hostid: "10784" }]
  },
  {
    selementid: "14",
    elementtype: 0,
    iconid_off: "149", // Server_(48)
    label: "{HOST.NAME} (Veeam BKP)\r\n{HOST.IP}\r\nPing: {?last(/SRO-BKP01/icmppingsec)}",
    label_location: -1,
    x: 390,
    y: 920,
    elements: [{ hostid: "10703" }]
  },
  {
    selementid: "15",
    elementtype: 0,
    iconid_off: "183", // Zabbix_server_2D_(64)
    label: "Zabbix Server (Prod)\r\n172.30.20.61\r\nCPU: {?last(/Zabbix server/system.cpu.util)}%",
    label_location: -1,
    x: 540,
    y: 920,
    elements: [{ hostid: "10084" }]
  },

  // --- ZONA 3: ENERGÍA & FACILITIES ---
  {
    selementid: "16",
    elementtype: 0,
    iconid_off: "164", // UPS_rackmountable_2D_(48)
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nCarga: {?last(/UPS_Emerson/ups.load.percent)}%\r\nAutonomía: {?last(/UPS_Emerson/upsEstimatedMinutesRemaining)} min",
    label_location: -1,
    x: 870,
    y: 960,
    elements: [{ hostid: "10792" }]
  },
  {
    selementid: "17",
    elementtype: 0,
    iconid_off: "164", // UPS_rackmountable_2D_(48)
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nCarga: {?last(/SRO-UPS-E02-P00/ups.load.calc)}%\r\nAutonomía: {?last(/SRO-UPS-E02-P00/upsEstimatedMinutesRemaining)} min",
    label_location: -1,
    x: 1100,
    y: 960,
    elements: [{ hostid: "10801" }]
  },
  {
    selementid: "18",
    elementtype: 0,
    iconid_off: "164", // UPS_rackmountable_2D_(48)
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nSNMP: {?last(/UPS E02 PA/zabbix[host,snmp,available])}",
    label_location: -1,
    x: 870,
    y: 1150,
    elements: [{ hostid: "10802" }]
  },
  {
    selementid: "19",
    elementtype: 0,
    iconid_off: "164", // UPS_rackmountable_2D_(48)
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nCarga: {?last(/UPS GALPON 01/ups.output.load.estimated)}%",
    label_location: -1,
    x: 1100,
    y: 1150,
    elements: [{ hostid: "10819" }]
  },

  // --- ZONA 4: EDIFICIO E03 ---
  {
    selementid: "20",
    elementtype: 0,
    iconid_off: "154", // Switch_(48)
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPoE: {?last(/{HOST.HOST}/poe.power.consumption)}",
    label_location: -1,
    x: 980,
    y: 650,
    elements: [{ hostid: "10726" }]
  },

  // --- ZONA 5: GALPÓN 01 ---
  {
    selementid: "21",
    elementtype: 0,
    iconid_off: "154", // Switch_(48)
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 870,
    y: 170,
    elements: [{ hostid: "10799" }]
  },
  {
    selementid: "22",
    elementtype: 0,
    iconid_off: "154", // Switch_(48)
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 1160,
    y: 90,
    elements: [{ hostid: "10798" }]
  },
  {
    selementid: "23",
    elementtype: 0,
    iconid_off: "154", // Switch_(48)
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 1160,
    y: 250,
    elements: [{ hostid: "10800" }]
  },
  {
    selementid: "24",
    elementtype: 0,
    iconid_off: "144", // Satellite_antenna_(48)
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 1450,
    y: 90,
    elements: [{ hostid: "10803" }]
  },
  {
    selementid: "25",
    elementtype: 0,
    iconid_off: "144", // Satellite_antenna_(48)
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 1450,
    y: 250,
    elements: [{ hostid: "10820" }]
  },
  {
    selementid: "26",
    elementtype: 0,
    iconid_off: "124", // Router_(48)
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 1720,
    y: 90,
    elements: [{ hostid: "10815" }]
  },
  {
    selementid: "27",
    elementtype: 0,
    iconid_off: "124", // Router_(48)
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 1720,
    y: 250,
    elements: [{ hostid: "10816" }]
  },

  // --- ZONA 6: EDIFICIO BLANCO E01 ---
  {
    selementid: "28",
    elementtype: 0,
    iconid_off: "154", // Switch_(48)
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 870,
    y: 470,
    elements: [{ hostid: "10711" }]
  },
  {
    selementid: "29",
    elementtype: 0,
    iconid_off: "124", // Router_(48)
    label: "{HOST.NAME}\r\n{HOST.IP}",
    label_location: -1,
    x: 1060,
    y: 450,
    elements: [{ hostid: "10811" }]
  },
  {
    selementid: "30",
    elementtype: 0,
    iconid_off: "124", // Router_(48)
    label: "{HOST.NAME}\r\n{HOST.IP}",
    label_location: -1,
    x: 1160,
    y: 480,
    elements: [{ hostid: "10812" }]
  },

  // --- ZONA 7: INFRAESTRUCTURA WI-FI ARUBA ---
  {
    selementid: "31",
    elementtype: 3, // Host Group
    iconid_off: "4", // Cloud_(64)
    label: "Parque Wi-Fi ARUBA\r\n(14 APs AOS-8 Clúster)",
    label_location: -1,
    x: 1640,
    y: 680,
    elements: [{ groupid: "45" }]
  },
  {
    selementid: "32",
    elementtype: 0,
    iconid_off: "124", // Router_(48)
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 1400,
    y: 530,
    elements: [{ hostid: "10813" }]
  },
  {
    selementid: "33",
    elementtype: 0,
    iconid_off: "124", // Router_(48)
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 1400,
    y: 830,
    elements: [{ hostid: "10814" }]
  },
  {
    selementid: "34",
    elementtype: 0,
    iconid_off: "124", // Router_(48)
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 1880,
    y: 530,
    elements: [{ hostid: "10808" }]
  },
  {
    selementid: "35",
    elementtype: 0,
    iconid_off: "124", // Router_(48)
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 1880,
    y: 830,
    elements: [{ hostid: "10806" }]
  },
  {
    selementid: "36",
    elementtype: 0,
    iconid_off: "124", // Router_(48)
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 1640,
    y: 960,
    elements: [{ hostid: "10807" }]
  },
  {
    selementid: "37",
    elementtype: 0,
    iconid_off: "124", // Router_(48)
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 1400,
    y: 960,
    elements: [{ hostid: "10805" }]
  }
];

// =========================================================================
// 2. DEFINICIÓN DE ENLACES CON TELEMETRÍA DE ANCHO DE BANDA EN TIEMPO REAL
// =========================================================================
const links = [
  // Link 1: FTG <--> CORE03 (WAN Perímetro)
  {
    selementid1: "1",
    selementid2: "2",
    drawtype: 0,
    color: "00AA00",
    label: "WAN Perímetro\r\nUP: {?last(/FTG_milicic_border1_SNMP/net.if.in[ifHCInOctets.38])}\r\nDOWN: {?last(/FTG_milicic_border1_SNMP/net.if.out[ifHCOutOctets.38])}"
  },
  // Link 2: CORE03 <--> CORE01 (Te1/0/6 Uplink)
  {
    selementid1: "2",
    selementid2: "3",
    drawtype: 0,
    color: "00AA00",
    label: "Te1/0/6 (Uplink 1930)\r\nRX: {?last(/SRO-E02-PB00-CORE01/net.if.in[ifHCInOctets.6])}\r\nTX: {?last(/SRO-E02-PB00-CORE01/net.if.out[ifHCOutOctets.6])}",
    linktriggers: [
      {
        triggerid: "26798", // Interface Te1/0/6(UPLINK SW211): Link down
        color: "DD0000",
        drawtype: 1
      }
    ]
  },
  // Link 3: CORE01 <--> CORE02 (LAG Inter-Core Te1/0/20)
  {
    selementid1: "3",
    selementid2: "4",
    drawtype: 0,
    color: "00AA00",
    label: "LAG Te1/0/20 (Inter-Core)\r\nRX: {?last(/SRO-E02-PB00-CORE01/net.if.in[ifHCInOctets.20])}\r\nTX: {?last(/SRO-E02-PB00-CORE01/net.if.out[ifHCOutOctets.20])}",
    linktriggers: [
      {
        triggerid: "26812", // Interface Te1/0/20(Uplink_SW_Dell): Link down
        color: "DD0000",
        drawtype: 1
      }
    ]
  },
  // Link 4: CORE01 <--> DIS01 (Troncal Galpón 01 Te1/0/8)
  {
    selementid1: "3",
    selementid2: "21",
    drawtype: 0,
    color: "00AA00",
    label: "Te1/0/8 (Troncal Galpón 01)\r\nRX: {?last(/SRO-E02-PB00-CORE01/net.if.in[ifHCInOctets.8])}\r\nTX: {?last(/SRO-E02-PB00-CORE01/net.if.out[ifHCOutOctets.8])}",
    linktriggers: [
      {
        triggerid: "26800", // Interface Te1/0/8(Uplink_Galpones): Link down
        color: "DD0000",
        drawtype: 1
      }
    ]
  },
  // Link 5: CORE01 <--> D01 (Troncal Edificio Blanco Te1/0/5)
  {
    selementid1: "3",
    selementid2: "28",
    drawtype: 0,
    color: "00AA00",
    label: "Te1/0/5 (Troncal Ed. Blanco)\r\nRX: {?last(/SRO-E02-PB00-CORE01/net.if.in[ifHCInOctets.5])}\r\nTX: {?last(/SRO-E02-PB00-CORE01/net.if.out[ifHCOutOctets.5])}",
    linktriggers: [
      {
        triggerid: "26797", // Interface Te1/0/5(Uplink_edificio_viejo): Link down
        color: "DD0000",
        drawtype: 1
      }
    ]
  },
  // Link 6: CORE03 <--> D03 (Edificio E03 Aruba 1930 8G)
  {
    selementid1: "2",
    selementid2: "20",
    drawtype: 0,
    color: "00AA00",
    label: "TRK1 (Troncal E03)\r\nRX: {?last(/SRO-E02-PB00-CORE03/net.if.in[ifHCInOctets.1000])}\r\nTX: {?last(/SRO-E02-PB00-CORE03/net.if.out[ifHCOutOctets.1000])}"
  },
  // Link 7: CORE01 <--> ACC01 (Edificio Gris PB)
  {
    selementid1: "3",
    selementid2: "5",
    drawtype: 0,
    color: "00AA00"
  },
  // Link 8: CORE01 <--> SW Ed Gris PB (ACC02)
  {
    selementid1: "3",
    selementid2: "6",
    drawtype: 0,
    color: "00AA00"
  },
  // Link 9: ACC01 <--> AP Master VC
  {
    selementid1: "5",
    selementid2: "7",
    drawtype: 0,
    color: "00AA00"
  },
  // Link 10: CORE02 <--> SRO-ESX01
  {
    selementid1: "4",
    selementid2: "8",
    drawtype: 0,
    color: "00AA00"
  },
  // Link 11: CORE02 <--> SRO-ESX02
  {
    selementid1: "4",
    selementid2: "9",
    drawtype: 0,
    color: "00AA00"
  },
  // Link 12: CORE02 <--> SRO-STO01
  {
    selementid1: "4",
    selementid2: "10",
    drawtype: 0,
    color: "00AA00"
  },
  // Link 13: CORE02 <--> vCenter
  {
    selementid1: "4",
    selementid2: "11",
    drawtype: 0,
    color: "00AA00"
  },
  // Link 14: CORE02 <--> SRO-DCO01
  {
    selementid1: "4",
    selementid2: "12",
    drawtype: 0,
    color: "00AA00"
  },
  // Link 15: CORE02 <--> SRO-SQL01
  {
    selementid1: "4",
    selementid2: "13",
    drawtype: 0,
    color: "00AA00"
  },
  // Link 16: CORE02 <--> SRO-BKP01
  {
    selementid1: "4",
    selementid2: "14",
    drawtype: 0,
    color: "00AA00"
  },
  // Link 17: CORE02 <--> Zabbix Server
  {
    selementid1: "4",
    selementid2: "15",
    drawtype: 0,
    color: "00AA00"
  },
  // Link 18: CORE02 <--> UPS SRO CORE
  {
    selementid1: "4",
    selementid2: "16",
    drawtype: 2,
    color: "F59E0B"
  },
  // Link 19: SRO-ESX01 <--> UPS Ed Gris PB
  {
    selementid1: "8",
    selementid2: "17",
    drawtype: 2,
    color: "F59E0B"
  },
  // Link 20: D03 <--> UPS E02 PA
  {
    selementid1: "20",
    selementid2: "18",
    drawtype: 2,
    color: "F59E0B"
  },
  // Link 21: DIS01 <--> UPS GALPON 01
  {
    selementid1: "21",
    selementid2: "19",
    drawtype: 2,
    color: "F59E0B"
  },
  // Link 22: DIS01 <--> ACC01 (Galpón 01 Port 3)
  {
    selementid1: "21",
    selementid2: "22",
    drawtype: 0,
    color: "00AA00",
    label: "Port 3 (ACC01)\r\nRX: {?last(/SRO-G01-P100-ACC01/net.if.in[ifInOctets.49153])}\r\nTX: {?last(/SRO-G01-P100-ACC01/net.if.out[ifOutOctets.49153])}"
  },
  // Link 23: DIS01 <--> ACC2 (Galpón 01 Port 24)
  {
    selementid1: "21",
    selementid2: "23",
    drawtype: 0,
    color: "00AA00",
    label: "Port 24 (ACC2)"
  },
  // Link 24: ACC01 <--> P2P G06 (Ubiquiti)
  {
    selementid1: "22",
    selementid2: "24",
    drawtype: 0,
    color: "00AA00"
  },
  // Link 25: ACC2 <--> POR-P2P01 (Ubiquiti)
  {
    selementid1: "23",
    selementid2: "25",
    drawtype: 0,
    color: "00AA00"
  },
  // Link 26: DIS01 <--> AP ABASTECIMIENTO
  {
    selementid1: "21",
    selementid2: "26",
    drawtype: 0,
    color: "00AA00"
  },
  // Link 27: DIS01 <--> AP PAÑOL
  {
    selementid1: "21",
    selementid2: "27",
    drawtype: 0,
    color: "00AA00"
  },
  // Link 28: D01 <--> AP Administración
  {
    selementid1: "28",
    selementid2: "29",
    drawtype: 0,
    color: "00AA00"
  },
  // Link 29: D01 <--> AP RECEPCION
  {
    selementid1: "28",
    selementid2: "30",
    drawtype: 0,
    color: "00AA00"
  },
  // Link 30: AP Master VC <--> Clúster Wi-Fi ARUBA
  {
    selementid1: "7",
    selementid2: "31",
    drawtype: 2, // Dotted/dashed
    color: "0284C7", // Aruba Cyan
    label: "Aruba VC Master (14 APs AOS-8)"
  },
  // Link 31: Clúster Wi-Fi <--> AP Directorio
  {
    selementid1: "31",
    selementid2: "32",
    drawtype: 2,
    color: "0284C7"
  },
  // Link 32: Clúster Wi-Fi <--> AP Gerencias
  {
    selementid1: "31",
    selementid2: "33",
    drawtype: 2,
    color: "0284C7"
  },
  // Link 33: Clúster Wi-Fi <--> AP AIMI
  {
    selementid1: "31",
    selementid2: "34",
    drawtype: 2,
    color: "0284C7"
  },
  // Link 34: Clúster Wi-Fi <--> AP Ger. Compras
  {
    selementid1: "31",
    selementid2: "35",
    drawtype: 2,
    color: "0284C7"
  },
  // Link 35: Clúster Wi-Fi <--> AP Comedor EG
  {
    selementid1: "31",
    selementid2: "36",
    drawtype: 2,
    color: "0284C7"
  },
  // Link 36: Clúster Wi-Fi <--> AP CAS
  {
    selementid1: "31",
    selementid2: "37",
    drawtype: 2,
    color: "0284C7"
  }
];

// =========================================================================
// 3. DEFINICIÓN DE MACROZONAS CON FONDOS SUAVES Y BORDES CORPORATIVOS
// =========================================================================
const shapes = [
  // 1. Datacenter Core & Perímetro WAN (Edificio Gris PB)
  {
    type: 0,
    x: 30,
    y: 30,
    width: 720,
    height: 580,
    text: "🏢 Datacenter Core & Perímetro WAN (Edificio Gris PB)",
    font: 9,
    font_size: 11,
    font_color: "1E293B",
    text_halign: 0,
    text_valign: 0,
    border_type: 1,
    border_width: 1,
    border_color: "64748B",
    background_color: "F8FAFC", // Slate ultra suave
    zindex: 0
  },
  // 2. Datacenter Cómputo, Storage & Monitoreo
  {
    type: 0,
    x: 30,
    y: 640,
    width: 720,
    height: 480,
    text: "🖥️ Datacenter Cómputo, Virtualización, Storage & Monitoreo",
    font: 9,
    font_size: 11,
    font_color: "1E293B",
    text_halign: 0,
    text_valign: 0,
    border_type: 1,
    border_width: 1,
    border_color: "64748B",
    background_color: "F1F5F9", // Slate suave
    zindex: 0
  },
  // 3. Energía Crítica & Facilities (UPS)
  {
    type: 0,
    x: 780,
    y: 880,
    width: 460,
    height: 380,
    text: "⚡ Energía Crítica & Facilities (Bancos de Baterías UPS)",
    font: 9,
    font_size: 11,
    font_color: "92400E",
    text_halign: 0,
    text_valign: 0,
    border_type: 1,
    border_width: 1,
    border_color: "F59E0B",
    background_color: "FFFBEB", // Ámbar suave
    zindex: 0
  },
  // 4. Edificio E03 (Anexo Switching & Taller)
  {
    type: 0,
    x: 780,
    y: 560,
    width: 460,
    height: 290,
    text: "🏭 Edificio E03 (Anexo Switching & Taller)",
    font: 9,
    font_size: 11,
    font_color: "065F46",
    text_halign: 0,
    text_valign: 0,
    border_type: 1,
    border_width: 1,
    border_color: "10B981",
    background_color: "F0FDF4", // Esmeralda suave
    zindex: 0
  },
  // 5. Galpón 01 (G01 - Taller, Logística & Radioenlaces)
  {
    type: 0,
    x: 780,
    y: 30,
    width: 1280,
    height: 360,
    text: "📦 Galpón 01 (G01 - Taller, Logística & Radioenlaces P2P)",
    font: 9,
    font_size: 11,
    font_color: "5B21B6",
    text_halign: 0,
    text_valign: 0,
    border_type: 1,
    border_width: 1,
    border_color: "8B5CF6",
    background_color: "F5F3FF", // Índigo suave
    zindex: 0
  },
  // 6. Edificio Blanco (E01 - Administración & Directorio)
  {
    type: 0,
    x: 780,
    y: 410,
    width: 460,
    height: 130,
    text: "🏛️ Edificio Blanco (E01 - Administración & Directorio)",
    font: 9,
    font_size: 11,
    font_color: "075985",
    text_halign: 0,
    text_valign: 0,
    border_type: 1,
    border_width: 1,
    border_color: "0EA5E9",
    background_color: "F0F9FF", // Azul cielo suave
    zindex: 0
  },
  // 7. Infraestructura Wi-Fi Corporativa (Aruba AOS-8)
  {
    type: 0,
    x: 1270,
    y: 410,
    width: 790,
    height: 850,
    text: "📡 Parque Wi-Fi Corporativo ARUBA (14 APs AOS-8 Clúster)",
    font: 9,
    font_size: 11,
    font_color: "155E75",
    text_halign: 0,
    text_valign: 0,
    border_type: 1,
    border_width: 1,
    border_color: "06B6D4",
    background_color: "ECFEFF", // Cyan suave
    zindex: 0
  },
  // 8. Panel de Referencias & Leyenda Técnica NOC
  {
    type: 0,
    x: 30,
    y: 1150,
    width: 720,
    height: 110,
    text: "📋 Referencias NOC Milicic:  🟢 Troncal Fibra OK  |  🔴 Link Down (Alarma Crítica)  |  🟡 Enlace Energía/UPS  |  🔵 Enlace Virtual Wi-Fi AOS-8\r\nTelemetría en Vivo: {?last(...)} Ancho de Banda RX/TX, Latencia Ping ICMP, Carga CPU/RAM y Autonomía de Baterías.",
    font: 9,
    font_size: 10,
    font_color: "334155",
    text_halign: 0,
    text_valign: 0,
    border_type: 1,
    border_width: 1,
    border_color: "94A3B8",
    background_color: "FFFFFF",
    zindex: 0
  }
];

const updatePayload = {
  sysmapid: "12",
  name: "Network SRO v2",
  width: "2100",
  height: "1300",
  backgroundid: "0",
  label_type: "0",
  label_location: "0",
  highlight: "0",
  expandproblem: "0",
  markelements: "0",
  show_unack: "0",
  grid_size: "50",
  grid_show: "1",
  grid_align: "1",
  label_format: "1",
  label_type_host: "0",
  label_type_hostgroup: "2",
  label_type_trigger: "2",
  label_type_map: "2",
  label_type_image: "2",
  label_string_host: "",
  label_string_hostgroup: "",
  label_string_trigger: "",
  label_string_map: "",
  label_string_image: "",
  iconmapid: "0",
  expand_macros: "1",
  severity_min: "1",
  show_suppressed: "0",
  selements,
  links,
  shapes
};

fs.writeFileSync(path.resolve(__dirname, '../.zabbix_context/dashboards/network_sro_v2.json'), JSON.stringify(updatePayload, null, 2));
console.log('Payload Maestro de Network SRO v2 generado con éxito (37 selements, 36 links, 8 macrozonas con fondos temáticos).');
