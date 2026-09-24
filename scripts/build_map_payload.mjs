import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const selements = [
  // 1. Firewall Perimetral
  {
    selementid: "1",
    elementtype: 0,
    iconid_off: "27", // Firewall_(24)
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
    x: 60,
    y: 440,
    elements: [{ hostid: "10697" }] // FTG_milicic_border1_SNMP
  },
  // 2. Switch Core03 (Aruba 1930 48G)
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
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPoE: {?last(/{HOST.HOST}/poe.power.consumption)}W",
    label_location: -1,
    x: 180,
    y: 440,
    elements: [{ hostid: "10724" }] // SRO-E02-PB00-CORE03
  },
  // 3. Switch Core01 (Dell N4032 - 1)
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
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nCPU: {?last(/{HOST.HOST}/system.cpu.util[switchCpuStat.0])}%",
    label_location: -1,
    x: 290,
    y: 350,
    elements: [{ hostid: "10708" }] // SRO-E02-PB00-CORE01
  },
  // 4. Switch Core02 (Dell N4032 - 2)
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
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nCPU: {?last(/{HOST.HOST}/system.cpu.util[switchCpuStat.0])}%",
    label_location: -1,
    x: 290,
    y: 530,
    elements: [{ hostid: "10722" }] // SRO-E02-PB00-CORE02
  },
  // 5. Galpón 01 - Switch Distribución DIS01
  {
    selementid: "5",
    elementtype: 0,
    iconid_off: "153", // Switch_(24)
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
    x: 480,
    y: 120,
    elements: [{ hostid: "10799" }] // SRO-G01-P100-DIS01
  },
  // 6. Galpón 01 - Switch Acceso ACC01
  {
    selementid: "6",
    elementtype: 0,
    iconid_off: "153", // Switch_(24)
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
    x: 680,
    y: 70,
    elements: [{ hostid: "10798" }] // SRO-G01-P100-ACC01
  },
  // 7. Galpón 01 - Switch Acceso ACC2
  {
    selementid: "7",
    elementtype: 0,
    iconid_off: "153", // Switch_(24)
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
    x: 680,
    y: 170,
    elements: [{ hostid: "10800" }] // SRO-G01-P000-ACC2
  },
  // 8. P2P Galpón 06 (Ubiquiti)
  {
    selementid: "8",
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
    x: 880,
    y: 70,
    elements: [{ hostid: "10803" }] // SRO-P2P-G06
  },
  // 9. P2P Portería (Ubiquiti)
  {
    selementid: "9",
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
    x: 880,
    y: 170,
    elements: [{ hostid: "10820" }] // SRO-POR-P2P01
  },
  // 10. Wi-Fi Galpón (AP Abastecimiento)
  {
    selementid: "10",
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
    x: 1080,
    y: 120,
    elements: [{ hostid: "10815" }] // SRO-G01-P01-WAP-ABA
  },
  // 11. Edificio Blanco E01 - Switch Distribución D01
  {
    selementid: "11",
    elementtype: 0,
    iconid_off: "153", // Switch_(24)
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
    x: 480,
    y: 440,
    elements: [{ hostid: "10711" }] // SRO-E01-P00-D01
  },
  // 12. Wi-Fi E01 - AP Administración
  {
    selementid: "12",
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
    x: 700,
    y: 390,
    elements: [{ hostid: "10811" }] // AP Administración
  },
  // 13. Wi-Fi E01 - AP Recepción
  {
    selementid: "13",
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
    x: 700,
    y: 490,
    elements: [{ hostid: "10812" }] // AP RECEPCION
  },
  // 14. Edificio Gris E02 - Switch Acceso 1
  {
    selementid: "14",
    elementtype: 0,
    iconid_off: "153", // Switch_(24)
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
    x: 480,
    y: 700,
    elements: [{ hostid: "10796" }] // SRO-E02-PB00-ACC01
  },
  // 15. Edificio Gris E02 - Switch Acceso 2 (SW Ed Gris PB)
  {
    selementid: "15",
    elementtype: 0,
    iconid_off: "153", // Switch_(24)
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
    x: 480,
    y: 830,
    elements: [{ hostid: "10797" }] // SW Ed Gris PB
  },
  // 16. Wi-Fi E02 - AP Master Virtual Controller
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
    label: "{HOST.NAME} (VC Master)\r\n{HOST.IP}",
    label_location: -1,
    x: 700,
    y: 760,
    elements: [{ hostid: "10804" }] // AP Of. SAP
  },
  // 17. Edificio E03 - Switch Distribución / Acceso (Aruba 1930 8G)
  {
    selementid: "17",
    elementtype: 0,
    iconid_off: "153", // Switch_(24)
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
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPoE: {?last(/{HOST.HOST}/poe.power.consumption)}W",
    label_location: -1,
    x: 1000,
    y: 440,
    elements: [{ hostid: "10726" }] // SRO-E03-P00-D03
  },
  // 18. Clúster Wi-Fi Aruba Instant (Host Group 45)
  {
    selementid: "18",
    elementtype: 3, // Host Group (3 en Zabbix!)
    iconid_off: "1", // Cloud_(128)
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
    x: 1050,
    y: 740,
    elements: [{ groupid: "45" }] // ARUBA APs
  }
];

const links = [
  // Link 1: FTG <--> CORE03
  {
    selementid1: "1",
    selementid2: "2",
    drawtype: 0,
    color: "00CC00",
    label: "WAN / LAN Perímetro\r\nUP: {?last(/FTG_milicic_border1_SNMP/net.if.in[ifHCInOctets.38])}\r\nDOWN: {?last(/FTG_milicic_border1_SNMP/net.if.out[ifHCOutOctets.38])}"
  },
  // Link 2: CORE03 <--> CORE01
  {
    selementid1: "2",
    selementid2: "3",
    drawtype: 0,
    color: "00CC00",
    label: "Te1/0/6 (Uplink 1930 SW211)\r\nRX: {?last(/SRO-E02-PB00-CORE01/net.if.in[ifHCInOctets.6])}\r\nTX: {?last(/SRO-E02-PB00-CORE01/net.if.out[ifHCOutOctets.6])}"
  },
  // Link 3: CORE01 <--> CORE02 (Inter-Core LAG)
  {
    selementid1: "3",
    selementid2: "4",
    drawtype: 0,
    color: "00CC00",
    label: "Te1/0/20 (Inter-Core LAG)\r\nRX: {?last(/SRO-E02-PB00-CORE01/net.if.in[ifHCInOctets.20])}\r\nTX: {?last(/SRO-E02-PB00-CORE01/net.if.out[ifHCOutOctets.20])}"
  },
  // Link 4: CORE01 <--> DIS01 (Troncal Galpón 01)
  {
    selementid1: "3",
    selementid2: "5",
    drawtype: 0,
    color: "00CC00",
    label: "Te1/0/8 (Uplink Galpones)\r\nRX: {?last(/SRO-E02-PB00-CORE01/net.if.in[ifHCInOctets.8])}\r\nTX: {?last(/SRO-E02-PB00-CORE01/net.if.out[ifHCOutOctets.8])}"
  },
  // Link 5: DIS01 <--> ACC01
  {
    selementid1: "5",
    selementid2: "6",
    drawtype: 0,
    color: "00CC00",
    label: "Port 3\r\nRX: {?last(/SRO-G01-P100-DIS01/net.if.in[ifHCInOctets.3])}\r\nTX: {?last(/SRO-G01-P100-DIS01/net.if.out[ifHCOutOctets.3])}"
  },
  // Link 6: DIS01 <--> ACC2
  {
    selementid1: "5",
    selementid2: "7",
    drawtype: 0,
    color: "00CC00",
    label: "Port 24\r\nRX: {?last(/SRO-G01-P100-DIS01/net.if.in[ifHCInOctets.24])}\r\nTX: {?last(/SRO-G01-P100-DIS01/net.if.out[ifHCOutOctets.24])}"
  },
  // Link 7: ACC01 <--> P2P G06
  {
    selementid1: "6",
    selementid2: "8",
    drawtype: 0,
    color: "00CC00",
    label: "Radioenlace P2P G06"
  },
  // Link 8: ACC2 <--> POR-P2P01
  {
    selementid1: "7",
    selementid2: "9",
    drawtype: 0,
    color: "00CC00",
    label: "Radioenlace Portería"
  },
  // Link 9: DIS01 <--> AP Abastecimiento
  {
    selementid1: "5",
    selementid2: "10",
    drawtype: 0,
    color: "00CC00",
    label: "PoE Wi-Fi G01"
  },
  // Link 10: CORE01 <--> D01 (Edificio Blanco E01)
  {
    selementid1: "3",
    selementid2: "11",
    drawtype: 0,
    color: "00CC00",
    label: "Te1/0/5 (Uplink Edificio Blanco)\r\nRX: {?last(/SRO-E02-PB00-CORE01/net.if.in[ifHCInOctets.5])}\r\nTX: {?last(/SRO-E02-PB00-CORE01/net.if.out[ifHCOutOctets.5])}"
  },
  // Link 11: D01 <--> AP Administración
  {
    selementid1: "11",
    selementid2: "12",
    drawtype: 0,
    color: "00CC00",
    label: "PoE AP Admin"
  },
  // Link 12: D01 <--> AP Recepción
  {
    selementid1: "11",
    selementid2: "13",
    drawtype: 0,
    color: "00CC00",
    label: "PoE AP Recep"
  },
  // Link 13: CORE01 <--> ACC01 (Edificio Gris E02)
  {
    selementid1: "3",
    selementid2: "14",
    drawtype: 0,
    color: "00CC00",
    label: "Acceso E02 PB"
  },
  // Link 14: CORE01 <--> SW Ed Gris PB (ACC02)
  {
    selementid1: "3",
    selementid2: "15",
    drawtype: 0,
    color: "00CC00",
    label: "Acceso E02 PB"
  },
  // Link 15: ACC01 <--> AP Master VC
  {
    selementid1: "14",
    selementid2: "16",
    drawtype: 0,
    color: "00CC00",
    label: "PoE AP Master"
  },
  // Link 16: CORE03 <--> D03 (Edificio E03 Aruba 1930)
  {
    selementid1: "2",
    selementid2: "17",
    drawtype: 0,
    color: "00CC00",
    label: "Troncal E03 (Aruba 1930 8G PoE)"
  },
  // Link 17: CORE03 <--> Clúster Wi-Fi ARUBA
  {
    selementid1: "2",
    selementid2: "18",
    drawtype: 2,
    color: "00AAFF",
    label: "14 APs AOS-8 Clúster"
  }
];

const shapes = [
  // Shape 1: Perímetro WAN & Datacenter Core (E02 PB)
  {
    type: 0, // Rectangle
    x: 30,
    y: 280,
    width: 350,
    height: 340,
    text: "Datacenter Core & Perímetro WAN (E02 PB)",
    font: 9,
    font_size: 11,
    font_color: "000000",
    text_halign: 1,
    text_valign: 1,
    border_type: 1,
    border_width: 2,
    border_color: "000000",
    background_color: "",
    zindex: 0
  },
  // Shape 2: Galpón 01 (G01)
  {
    type: 0,
    x: 420,
    y: 20,
    width: 930,
    height: 250,
    text: "Galpón 01 (G01 - Taller, Logística & P2P)",
    font: 9,
    font_size: 11,
    font_color: "000000",
    text_halign: 1,
    text_valign: 1,
    border_type: 1,
    border_width: 2,
    border_color: "000000",
    background_color: "",
    zindex: 0
  },
  // Shape 3: Edificio Blanco (E01)
  {
    type: 0,
    x: 420,
    y: 310,
    width: 440,
    height: 250,
    text: "Edificio Blanco (E01 - Administración & Directorio)",
    font: 9,
    font_size: 11,
    font_color: "000000",
    text_halign: 1,
    text_valign: 1,
    border_type: 1,
    border_width: 2,
    border_color: "000000",
    background_color: "",
    zindex: 0
  },
  // Shape 4: Edificio Gris (E02)
  {
    type: 0,
    x: 420,
    y: 600,
    width: 440,
    height: 330,
    text: "Edificio Gris (E02 - PB & Gerencias Operativas)",
    font: 9,
    font_size: 11,
    font_color: "000000",
    text_halign: 1,
    text_valign: 1,
    border_type: 1,
    border_width: 2,
    border_color: "000000",
    background_color: "",
    zindex: 0
  },
  // Shape 5: Edificio E03
  {
    type: 0,
    x: 900,
    y: 310,
    width: 450,
    height: 250,
    text: "Edificio E03 (Anexo Switching)",
    font: 9,
    font_size: 11,
    font_color: "000000",
    text_halign: 1,
    text_valign: 1,
    border_type: 1,
    border_width: 2,
    border_color: "000000",
    background_color: "",
    zindex: 0
  },
  // Shape 6: Clúster Wi-Fi Aruba Instant
  {
    type: 0,
    x: 900,
    y: 600,
    width: 450,
    height: 330,
    text: "Infraestructura Wi-Fi Corporativa (Aruba AOS-8)",
    font: 9,
    font_size: 11,
    font_color: "000000",
    text_halign: 1,
    text_valign: 1,
    border_type: 1,
    border_width: 2,
    border_color: "000000",
    background_color: "",
    zindex: 0
  }
];

const mapData = {
  name: "Network SRO v2",
  width: "1400",
  height: "980",
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

fs.writeFileSync(path.resolve(__dirname, '../.zabbix_context/dashboards/network_sro_v2.json'), JSON.stringify(mapData, null, 2));
console.log('Payload generado exitosamente.');
