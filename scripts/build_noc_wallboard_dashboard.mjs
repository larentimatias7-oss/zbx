import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken || grafanaToken.length < 10) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const DATASOURCE_UID = "efz4nzx8r30g0c";
const DATASOURCE_TYPE = "alexanderzobnin-zabbix-datasource";

const dashboard = {
  title: "MILICIC S.A. | NOC Big Screen Command Center (TV Wallboard)",
  uid: "milicic-noc-wallboard",
  tags: ["milicic", "noc", "wallboard", "bigscreen", "kiosk", "operaciones", "networking"],
  timezone: "browser",
  schemaVersion: 40,
  time: { from: "now-3h", to: "now" },
  refresh: "15s",
  panels: [
    // -------------------------------------------------------------
    // ROW 0: ENCABEZADO NOC WALLBOARD (y: 0, h: 4)
    // -------------------------------------------------------------
    {
      id: 1,
      title: "Centro de Comando NOC - Pantalla Principal de Operaciones",
      type: "marcusolsson-dynamictext-panel",
      gridPos: { x: 0, y: 0, w: 24, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      options: {
        content: `
<div style="background: linear-gradient(90deg, #0B1120 0%, #1E293B 100%); border-left: 8px solid #EA580C; padding: 18px 24px; border-radius: 8px; color: #F8FAFC; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
  <div>
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="display: inline-block; width: 14px; height: 14px; background: #22C55E; border-radius: 50%; box-shadow: 0 0 12px #22C55E;"></span>
      <h1 style="margin: 0; color: #EA580C; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">MILICIC S.A. | NOC COMMAND WALLBOARD</h1>
    </div>
    <p style="margin: 6px 0 0 0; color: #94A3B8; font-size: 14px;">Centro de Monitoreo Centralizado de Operaciones de Infraestructura, Redes y Telecomunicaciones</p>
  </div>
  <div style="display: flex; gap: 14px;">
    <div style="background: rgba(15,23,42,0.8); border: 1px solid #1E293B; padding: 8px 16px; border-radius: 6px; text-align: center;">
      <span style="color: #64748B; font-size: 11px; font-weight: bold; text-transform: uppercase;">Modo NOC</span>
      <div style="color: #38BDF8; font-size: 14px; font-weight: bold;">KIOSK 24/7</div>
    </div>
    <div style="background: rgba(15,23,42,0.8); border: 1px solid #1E293B; padding: 8px 16px; border-radius: 6px; text-align: center;">
      <span style="color: #64748B; font-size: 11px; font-weight: bold; text-transform: uppercase;">Red Core 10G</span>
      <div style="color: #22C55E; font-size: 14px; font-weight: bold;">OPERATIVO</div>
    </div>
    <div style="background: rgba(15,23,42,0.8); border: 1px solid #1E293B; padding: 8px 16px; border-radius: 6px; text-align: center;">
      <span style="color: #64748B; font-size: 11px; font-weight: bold; text-transform: uppercase;">Sala UPS</span>
      <div style="color: #F59E0B; font-size: 14px; font-weight: bold;">ONLINE</div>
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
    // ROW 1: 6 HIGH-VISIBILITY GLANCEABLE METRIC BLOCKS (y: 4, h: 4)
    // -------------------------------------------------------------
    {
      id: 2,
      title: "Tráfico WAN Principal (TASA Fibra)",
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
              { color: "#0284C7", value: null },
              { color: "#F59E0B", value: 150000000 },
              { color: "#EF4444", value: 250000000 }
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
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "FTG_milicic_border1_SNMP" },
          item: { filter: "Interface port14(tasa): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 3,
      title: "Tráfico WAN Respaldo (Claro Fibra)",
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
              { color: "#059669", value: null },
              { color: "#F59E0B", value: 100000000 },
              { color: "#EF4444", value: 180000000 }
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
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "FTG_milicic_border1_SNMP" },
          item: { filter: "Interface port15(claro): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 4,
      title: "Inter-Core Backbone (LAG 20G)",
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
      id: 5,
      title: "Troncal Galpón 01 (Te1/0/8)",
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
      id: 6,
      title: "Potencia Activa Datacenter Core",
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
      title: "Autonomía Baterías UPS Emerson",
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
    // ROW 2: INDICADORES GLOBALES DE SALUD NOC (y: 8, h: 4)
    // -------------------------------------------------------------
    {
      id: 11,
      title: "Disponibilidad Core Switching 10G",
      type: "stat",
      gridPos: { x: 0, y: 8, w: 6, h: 4 },
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
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "ICMP ping" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 12,
      title: "CPU Promedio Switch Master Core01",
      type: "stat",
      gridPos: { x: 6, y: 8, w: 6, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "percent",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#10B981", value: null },
              { color: "#F59E0B", value: 60 },
              { color: "#EF4444", value: 80 }
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
          item: { filter: "Dell N-Series: CPU usage 1m" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 13,
      title: "Carga % Banco UPS Emerson Liebert",
      type: "stat",
      gridPos: { x: 12, y: 8, w: 6, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "percent",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#10B981", value: null },
              { color: "#F59E0B", value: 60 },
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
          host: { filter: "UPS SRO CORE" },
          item: { filter: "UPS Load (%)" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 14,
      title: "Estado Enlace Perimetral FortiGate WAN",
      type: "stat",
      gridPos: { x: 18, y: 8, w: 6, h: 4 },
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
            { type: "value", options: { "0": { text: "DOWN", color: "#EF4444" }, "1": { text: "TASA + CLARO OK", color: "#10B981" } } }
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
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "FTG_milicic_border1_SNMP" },
          item: { filter: "ICMP ping" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 3: TRÁFICO HISTÓRICO Y SALUD DE HARDWARE (y: 12, h: 9)
    // -------------------------------------------------------------
    {
      id: 20,
      title: "Telemetría Comparativa de Enlaces Troncales y WAN (RX bps)",
      type: "timeseries",
      gridPos: { x: 0, y: 12, w: 16, h: 9 },
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
          refId: "TASA",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "FTG_milicic_border1_SNMP" },
          item: { filter: "Interface port14(tasa): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "Claro",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "FTG_milicic_border1_SNMP" },
          item: { filter: "Interface port15(claro): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "Galpon01",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Interface Te1/0/8(Uplink_Galpones): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "EdBlanco",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Interface Te1/0/5(Uplink_edificio_viejo): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "EdE03",
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
      id: 25,
      title: "Utilización de CPU en Nodos Vitales",
      type: "bargauge",
      gridPos: { x: 16, y: 12, w: 8, h: 9 },
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
              { color: "#F59E0B", value: 65 },
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
        {
          refId: "Core01",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Dell N-Series: CPU usage 1m" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "Core02",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE02" },
          item: { filter: "Dell N-Series: CPU usage 1m" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "FTG_Border",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "FTG_milicic_border1_SNMP" },
          item: { filter: "CPU utilization" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "Zabbix_Server",
          schema: 12,
          queryType: "0",
          group: { filter: "Zabbix servers" },
          host: { filter: "Zabbix server" },
          item: { filter: "CPU utilization" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "SRO_DCO01",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "SRO-DCO01" },
          item: { filter: "CPU utilization" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 4: PANEL DE INCIDENTES ACTIVOS EN VIVO (y: 21, h: 10)
    // -------------------------------------------------------------
    {
      id: 30,
      title: "Registro de Incidentes NOC Activos en Vivo (Zabbix Problems)",
      type: "table",
      gridPos: { x: 0, y: 21, w: 24, h: 10 },
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
              { id: "custom.displayMode", value: "color-background" }
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
              {
                id: "mappings",
                value: [
                  {
                    type: "regex",
                    options: {
                      pattern: ".*\"name\":\\s*\"([^\"]+)\".*",
                      result: { text: "$1" }
                    }
                  },
                  {
                    type: "regex",
                    options: {
                      pattern: ".*\"host\":\\s*\"([^\"]+)\".*",
                      result: { text: "$1" }
                    }
                  }
                ]
              },
              { id: "custom.width", value: 240 }
            ]
          },
          {
            matcher: { id: "byName", options: "ACK" },
            properties: [
              {
                id: "mappings",
                value: [
                  { type: "value", options: { "0": { text: "No", color: "#EF4444" } } },
                  { type: "value", options: { "1": { text: "✓ Sí", color: "#10B981" } } }
                ]
              },
              { id: "custom.displayMode", value: "color-text" },
              { id: "custom.width", value: 90 }
            ]
          },
          {
            matcher: { id: "byName", options: "Problema / Incidente" },
            properties: [
              {
                id: "links",
                value: [
                  {
                    title: "Ver en Zabbix",
                    url: "https://zabbix.mlccnet.local/zabbix.php?action=problem.view",
                    targetBlank: true
                  }
                ]
              }
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

const payload = JSON.stringify({
  dashboard: dashboard,
  overwrite: true,
  message: "Deploy Optimized NOC Command Wallboard"
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
  });
});

req.write(payload);
req.end();
