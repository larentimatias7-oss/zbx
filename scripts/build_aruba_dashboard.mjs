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
  title: "Networking: Infraestructura Wi-Fi Aruba Instant & Switches 1930",
  uid: "milicic-aruba-wifi-switches",
  tags: ["milicic", "networking", "wireless", "aruba", "wifi", "switches"],
  timezone: "browser",
  schemaVersion: 40,
  time: { from: "now-3h", to: "now" },
  refresh: "30s",
  templating: {
    list: [
      {
        name: "AP",
        label: "Punto de Acceso (AP)",
        type: "query",
        datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
        query: {
          queryType: "2",
          group: "ARUBA APs",
          host: "/.*/"
        },
        current: { text: "All", value: "$__all" },
        includeAll: true,
        allValue: ".*",
        multi: false,
        refresh: 1,
        hide: 0
      }
    ]
  },
  panels: [
    // -------------------------------------------------------------
    // ROW 0: SUMMARY KPIS (y: 0, h: 4)
    // -------------------------------------------------------------
    {
      id: 101,
      title: "Puntos de Acceso Monitoreados",
      type: "stat",
      gridPos: { x: 0, y: 0, w: 6, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "fixed", fixedColor: "#5794F2" },
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
          group: { filter: "ARUBA APs" },
          host: { filter: "/.*/" },
          item: { filter: "ICMP ping" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 102,
      title: "Disponibilidad Flota Wi-Fi (SLA ICMP)",
      type: "stat",
      gridPos: { x: 6, y: 0, w: 6, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "percentunit",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#E45959", value: null },
              { color: "#FFC859", value: 0.9 },
              { color: "#16A34A", value: 1.0 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["mean"], values: false },
        colorMode: "value",
        graphMode: "area",
        textMode: "value_and_name"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "ARUBA APs" },
          host: { filter: "/.*/" },
          item: { filter: "ICMP ping" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 103,
      title: "Latencia Media Wi-Fi (ICMP RTT)",
      type: "stat",
      gridPos: { x: 12, y: 0, w: 6, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "s",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#16A34A", value: null },
              { color: "#FFC859", value: 0.02 },
              { color: "#E45959", value: 0.05 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["mean"], values: false },
        colorMode: "value",
        graphMode: "area",
        textMode: "value"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "ARUBA APs" },
          host: { filter: "/.*/" },
          item: { filter: "ICMP response time" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 104,
      title: "Consumo PoE Total Switches Aruba",
      type: "stat",
      gridPos: { x: 18, y: 0, w: 6, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "watt",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#16A34A", value: null },
              { color: "#FFC859", value: 300 },
              { color: "#E45959", value: 500 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "value",
        graphMode: "area",
        textMode: "value"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "/(SRO-E03-P00-D03|SRO-E02-PB00-CORE03)/" },
          item: { filter: "/PoE.*power/i" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 1: MATRIZ OPERATIVA DE PUNTOS DE ACCESO (y: 4, h: 8)
    // -------------------------------------------------------------
    {
      id: 105,
      title: "Mosaico Hexagonal de Red: Flota Wi-Fi Aruba Instant (14 APs)",
      type: "grafana-polystat-panel",
      gridPos: { x: 0, y: 4, w: 12, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      options: {
        polystat: {
          shape: "hexagon",
          displayMode: "all",
          columns: 5,
          rows: 3,
          fontSize: 11,
          fontColor: "#FFFFFF"
        },
        thresholds: [
          { color: "#E45959", state: 0, value: 0 },
          { color: "#16A34A", state: 1, value: 1 }
        ]
      },
      fieldConfig: {
        defaults: {
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#E45959", value: null },
              { color: "#16A34A", value: 1 }
            ]
          }
        }
      },
      targets: [
        {
          refId: "Ping",
          schema: 12,
          queryType: "0",
          group: { filter: "ARUBA APs" },
          host: { filter: "/${AP:regex}/" },
          item: { filter: "ICMP ping" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 1,
      title: "Matriz de Conectividad & Salud Operativa - Puntos de Acceso (14 APs)",
      type: "table",
      gridPos: { x: 12, y: 4, w: 12, h: 8 },
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
                id: "mappings",
                value: [
                  {
                    type: "value",
                    options: {
                      "0": { text: "OFFLINE", color: "#E45959" },
                      "1": { text: "ONLINE", color: "#16A34A" }
                    }
                  }
                ]
              },
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
            matcher: { id: "byName", options: "ICMP response time" },
            properties: [
              { id: "unit", value: "s" },
              {
                id: "thresholds",
                value: {
                  mode: "absolute",
                  steps: [
                    { color: "#16A34A", value: null },
                    { color: "#FFC859", value: 0.02 },
                    { color: "#E45959", value: 0.05 }
                  ]
                }
              }
            ]
          },
          {
            matcher: { id: "byName", options: "ICMP loss" },
            properties: [
              { id: "unit", value: "percent" },
              {
                id: "thresholds",
                value: {
                  mode: "absolute",
                  steps: [
                    { color: "#16A34A", value: null },
                    { color: "#FFC859", value: 1 },
                    { color: "#E45959", value: 5 }
                  ]
                }
              }
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
          group: { filter: "ARUBA APs" },
          host: { filter: "/.*/" },
          item: { filter: "ICMP ping" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "RTT",
          schema: 12,
          queryType: "0",
          group: { filter: "ARUBA APs" },
          host: { filter: "/.*/" },
          item: { filter: "ICMP response time" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "Loss",
          schema: 12,
          queryType: "0",
          group: { filter: "ARUBA APs" },
          host: { filter: "/.*/" },
          item: { filter: "ICMP loss" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 2: TRÁFICO ETHERNET & RF POR AP SELECCIONADO (y: 12, h: 8)
    // -------------------------------------------------------------
    {
      id: 2,
      title: "Tráfico de Uplink Ethernet (eth0) - $AP",
      type: "timeseries",
      gridPos: { x: 0, y: 12, w: 12, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "bps",
          custom: {
            drawStyle: "line",
            lineInterpolation: "smooth",
            lineWidth: 2,
            fillOpacity: 15,
            gradientMode: "opacity"
          }
        },
        overrides: [
          {
            matcher: { id: "byRegexp", options: "/.*received.*/i" },
            properties: [
              { id: "color", value: { fixedColor: "#73BF69", mode: "fixed" } }
            ]
          },
          {
            matcher: { id: "byRegexp", options: "/.*sent.*/i" },
            properties: [
              { id: "color", value: { fixedColor: "#5794F2", mode: "fixed" } }
            ]
          }
        ]
      },
      options: {
        legend: { displayMode: "table", placement: "bottom", calcs: ["lastNotNull", "max", "mean"] },
        tooltip: { mode: "multi" }
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "ARUBA APs" },
          host: { filter: "$AP" },
          item: { filter: "/Interface eth0.*: Bits received/i" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "B",
          schema: 12,
          queryType: "0",
          group: { filter: "ARUBA APs" },
          host: { filter: "$AP" },
          item: { filter: "/Interface eth0.*: Bits sent/i" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 3,
      title: "Distribución de Tráfico RF (5 GHz vs 2.4 GHz) - $AP",
      type: "timeseries",
      gridPos: { x: 12, y: 12, w: 12, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "bps",
          custom: {
            drawStyle: "line",
            lineInterpolation: "smooth",
            lineWidth: 2,
            fillOpacity: 30,
            gradientMode: "opacity",
            stacking: { mode: "normal", group: "A" }
          }
        },
        overrides: [
          {
            matcher: { id: "byRegexp", options: "/.*radio0.*/i" },
            properties: [
              { id: "color", value: { fixedColor: "#5794F2", mode: "fixed" } }
            ]
          },
          {
            matcher: { id: "byRegexp", options: "/.*radio1.*/i" },
            properties: [
              { id: "color", value: { fixedColor: "#FFC859", mode: "fixed" } }
            ]
          }
        ]
      },
      options: {
        legend: { displayMode: "table", placement: "bottom", calcs: ["lastNotNull", "max", "mean"] },
        tooltip: { mode: "multi" }
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "ARUBA APs" },
          host: { filter: "$AP" },
          item: { filter: "/Interface radio0_ssid.*: Bits received/i" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "B",
          schema: 12,
          queryType: "0",
          group: { filter: "ARUBA APs" },
          host: { filter: "$AP" },
          item: { filter: "/Interface radio1_ssid.*: Bits received/i" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 3: SWITCHES ARUBA 1930 (y: 20, h: 6)
    // -------------------------------------------------------------
    {
      id: 4,
      title: "Consumo Eléctrico PoE - Switches Aruba Instant On 1930",
      type: "gauge",
      gridPos: { x: 0, y: 20, w: 8, h: 6 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "watt",
          min: 0,
          max: 370,
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#73BF69", value: null },
              { color: "#FFC859", value: 100 },
              { color: "#E45959", value: 120 }
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
          group: { filter: "/.*/" },
          host: { filter: "/(SRO-E03-P00-D03|SRO-E02-PB00-CORE03)/" },
          item: { filter: "/PoE.*power/i" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 5,
      title: "Carga de Procesador (CPU) - Switches Aruba 1930",
      type: "timeseries",
      gridPos: { x: 8, y: 20, w: 8, h: 6 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "percent",
          min: 0,
          max: 100,
          custom: {
            drawStyle: "line",
            lineInterpolation: "smooth",
            lineWidth: 2,
            fillOpacity: 15
          },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#73BF69", value: null },
              { color: "#FFA059", value: 70 },
              { color: "#E45959", value: 90 }
            ]
          }
        }
      },
      options: {
        legend: { displayMode: "table", placement: "bottom", calcs: ["lastNotNull", "max"] }
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "/(SRO-E03-P00-D03|SRO-E02-PB00-CORE03)/" },
          item: { filter: "/CPU utilization/i" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 6,
      title: "Tiempo de Actividad (Uptime) - Switches Aruba 1930",
      type: "stat",
      gridPos: { x: 16, y: 20, w: 8, h: 6 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "s",
          color: { mode: "fixed", fixedColor: "#73BF69" }
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "value",
        graphMode: "area",
        justifyMode: "auto"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "/(SRO-E03-P00-D03|SRO-E02-PB00-CORE03)/" },
          item: { filter: "/Uptime \\(network\\)/" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 4: INVENTARIO CONSOLIDADO (y: 26, h: 8)
    // -------------------------------------------------------------
    {
      id: 7,
      title: "Inventario Consolidado de Puntos de Acceso Aruba Instant (AOS-8)",
      type: "table",
      gridPos: { x: 0, y: 26, w: 24, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      options: { showHeader: true },
      fieldConfig: {
        defaults: { custom: { align: "auto" } },
        overrides: [
          {
            matcher: { id: "byName", options: "Uptime (network)" },
            properties: [{ id: "unit", value: "s" }]
          }
        ]
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "ARUBA APs" },
          host: { filter: "/.*/" },
          item: { filter: "/(Hardware model name|Firmware version|Uptime \\(network\\))/" },
          resultFormat: "table",
          options: { showDisabledItems: false }
        }
      ]
    }
  ]
};

// 1. Guardar copia local de respaldo y versionado
const outputPath = path.resolve(__dirname, '../.zabbix_context/dashboards/aruba-wifi-switching-overview.json');
fs.writeFileSync(outputPath, JSON.stringify(dashboard, null, 2), 'utf8');
console.log(`Copia local guardada en ${outputPath}`);
console.log(`Paneles configurados: ${dashboard.panels.length}`);

// 2. Obtener Token de Grafana
let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken) {
  try {
    grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
  } catch (e) {
    console.error('Error al obtener token de variable de entorno:', e.message);
  }
}

if (!grafanaToken) {
  console.error('ERROR: No se encontró GRAFANA_SERVICE_ACCOUNT_TOKEN en el entorno.');
  process.exit(1);
}

// 3. Desplegar en Grafana API
const payload = JSON.stringify({
  dashboard,
  folderUid: "milicic-observability",
  overwrite: true
});

const req = http.request({
  hostname: '172.27.210.154',
  port: 3005,
  path: '/api/dashboards/db',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + grafanaToken,
    'Content-Length': Buffer.byteLength(payload)
  }
}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log(`HTTP Status: ${res.statusCode}`);
    try {
      const respJson = JSON.parse(body);
      console.log('Respuesta de Grafana API:', JSON.stringify(respJson, null, 2));
      if (respJson.status === 'success') {
        console.log('\n¡DASHBOARD ARUBA DESPLEGADO CON ÉXITO!');
        console.log(`URL: http://172.27.210.154:3005${respJson.url}`);
        console.log(`UID: ${dashboard.uid}`);
      }
    } catch (e) {
      console.error('Error al parsear respuesta JSON:', body);
    }
  });
});

req.on('error', err => {
  console.error('Error de red al conectar con Grafana:', err.message);
});

req.write(payload);
req.end();
