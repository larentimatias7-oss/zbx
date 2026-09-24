import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 18 Elementos con coordenadas de alta resolución, espacio optimizado y macros corregidas
const selements = [
  // 1. FTG Perimetral
  {
    selementid: "1",
    elementtype: 0,
    iconid_off: "28", // Firewall_(48)
    iconid_on: "0",
    iconid_disabled: "0",
    iconid_maintenance: "0",
    elementsubtype: 0,
    areatype: 0,
    width: 200,
    height: 200,
    viewtype: 0,
    use_iconmap: 0,
    evaltype: 0,
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 80,
    y: 160,
    elements: [{ hostid: "10697" }]
  },
  // 2. CORE03 (Aruba 1930 48G PoE)
  {
    selementid: "2",
    elementtype: 0,
    iconid_off: "154", // Switch_(48)
    iconid_on: "0",
    iconid_disabled: "0",
    iconid_maintenance: "0",
    elementsubtype: 0,
    areatype: 0,
    width: 200,
    height: 200,
    viewtype: 0,
    use_iconmap: 0,
    evaltype: 0,
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPoE: {?last(/{HOST.HOST}/poe.power.consumption)}",
    label_location: -1,
    x: 320,
    y: 160,
    elements: [{ hostid: "10724" }]
  },
  // 3. CORE01 (Dell N4032 - 1)
  {
    selementid: "3",
    elementtype: 0,
    iconid_off: "154", // Switch_(48)
    iconid_on: "0",
    iconid_disabled: "0",
    iconid_maintenance: "0",
    elementsubtype: 0,
    areatype: 0,
    width: 200,
    height: 200,
    viewtype: 0,
    use_iconmap: 0,
    evaltype: 0,
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nCPU: {?last(/{HOST.HOST}/system.cpu.usage.avg1m[system])}",
    label_location: -1,
    x: 480,
    y: 300,
    elements: [{ hostid: "10708" }]
  },
  // 4. CORE02 (Dell N4032 - 2)
  {
    selementid: "4",
    elementtype: 0,
    iconid_off: "154", // Switch_(48)
    iconid_on: "0",
    iconid_disabled: "0",
    iconid_maintenance: "0",
    elementsubtype: 0,
    areatype: 0,
    width: 200,
    height: 200,
    viewtype: 0,
    use_iconmap: 0,
    evaltype: 0,
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nCPU: {?last(/{HOST.HOST}/system.cpu.usage.avg1m[system])}",
    label_location: -1,
    x: 480,
    y: 480,
    elements: [{ hostid: "10722" }]
  },
  // 5. ACC01 E02 PB
  {
    selementid: "5",
    elementtype: 0,
    iconid_off: "154", // Switch_(48)
    iconid_on: "0",
    iconid_disabled: "0",
    iconid_maintenance: "0",
    elementsubtype: 0,
    areatype: 0,
    width: 200,
    height: 200,
    viewtype: 0,
    use_iconmap: 0,
    evaltype: 0,
    label: "{HOST.NAME}\r\n{HOST.IP}",
    label_location: -1,
    x: 100,
    y: 360,
    elements: [{ hostid: "10796" }]
  },
  // 6. SW Ed Gris PB (ACC02)
  {
    selementid: "6",
    elementtype: 0,
    iconid_off: "154", // Switch_(48)
    iconid_on: "0",
    iconid_disabled: "0",
    iconid_maintenance: "0",
    elementsubtype: 0,
    areatype: 0,
    width: 200,
    height: 200,
    viewtype: 0,
    use_iconmap: 0,
    evaltype: 0,
    label: "{HOST.NAME}\r\n{HOST.IP}",
    label_location: -1,
    x: 100,
    y: 480,
    elements: [{ hostid: "10797" }]
  },
  // 7. AP Master Virtual Controller (AP Of. SAP)
  {
    selementid: "7",
    elementtype: 0,
    iconid_off: "124", // Router_(48)
    iconid_on: "0",
    iconid_disabled: "0",
    iconid_maintenance: "0",
    elementsubtype: 0,
    areatype: 0,
    width: 200,
    height: 200,
    viewtype: 0,
    use_iconmap: 0,
    evaltype: 0,
    label: "{HOST.NAME} (VC Master)\r\n{HOST.IP}",
    label_location: -1,
    x: 220,
    y: 520,
    elements: [{ hostid: "10804" }]
  },
  // 8. Edificio E03 - Switch Distribución / Acceso (Aruba 1930 8G)
  {
    selementid: "8",
    elementtype: 0,
    iconid_off: "154", // Switch_(48)
    iconid_on: "0",
    iconid_disabled: "0",
    iconid_maintenance: "0",
    elementsubtype: 0,
    areatype: 0,
    width: 200,
    height: 200,
    viewtype: 0,
    use_iconmap: 0,
    evaltype: 0,
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPoE: {?last(/{HOST.HOST}/poe.power.consumption)}",
    label_location: -1,
    x: 320,
    y: 780,
    elements: [{ hostid: "10726" }]
  },
  // 9. Galpón 01 - Switch Distribución DIS01
  {
    selementid: "9",
    elementtype: 0,
    iconid_off: "154", // Switch_(48)
    iconid_on: "0",
    iconid_disabled: "0",
    iconid_maintenance: "0",
    elementsubtype: 0,
    areatype: 0,
    width: 200,
    height: 200,
    viewtype: 0,
    use_iconmap: 0,
    evaltype: 0,
    label: "{HOST.NAME}\r\n{HOST.IP}",
    label_location: -1,
    x: 720,
    y: 160,
    elements: [{ hostid: "10799" }]
  },
  // 10. Galpón 01 - Switch Acceso ACC01
  {
    selementid: "10",
    elementtype: 0,
    iconid_off: "154", // Switch_(48)
    iconid_on: "0",
    iconid_disabled: "0",
    iconid_maintenance: "0",
    elementsubtype: 0,
    areatype: 0,
    width: 200,
    height: 200,
    viewtype: 0,
    use_iconmap: 0,
    evaltype: 0,
    label: "{HOST.NAME}\r\n{HOST.IP}",
    label_location: -1,
    x: 960,
    y: 90,
    elements: [{ hostid: "10798" }]
  },
  // 11. Galpón 01 - Switch Acceso ACC2
  {
    selementid: "11",
    elementtype: 0,
    iconid_off: "154", // Switch_(48)
    iconid_on: "0",
    iconid_disabled: "0",
    iconid_maintenance: "0",
    elementsubtype: 0,
    areatype: 0,
    width: 200,
    height: 200,
    viewtype: 0,
    use_iconmap: 0,
    evaltype: 0,
    label: "{HOST.NAME}\r\n{HOST.IP}",
    label_location: -1,
    x: 960,
    y: 230,
    elements: [{ hostid: "10800" }]
  },
  // 12. P2P Galpón 06 (Ubiquiti)
  {
    selementid: "12",
    elementtype: 0,
    iconid_off: "144", // Satellite_antenna_(48)
    iconid_on: "0",
    iconid_disabled: "0",
    iconid_maintenance: "0",
    elementsubtype: 0,
    areatype: 0,
    width: 200,
    height: 200,
    viewtype: 0,
    use_iconmap: 0,
    evaltype: 0,
    label: "{HOST.NAME}\r\n{HOST.IP}",
    label_location: -1,
    x: 1200,
    y: 90,
    elements: [{ hostid: "10803" }]
  },
  // 13. P2P Portería (Ubiquiti)
  {
    selementid: "13",
    elementtype: 0,
    iconid_off: "144", // Satellite_antenna_(48)
    iconid_on: "0",
    iconid_disabled: "0",
    iconid_maintenance: "0",
    elementsubtype: 0,
    areatype: 0,
    width: 200,
    height: 200,
    viewtype: 0,
    use_iconmap: 0,
    evaltype: 0,
    label: "{HOST.NAME}\r\n{HOST.IP}",
    label_location: -1,
    x: 1200,
    y: 230,
    elements: [{ hostid: "10820" }]
  },
  // 14. Wi-Fi Galpón (AP Abastecimiento)
  {
    selementid: "14",
    elementtype: 0,
    iconid_off: "124", // Router_(48)
    iconid_on: "0",
    iconid_disabled: "0",
    iconid_maintenance: "0",
    elementsubtype: 0,
    areatype: 0,
    width: 200,
    height: 200,
    viewtype: 0,
    use_iconmap: 0,
    evaltype: 0,
    label: "{HOST.NAME}\r\n{HOST.IP}",
    label_location: -1,
    x: 1420,
    y: 160,
    elements: [{ hostid: "10815" }]
  },
  // 15. Edificio Blanco E01 - Switch Distribución D01
  {
    selementid: "15",
    elementtype: 0,
    iconid_off: "154", // Switch_(48)
    iconid_on: "0",
    iconid_disabled: "0",
    iconid_maintenance: "0",
    elementsubtype: 0,
    areatype: 0,
    width: 200,
    height: 200,
    viewtype: 0,
    use_iconmap: 0,
    evaltype: 0,
    label: "{HOST.NAME}\r\n{HOST.IP}",
    label_location: -1,
    x: 720,
    y: 490,
    elements: [{ hostid: "10711" }]
  },
  // 16. Wi-Fi E01 - AP Administración
  {
    selementid: "16",
    elementtype: 0,
    iconid_off: "124", // Router_(48)
    iconid_on: "0",
    iconid_disabled: "0",
    iconid_maintenance: "0",
    elementsubtype: 0,
    areatype: 0,
    width: 200,
    height: 200,
    viewtype: 0,
    use_iconmap: 0,
    evaltype: 0,
    label: "{HOST.NAME}\r\n{HOST.IP}",
    label_location: -1,
    x: 950,
    y: 430,
    elements: [{ hostid: "10811" }]
  },
  // 17. Wi-Fi E01 - AP Recepción
  {
    selementid: "17",
    elementtype: 0,
    iconid_off: "124", // Router_(48)
    iconid_on: "0",
    iconid_disabled: "0",
    iconid_maintenance: "0",
    elementsubtype: 0,
    areatype: 0,
    width: 200,
    height: 200,
    viewtype: 0,
    use_iconmap: 0,
    evaltype: 0,
    label: "{HOST.NAME}\r\n{HOST.IP}",
    label_location: -1,
    x: 950,
    y: 550,
    elements: [{ hostid: "10812" }]
  },
  // 18. Clúster Wi-Fi Aruba Instant (Host Group 45)
  {
    selementid: "18",
    elementtype: 3, // Host Group
    iconid_off: "4", // Cloud_(64)
    iconid_on: "0",
    iconid_disabled: "0",
    iconid_maintenance: "0",
    elementsubtype: 0,
    areatype: 0,
    width: 200,
    height: 200,
    viewtype: 0,
    use_iconmap: 0,
    evaltype: 0,
    label: "Parque Wi-Fi ARUBA\r\n(14 Puntos de Acceso AOS-8)",
    label_location: -1,
    x: 960,
    y: 780,
    elements: [{ groupid: "45" }]
  }
];

// Enlaces con telemetría en enlaces troncales y triggers de link-down
const links = [
  // Link 1: FTG <--> CORE03 (WAN Perímetro)
  {
    selementid1: "1",
    selementid2: "2",
    drawtype: 0,
    color: "00AA00",
    label: "WAN Perímetro\r\nUP: {?last(/FTG_milicic_border1_SNMP/net.if.in[ifHCInOctets.38])}\r\nDOWN: {?last(/FTG_milicic_border1_SNMP/net.if.out[ifHCOutOctets.38])}"
  },
  // Link 2: CORE03 <--> CORE01 (Te1/0/6)
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
  // Link 3: CORE01 <--> CORE02 (Inter-Core LAG Te1/0/20)
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
    selementid2: "9",
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
    selementid2: "15",
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
    selementid2: "8",
    drawtype: 0,
    color: "00AA00",
    label: "TRK1 (Troncal E03 1Gbps)"
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
  // Link 10: DIS01 <--> ACC01 (Galpón 01 Port 3)
  {
    selementid1: "9",
    selementid2: "10",
    drawtype: 0,
    color: "00AA00",
    label: "Port 3"
  },
  // Link 11: DIS01 <--> ACC2 (Galpón 01 Port 24)
  {
    selementid1: "9",
    selementid2: "11",
    drawtype: 0,
    color: "00AA00",
    label: "Port 24"
  },
  // Link 12: ACC01 <--> P2P G06 (Ubiquiti)
  {
    selementid1: "10",
    selementid2: "12",
    drawtype: 0,
    color: "00AA00"
  },
  // Link 13: ACC2 <--> POR-P2P01 (Ubiquiti)
  {
    selementid1: "11",
    selementid2: "13",
    drawtype: 0,
    color: "00AA00"
  },
  // Link 14: DIS01 <--> AP ABASTECIMIENTO
  {
    selementid1: "9",
    selementid2: "14",
    drawtype: 0,
    color: "00AA00"
  },
  // Link 15: D01 <--> AP Administración
  {
    selementid1: "15",
    selementid2: "16",
    drawtype: 0,
    color: "00AA00"
  },
  // Link 16: D01 <--> AP RECEPCION
  {
    selementid1: "15",
    selementid2: "17",
    drawtype: 0,
    color: "00AA00"
  },
  // Link 17: AP Master VC <--> Clúster Wi-Fi ARUBA
  {
    selementid1: "7",
    selementid2: "18",
    drawtype: 2, // Dotted/dashed
    color: "0284C7", // Cyan / Aruba Blue
    label: "Aruba Virtual Controller (14 APs AOS-8)"
  }
];

// 5 Macrozonas Arquitectónicas con bordes Slate y tipografía técnica
const shapes = [
  // 1. Datacenter Core & Perímetro WAN (Edificio Gris PB)
  {
    type: 0,
    x: 30,
    y: 30,
    width: 550,
    height: 570,
    text: "Datacenter Core & Perímetro WAN (Edificio Gris PB)",
    font: 9,
    font_size: 11,
    font_color: "1E293B",
    text_halign: 0,
    text_valign: 0,
    border_type: 1,
    border_width: 1,
    border_color: "94A3B8",
    background_color: "",
    zindex: 0
  },
  // 2. Edificio E03 (Anexo Switching)
  {
    type: 0,
    x: 30,
    y: 640,
    width: 550,
    height: 280,
    text: "Edificio E03 (Anexo Switching & Taller)",
    font: 9,
    font_size: 11,
    font_color: "1E293B",
    text_halign: 0,
    text_valign: 0,
    border_type: 1,
    border_width: 1,
    border_color: "94A3B8",
    background_color: "",
    zindex: 0
  },
  // 3. Galpón 01 (G01 - Taller, Logística & Radioenlaces)
  {
    type: 0,
    x: 620,
    y: 30,
    width: 890,
    height: 310,
    text: "Galpón 01 (G01 - Taller, Logística & Radioenlaces)",
    font: 9,
    font_size: 11,
    font_color: "1E293B",
    text_halign: 0,
    text_valign: 0,
    border_type: 1,
    border_width: 1,
    border_color: "94A3B8",
    background_color: "",
    zindex: 0
  },
  // 4. Edificio Blanco (E01 - Administración & Directorio)
  {
    type: 0,
    x: 620,
    y: 370,
    width: 450,
    height: 240,
    text: "Edificio Blanco (E01 - Administración & Directorio)",
    font: 9,
    font_size: 11,
    font_color: "1E293B",
    text_halign: 0,
    text_valign: 0,
    border_type: 1,
    border_width: 1,
    border_color: "94A3B8",
    background_color: "",
    zindex: 0
  },
  // 5. Infraestructura Wi-Fi Corporativa (Aruba AOS-8)
  {
    type: 0,
    x: 620,
    y: 640,
    width: 890,
    height: 280,
    text: "Infraestructura Wi-Fi Corporativa (Aruba AOS-8)",
    font: 9,
    font_size: 11,
    font_color: "1E293B",
    text_halign: 0,
    text_valign: 0,
    border_type: 1,
    border_width: 1,
    border_color: "94A3B8",
    background_color: "",
    zindex: 0
  }
];

const updatePayload = {
  sysmapid: "12",
  name: "Network SRO v2",
  width: "1550",
  height: "960",
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
console.log('Payload de mapa v2 optimizado guardado con éxito.');
