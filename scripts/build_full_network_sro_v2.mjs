import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 29 Elementos altamente estructurados y enriquecidos con telemetría en vivo
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
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/FTG_milicic_border1_SNMP/icmppingsec)}",
    label_location: -1,
    x: 80,
    y: 130,
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
    x: 330,
    y: 130,
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
    x: 510,
    y: 270,
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
    x: 510,
    y: 470,
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
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 100,
    y: 330,
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
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 100,
    y: 470,
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
    label: "{HOST.NAME} (VC Master)\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 230,
    y: 520,
    elements: [{ hostid: "10804" }]
  },
  // 8. SRO-ESX01 (VMware Hipervisor 1)
  {
    selementid: "8",
    elementtype: 0,
    iconid_off: "149", // Server_(48)
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
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/SRO-ESX01/icmppingsec)}",
    label_location: -1,
    x: 80,
    y: 740,
    elements: [{ hostid: "10704" }]
  },
  // 9. SRO-ESX02 (VMware Hipervisor 2)
  {
    selementid: "9",
    elementtype: 0,
    iconid_off: "149", // Server_(48)
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
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/SRO-ESX02/icmppingsec)}",
    label_location: -1,
    x: 220,
    y: 740,
    elements: [{ hostid: "10705" }]
  },
  // 10. SRO-STO01 (Storage HPE MSA 2060)
  {
    selementid: "10",
    elementtype: 0,
    iconid_off: "149", // Server_(48)
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
    label: "{HOST.NAME} (HPE MSA)\r\n{HOST.IP}\r\nPing: {?last(/SRO-STO01/icmppingsec)}",
    label_location: -1,
    x: 360,
    y: 740,
    elements: [{ hostid: "10706" }]
  },
  // 11. SRO-DCO01 (FSMO Domain Controller)
  {
    selementid: "11",
    elementtype: 0,
    iconid_off: "149", // Server_(48)
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
    label: "{HOST.NAME} (DC FSMO)\r\n{HOST.IP}\r\nCPU: {?last(/SRO-DCO01/system.cpu.util)}%",
    label_location: -1,
    x: 500,
    y: 740,
    elements: [{ hostid: "10699" }]
  },
  // 12. UPS SRO CORE (Emerson)
  {
    selementid: "12",
    elementtype: 0,
    iconid_off: "164", // UPS_rackmountable_2D_(48)
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
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nCarga: {?last(/UPS_Emerson/ups.load.percent)}%\r\nBat: {?last(/UPS_Emerson/upsEstimatedMinutesRemaining)} min",
    label_location: -1,
    x: 160,
    y: 930,
    elements: [{ hostid: "10792" }]
  },
  // 13. UPS Edificio Gris PB
  {
    selementid: "13",
    elementtype: 0,
    iconid_off: "164", // UPS_rackmountable_2D_(48)
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
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nCarga: {?last(/SRO-UPS-E02-P00/ups.load.calc)}%\r\nBat: {?last(/SRO-UPS-E02-P00/upsEstimatedMinutesRemaining)} min",
    label_location: -1,
    x: 430,
    y: 930,
    elements: [{ hostid: "10801" }]
  },
  // 14. Edificio E03 - Switch D03 (Aruba 1930 8G)
  {
    selementid: "14",
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
    x: 750,
    y: 770,
    elements: [{ hostid: "10726" }]
  },
  // 15. UPS E02 PA
  {
    selementid: "15",
    elementtype: 0,
    iconid_off: "164", // UPS_rackmountable_2D_(48)
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
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nSNMP: {?last(/UPS E02 PA/zabbix[host,snmp,available])}",
    label_location: -1,
    x: 930,
    y: 770,
    elements: [{ hostid: "10802" }]
  },
  // 16. Galpón 01 - Switch Distribución DIS01
  {
    selementid: "16",
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
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 750,
    y: 150,
    elements: [{ hostid: "10799" }]
  },
  // 17. Galpón 01 - Switch Acceso ACC01
  {
    selementid: "17",
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
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 1000,
    y: 90,
    elements: [{ hostid: "10798" }]
  },
  // 18. Galpón 01 - Switch Acceso ACC2
  {
    selementid: "18",
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
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 1000,
    y: 230,
    elements: [{ hostid: "10800" }]
  },
  // 19. P2P Galpón 06 (Ubiquiti)
  {
    selementid: "19",
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
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 1240,
    y: 90,
    elements: [{ hostid: "10803" }]
  },
  // 20. P2P Portería (Ubiquiti)
  {
    selementid: "20",
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
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 1240,
    y: 230,
    elements: [{ hostid: "10820" }]
  },
  // 21. Wi-Fi Galpón (AP Abastecimiento)
  {
    selementid: "21",
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
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 1470,
    y: 90,
    elements: [{ hostid: "10815" }]
  },
  // 22. Wi-Fi Galpón (AP Pañol)
  {
    selementid: "22",
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
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 1470,
    y: 230,
    elements: [{ hostid: "10816" }]
  },
  // 23. UPS GALPON 01
  {
    selementid: "23",
    elementtype: 0,
    iconid_off: "164", // UPS_rackmountable_2D_(48)
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
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nCarga: {?last(/UPS GALPON 01/ups.output.load.estimated)}%",
    label_location: -1,
    x: 1640,
    y: 160,
    elements: [{ hostid: "10819" }]
  },
  // 24. Edificio Blanco E01 - Switch Distribución D01
  {
    selementid: "24",
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
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 750,
    y: 500,
    elements: [{ hostid: "10711" }]
  },
  // 25. Wi-Fi E01 - AP Administración
  {
    selementid: "25",
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
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 980,
    y: 450,
    elements: [{ hostid: "10811" }]
  },
  // 26. Wi-Fi E01 - AP Recepción
  {
    selementid: "26",
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
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 980,
    y: 560,
    elements: [{ hostid: "10812" }]
  },
  // 27. Clúster Wi-Fi Aruba Instant (Host Group 45)
  {
    selementid: "27",
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
    label: "Parque Wi-Fi ARUBA\r\n(14 APs AOS-8 Clúster)",
    label_location: -1,
    x: 1380,
    y: 800,
    elements: [{ groupid: "45" }]
  },
  // 28. Wi-Fi E01 - AP Directorio
  {
    selementid: "28",
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
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 1200,
    y: 730,
    elements: [{ hostid: "10813" }]
  },
  // 29. Wi-Fi E01 - AP Gerencias
  {
    selementid: "29",
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
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 1200,
    y: 910,
    elements: [{ hostid: "10814" }]
  },
  // 30. Wi-Fi EG - AP AIMI
  {
    selementid: "30",
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
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 1560,
    y: 730,
    elements: [{ hostid: "10808" }]
  },
  // 31. Wi-Fi EG - AP Ger. Compras
  {
    selementid: "31",
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
    label: "{HOST.NAME}\r\n{HOST.IP}\r\nPing: {?last(/{HOST.HOST}/icmppingsec)}",
    label_location: -1,
    x: 1560,
    y: 910,
    elements: [{ hostid: "10806" }]
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
    selementid2: "16",
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
    selementid2: "24",
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
    selementid2: "14",
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
  // Link 10: CORE01 <--> SRO-ESX01
  {
    selementid1: "3",
    selementid2: "8",
    drawtype: 0,
    color: "00AA00"
  },
  // Link 11: CORE01 <--> SRO-ESX02
  {
    selementid1: "3",
    selementid2: "9",
    drawtype: 0,
    color: "00AA00"
  },
  // Link 12: CORE01 <--> SRO-STO01
  {
    selementid1: "3",
    selementid2: "10",
    drawtype: 0,
    color: "00AA00"
  },
  // Link 13: CORE01 <--> SRO-DCO01
  {
    selementid1: "3",
    selementid2: "11",
    drawtype: 0,
    color: "00AA00"
  },
  // Link 14: CORE01 <--> UPS SRO CORE
  {
    selementid1: "3",
    selementid2: "12",
    drawtype: 2,
    color: "FAAD14"
  },
  // Link 15: ACC01 <--> UPS Ed Gris PB
  {
    selementid1: "5",
    selementid2: "13",
    drawtype: 2,
    color: "FAAD14"
  },
  // Link 16: D03 <--> UPS E02 PA
  {
    selementid1: "14",
    selementid2: "15",
    drawtype: 2,
    color: "FAAD14"
  },
  // Link 17: DIS01 <--> ACC01 (Galpón 01 Port 3)
  {
    selementid1: "16",
    selementid2: "17",
    drawtype: 0,
    color: "00AA00",
    label: "Port 3"
  },
  // Link 18: DIS01 <--> ACC2 (Galpón 01 Port 24)
  {
    selementid1: "16",
    selementid2: "18",
    drawtype: 0,
    color: "00AA00",
    label: "Port 24"
  },
  // Link 19: ACC01 <--> P2P G06 (Ubiquiti)
  {
    selementid1: "17",
    selementid2: "19",
    drawtype: 0,
    color: "00AA00"
  },
  // Link 20: ACC2 <--> POR-P2P01 (Ubiquiti)
  {
    selementid1: "18",
    selementid2: "20",
    drawtype: 0,
    color: "00AA00"
  },
  // Link 21: DIS01 <--> AP ABASTECIMIENTO
  {
    selementid1: "16",
    selementid2: "21",
    drawtype: 0,
    color: "00AA00"
  },
  // Link 22: DIS01 <--> AP PAÑOL
  {
    selementid1: "16",
    selementid2: "22",
    drawtype: 0,
    color: "00AA00"
  },
  // Link 23: DIS01 <--> UPS GALPON 01
  {
    selementid1: "16",
    selementid2: "23",
    drawtype: 2,
    color: "FAAD14"
  },
  // Link 24: D01 <--> AP Administración
  {
    selementid1: "24",
    selementid2: "25",
    drawtype: 0,
    color: "00AA00"
  },
  // Link 25: D01 <--> AP RECEPCION
  {
    selementid1: "24",
    selementid2: "26",
    drawtype: 0,
    color: "00AA00"
  },
  // Link 26: AP Master VC <--> Clúster Wi-Fi ARUBA
  {
    selementid1: "7",
    selementid2: "27",
    drawtype: 2, // Dotted/dashed
    color: "0284C7", // Cyan / Aruba Blue
    label: "Aruba Virtual Controller (14 APs AOS-8)"
  },
  // Link 27: Clúster Wi-Fi <--> AP Directorio
  {
    selementid1: "27",
    selementid2: "28",
    drawtype: 2,
    color: "0284C7"
  },
  // Link 28: Clúster Wi-Fi <--> AP Gerencias
  {
    selementid1: "27",
    selementid2: "29",
    drawtype: 2,
    color: "0284C7"
  },
  // Link 29: Clúster Wi-Fi <--> AP AIMI
  {
    selementid1: "27",
    selementid2: "30",
    drawtype: 2,
    color: "0284C7"
  },
  // Link 30: Clúster Wi-Fi <--> AP Ger. Compras
  {
    selementid1: "27",
    selementid2: "31",
    drawtype: 2,
    color: "0284C7"
  }
];

// 6 Macrozonas Arquitectónicas con bordes Slate y tipografía técnica
const shapes = [
  // 1. Datacenter Core & Perímetro WAN (Edificio Gris PB)
  {
    type: 0,
    x: 30,
    y: 30,
    width: 610,
    height: 590,
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
  // 2. Datacenter Cómputo, Virtualización & Energía
  {
    type: 0,
    x: 30,
    y: 650,
    width: 610,
    height: 390,
    text: "Datacenter Cómputo, Virtualización & Energía (Facilities)",
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
  // 3. Edificio E03 (Anexo Switching & Taller)
  {
    type: 0,
    x: 670,
    y: 650,
    width: 380,
    height: 390,
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
  // 4. Galpón 01 (G01 - Taller, Logística & Radioenlaces)
  {
    type: 0,
    x: 670,
    y: 30,
    width: 1090,
    height: 340,
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
  // 5. Edificio Blanco (E01 - Administración & Directorio)
  {
    type: 0,
    x: 670,
    y: 390,
    width: 480,
    height: 230,
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
  // 6. Infraestructura Wi-Fi Corporativa (Aruba AOS-8)
  {
    type: 0,
    x: 1080,
    y: 650,
    width: 680,
    height: 390,
    text: "Infraestructura Wi-Fi Corporativa (Aruba Instant AOS-8)",
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
  width: "1790",
  height: "1070",
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
console.log('Payload completo de Network SRO v2 generado con 31 selements, 30 links y 6 shapes.');
