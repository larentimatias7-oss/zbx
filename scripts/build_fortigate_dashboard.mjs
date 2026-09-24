import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATASOURCE_UID = "efz4nzx8r30g0c";
const DATASOURCE_TYPE = "alexanderzobnin-zabbix-datasource";

const dashboard = {
  title: "Seguridad Perimetral & SD-WAN: FortiGate Multi-Site & Sucursales",
  uid: "milicic-fortigate-sdwan",
  tags: ["milicic", "fortigate", "fortinet", "sdwan", "firewall", "vpn", "seguridad", "networking"],
  timezone: "browser",
  schemaVersion: 40,
  time: { from: "now-6h", to: "now" },
  refresh: "30s",
  templating: {
    list: [
      {
        name: "site",
        label: "Sede / Ubicación",
        type: "custom",
        query: "Todas : .*, Central Rosario : .*border1.*, San Juan : .*ssj.*, Santa Fe : .*santa_fe.*, YPF 3er Loop : .*YPF.*, Río Tinto : .*rio_tinto.*, Sierra Grande : .*sierra_grande.*, Las Flores : .*las_flores.*, Acueducto : .*acueducto.*, Lima (Perú) : .*lima.*",
        current: { text: "Todas", value: ".*" },
        options: [
          { text: "Todas", value: ".*", selected: true },
          { text: "Central Rosario", value: ".*border1.*", selected: false },
          { text: "San Juan", value: ".*ssj.*", selected: false },
          { text: "Santa Fe", value: ".*santa_fe.*", selected: false },
          { text: "YPF 3er Loop", value: ".*YPF.*", selected: false },
          { text: "Río Tinto", value: ".*rio_tinto.*", selected: false },
          { text: "Sierra Grande", value: ".*sierra_grande.*", selected: false },
          { text: "Las Flores", value: ".*las_flores.*", selected: false },
          { text: "Acueducto", value: ".*acueducto.*", selected: false },
          { text: "Lima (Perú)", value: ".*lima.*", selected: false }
        ],
        includeAll: false,
        hide: 0
      },
      {
        name: "firewall",
        label: "Firewall FortiGate",
        type: "query",
        datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
        query: {
          queryType: "2",
          group: "/(FortiGate|FortiWorld)/",
          host: "/${site:raw}/"
        },
        current: { text: "All", value: "$__all" },
        includeAll: true,
        allValue: ".*",
        multi: true,
        refresh: 1,
        hide: 0
      }
    ]
  },
  panels: [
    // -------------------------------------------------------------
    // ROW 0: KPIS DE CIBERSEGURIDAD & ESTADO GLOBAL (y: 0, h: 4)
    // -------------------------------------------------------------
    {
      id: 1,
      title: "Firewalls en Línea",
      type: "stat",
      gridPos: { x: 0, y: 0, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "red", value: null },
              { color: "orange", value: 5 },
              { color: "#16A34A", value: 8 }
            ]
          },
          unit: "none"
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "value",
        graphMode: "none",
        textMode: "value"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "/${firewall:regex}/" },
          item: { filter: "ICMP ping" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 2,
      title: "Sesiones Concurrentes IPv4",
      type: "stat",
      gridPos: { x: 4, y: 0, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#5794F2", value: null },
              { color: "#FFC859", value: 30000 },
              { color: "#E45959", value: 80000 }
            ]
          },
          unit: "short"
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "value",
        graphMode: "area",
        textMode: "auto"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "/${firewall:regex}/" },
          item: { filter: "IPv4 Active sessions" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 3,
      title: "Intrusiones Bloqueadas (IPS)",
      type: "stat",
      gridPos: { x: 8, y: 0, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#16A34A", value: null },
              { color: "#FFC859", value: 100 },
              { color: "#E45959", value: 1000 }
            ]
          },
          unit: "short"
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "value",
        graphMode: "none",
        textMode: "auto"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "/${firewall:regex}/" },
          item: { filter: "Blocked intrusions" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 4,
      title: "Latencia Media WAN (ICMP)",
      type: "stat",
      gridPos: { x: 12, y: 0, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#16A34A", value: null },
              { color: "#FFC859", value: 0.05 },
              { color: "#E45959", value: 0.15 }
            ]
          },
          unit: "s"
        }
      },
      options: {
        reduceOptions: { calcs: ["mean"], values: false },
        colorMode: "value",
        graphMode: "area",
        textMode: "auto"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "/${firewall:regex}/" },
          item: { filter: "ICMP response time" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 5,
      title: "Estado Sincronización HA",
      type: "stat",
      gridPos: { x: 16, y: 0, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "fixed", fixedColor: "#16A34A" },
          unit: "none"
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
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "/${firewall:regex}/" },
          item: { filter: "HA config sync" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 6,
      title: "Incidentes Activos en Firewall",
      type: "stat",
      gridPos: { x: 20, y: 0, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#16A34A", value: null },
              { color: "#FFC859", value: 1 },
              { color: "#E45959", value: 3 }
            ]
          },
          unit: "none"
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "value",
        graphMode: "none",
        textMode: "auto"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "5", // Triggers
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "/${firewall:regex}/" },
          trigger: { filter: "/.*/" },
          options: {
            acknowledged: 2,
            minSeverity: 2
          }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 1: MATRIZ OPERATIVA DE SITIOS & FIREWALLS (y: 4, h: 7)
    // -------------------------------------------------------------
    {
      id: 10,
      title: "Matriz Operativa de Sitios & Dispositivos FortiGate",
      type: "table",
      gridPos: { x: 0, y: 4, w: 24, h: 7 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          custom: {
            align: "auto",
            cellOptions: { type: "auto" }
          }
        },
        overrides: [
          {
            matcher: { id: "byName", options: "ICMP ping" },
            properties: [
              { id: "custom.cellOptions", value: { type: "color-background" } },
              {
                id: "thresholds",
                value: {
                  mode: "absolute",
                  steps: [
                    { color: "#E45959", value: null },
                    { color: "#16A34A", value: 1 }
                  ]
                }
              }
            ]
          },
          {
            matcher: { id: "byName", options: "CPU utilization" },
            properties: [
              { id: "unit", value: "percent" },
              { id: "custom.cellOptions", value: { type: "gauge", mode: "basic" } },
              {
                id: "thresholds",
                value: {
                  mode: "absolute",
                  steps: [
                    { color: "#16A34A", value: null },
                    { color: "#FFC859", value: 60 },
                    { color: "#E45959", value: 85 }
                  ]
                }
              }
            ]
          },
          {
            matcher: { id: "byName", options: "Memory utilization" },
            properties: [
              { id: "unit", value: "percent" },
              { id: "custom.cellOptions", value: { type: "gauge", mode: "basic" } },
              {
                id: "thresholds",
                value: {
                  mode: "absolute",
                  steps: [
                    { color: "#16A34A", value: null },
                    { color: "#FFC859", value: 70 },
                    { color: "#E45959", value: 90 }
                  ]
                }
              }
            ]
          },
          {
            matcher: { id: "byName", options: "ICMP response time" },
            properties: [
              { id: "unit", value: "s" }
            ]
          }
        ]
      },
      transformations: [
        {
          id: "reduce",
          options: {
            reducers: ["lastNotNull"]
          }
        }
      ],
      targets: [
        {
          refId: "Ping",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "/${firewall:regex}/" },
          item: { filter: "ICMP ping" },
          resultFormat: "time_series"
        },
        {
          refId: "CPU",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "/${firewall:regex}/" },
          item: { filter: "CPU utilization" },
          resultFormat: "time_series"
        },
        {
          refId: "RAM",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "/${firewall:regex}/" },
          item: { filter: "Memory utilization" },
          resultFormat: "time_series"
        },
        {
          refId: "Sessions",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "/${firewall:regex}/" },
          item: { filter: "IPv4 Active sessions" },
          resultFormat: "time_series"
        },
        {
          refId: "RTT",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "/${firewall:regex}/" },
          item: { filter: "ICMP response time" },
          resultFormat: "time_series"
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 1.5: SATURACIÓN WAN & TRÁFICO AGREGADO DE INTERNET (y: 11, h: 6)
    // -------------------------------------------------------------
    {
      id: 15,
      title: "Saturación Enlace WAN Telecom / TASA (% sobre 300 Mbps)",
      type: "gauge",
      gridPos: { x: 0, y: 11, w: 6, h: 6 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "bps",
          min: 0,
          max: 300000000,
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#16A34A", value: null },
              { color: "#FFC859", value: 180000000 },
              { color: "#E45959", value: 240000000 }
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
          refId: "In",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "FTG_milicic_border1_SNMP" },
          item: { filter: "Interface port14(tasa): Bits received" },
          resultFormat: "time_series"
        },
        {
          refId: "Out",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "FTG_milicic_border1_SNMP" },
          item: { filter: "Interface port14(tasa): Bits sent" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 16,
      title: "Saturación Enlace WAN Claro (% sobre 100 Mbps)",
      type: "gauge",
      gridPos: { x: 6, y: 11, w: 6, h: 6 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "bps",
          min: 0,
          max: 100000000,
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#16A34A", value: null },
              { color: "#FFC859", value: 60000000 },
              { color: "#E45959", value: 85000000 }
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
          refId: "In",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "FTG_milicic_border1_SNMP" },
          item: { filter: "Interface port15(claro): Bits received" },
          resultFormat: "time_series"
        },
        {
          refId: "Out",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "FTG_milicic_border1_SNMP" },
          item: { filter: "Interface port15(claro): Bits sent" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 17,
      title: "Tráfico Agregado de Internet Multi-Sitio (Throughput Flota FortiGate)",
      type: "timeseries",
      gridPos: { x: 12, y: 11, w: 12, h: 6 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          custom: {
            drawStyle: "line",
            lineInterpolation: "smooth",
            lineWidth: 2,
            fillOpacity: 15
          },
          unit: "bps"
        }
      },
      options: {
        legend: { displayMode: "table", placement: "right", calcs: ["lastNotNull", "max"] }
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "/FTG_.*_SNMP/" },
          item: { filter: "/Interface (port14|port15|wan1|wan2).*Bits (received|sent)/i" },
          resultFormat: "time_series"
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 2: INTELIGENCIA DE TRÁFICO AVANZADA - HEATMAP & SANKEY (y: 17, h: 8)
    // -------------------------------------------------------------
    {
      id: 18,
      title: "Matriz 24x7: Patrón Horario de Saturación de Internet WAN (Hourly Heatmap)",
      type: "marcusolsson-hourly-heatmap-panel",
      gridPos: { x: 0, y: 17, w: 12, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      options: {
        from: 0,
        to: 23
      },
      fieldConfig: {
        defaults: {
          unit: "bps"
        }
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "FTG_milicic_border1_SNMP" },
          item: { filter: "Interface port14(tasa): Bits sent" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 19,
      title: "Flujo de Conectividad SD-WAN y Tráfico Multi-Sitio (Sankey Panel)",
      type: "netsage-sankey-panel",
      gridPos: { x: 12, y: 17, w: 12, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "/FTG_.*_SNMP/" },
          item: { filter: "/Interface (port14|port15|wan1|wan2).*Bits (received|sent)/i" },
          resultFormat: "time_series"
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 3: CIBERSEGURIDAD & SESIONES IPV4 (y: 25, h: 8)
    // -------------------------------------------------------------
    {
      id: 20,
      title: "Sesiones Concurrentes IPv4 por Firewall (Capacidad de Conexiones)",
      type: "timeseries",
      gridPos: { x: 0, y: 25, w: 12, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          custom: {
            drawStyle: "line",
            lineInterpolation: "smooth",
            lineWidth: 2,
            fillOpacity: 15
          },
          unit: "short"
        }
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "/${firewall:regex}/" },
          item: { filter: "IPv4 Active sessions" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 21,
      title: "Detección y Bloqueo de Amenazas (Motor IPS FortiOS)",
      type: "timeseries",
      gridPos: { x: 12, y: 25, w: 12, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          custom: {
            drawStyle: "line",
            lineInterpolation: "linear",
            lineWidth: 2,
            fillOpacity: 10
          },
          unit: "short"
        }
      },
      targets: [
        {
          refId: "Blocked",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "/${firewall:regex}/" },
          item: { filter: "/(Blocked intrusions|Detected critical intrusions|Detected high intrusions|Detected anomaly based intrusions)/" },
          resultFormat: "time_series"
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 4: COMPUTO DE FIREWALLS - CPU & MEMORIA (y: 33, h: 8)
    // -------------------------------------------------------------
    {
      id: 30,
      title: "Utilización de CPU en Firewalls (fgSysCpuUsage)",
      type: "timeseries",
      gridPos: { x: 0, y: 33, w: 12, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          custom: {
            drawStyle: "line",
            lineInterpolation: "smooth",
            lineWidth: 2,
            fillOpacity: 12
          },
          unit: "percent",
          min: 0,
          max: 100,
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "green", value: null },
              { color: "#FFC859", value: 65 },
              { color: "#E45959", value: 85 }
            ]
          }
        }
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "/${firewall:regex}/" },
          item: { filter: "CPU utilization" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 31,
      title: "Saturación de Memoria RAM en Firewalls (memoryUsedPercentage)",
      type: "timeseries",
      gridPos: { x: 12, y: 33, w: 12, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          custom: {
            drawStyle: "line",
            lineInterpolation: "smooth",
            lineWidth: 2,
            fillOpacity: 12
          },
          unit: "percent",
          min: 0,
          max: 100,
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "green", value: null },
              { color: "#FFC859", value: 70 },
              { color: "#E45959", value: 90 }
            ]
          }
        }
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "/${firewall:regex}/" },
          item: { filter: "Memory utilization" },
          resultFormat: "time_series"
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 5: LATENCIA WAN & TRÁFICO DE INTERFACES (y: 41, h: 8)
    // -------------------------------------------------------------
    {
      id: 40,
      title: "Throughput de Red en Interfaces FortiGate (Bits In / Out)",
      type: "timeseries",
      gridPos: { x: 0, y: 41, w: 12, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          custom: {
            drawStyle: "line",
            lineInterpolation: "smooth",
            lineWidth: 1.5,
            fillOpacity: 10
          },
          unit: "bps"
        }
      },
      targets: [
        {
          refId: "In",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "/${firewall:regex}/" },
          item: { filter: "/Interface (port[0-9]+|wan[0-9]*|internal|dmz).*Bits (received|sent)/i" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 41,
      title: "Calidad de Enlace WAN (Latencia ICMP & Jitter)",
      type: "timeseries",
      gridPos: { x: 12, y: 41, w: 12, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          custom: {
            drawStyle: "line",
            lineInterpolation: "smooth",
            lineWidth: 2,
            fillOpacity: 10
          },
          unit: "s"
        }
      },
      targets: [
        {
          refId: "RTT",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "/${firewall:regex}/" },
          item: { filter: "ICMP response time" },
          resultFormat: "time_series"
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 6: INCIDENTES ACTIVOS EN FIREWALL (y: 49, h: 6)
    // -------------------------------------------------------------
    {
      id: 50,
      title: "Incidentes Activos en Equipamiento FortiGate (Alertas Zabbix)",
      type: "table",
      gridPos: { x: 0, y: 49, w: 24, h: 6 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "5", // Triggers
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "/${firewall:regex}/" },
          trigger: { filter: "/.*/" },
          options: {
            acknowledged: 2,
            minSeverity: 1
          }
        }
      ]
    }
  ]
};

// Respaldo local
const backupDir = path.join(__dirname, '..', '.zabbix_context', 'dashboards');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}
const backupPath = path.join(backupDir, 'milicic-fortigate-sdwan.json');
fs.writeFileSync(backupPath, JSON.stringify(dashboard, null, 2), 'utf8');
console.log(`[Backup] Dashboard guardado localmente en: ${backupPath}`);

// Despliegue en Grafana
let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const payload = JSON.stringify({
  dashboard: dashboard,
  folderUid: "milicic-observability",
  overwrite: true
});

console.log(`Desplegando en Grafana en carpeta "Milicic Observabilidad"...`);
const req = http.request('http://172.27.210.154:3005/api/dashboards/db', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${grafanaToken}`,
    'Content-Length': Buffer.byteLength(payload)
  }
}, res => {
  let b = '';
  res.on('data', d => b += d);
  res.on('end', () => {
    console.log('HTTP Status:', res.statusCode);
    try {
      const parsed = JSON.parse(b);
      console.log('Respuesta de Grafana API:', JSON.stringify(parsed, null, 2));
      if (parsed.status === 'success') {
        console.log(`\n¡DASHBOARD FORTIGATE DESPLEGADO CON ÉXITO!`);
        console.log(`URL: http://172.27.210.154:3005${parsed.url}`);
      } else {
        console.error('Fallo en despliegue:', b);
        process.exit(1);
      }
    } catch (e) {
      console.log('Respuesta cruda:', b);
    }
  });
});

req.on('error', err => {
  console.error('Error de red:', err);
  process.exit(1);
});

req.write(payload);
req.end();
