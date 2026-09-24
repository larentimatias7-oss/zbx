import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const dashboard = {
  title: "San Juan: Monitoreo Integral de Infraestructura (SSJ)",
  uid: "milicic-sanjuan-infra",
  tags: ["milicic", "sanjuan", "ssj", "infraestructura", "sucursales"],
  timezone: "browser",
  schemaVersion: 40,
  time: { from: "now-3h", to: "now" },
  refresh: "30s",
  templating: {
    list: [
      {
        name: "device_type",
        label: "Tipo de Dispositivo",
        type: "custom",
        query: "Todos : .*, Red y Conectividad : (SSJ-CORE01|SSJ-SWADM|FTG_ar-ssj-predio_SNMP), Virtualización : (SSJ-HPV01), Almacenamiento y Respaldo : (SSJ-BKP01|SSJ-FIL01|SSJ-NAS01), Servidores y Servicios : (SSJ-DCO01|SSJ-SVC01)",
        current: {
          text: "Todos",
          value: ".*"
        },
        options: [
          { text: "Todos", value: ".*", selected: true },
          { text: "Red y Conectividad", value: "(SSJ-CORE01|SSJ-SWADM|FTG_ar-ssj-predio_SNMP)", selected: false },
          { text: "Virtualización", value: "(SSJ-HPV01)", selected: false },
          { text: "Almacenamiento y Respaldo", value: "(SSJ-BKP01|SSJ-FIL01|SSJ-NAS01)", selected: false },
          { text: "Servidores y Servicios", value: "(SSJ-DCO01|SSJ-SVC01)", selected: false }
        ],
        includeAll: false,
        hide: 0
      },
      {
        name: "host",
        label: "Dispositivo Específico",
        type: "query",
        datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
        query: {
          queryType: "2",
          group: "sanJuan",
          host: "/.*/"
        },
        current: {
          text: "All",
          value: "$__all"
        },
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
    // ROW 1: HEADER & RESUMEN DE SALUD POR TIPO (y: 0, h: 4)
    // -------------------------------------------------------------
    {
      id: 1,
      title: "Core Switch (SSJ-CORE01)",
      type: "stat",
      gridPos: { x: 0, y: 0, w: 3, h: 4 },
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      fieldConfig: {
        defaults: {
          mappings: [
            { type: "value", options: { "0": { text: "DOWN", color: "#E45959" }, "1": { text: "ONLINE", color: "#73BF69" } } }
          ],
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#E45959", value: null },
              { color: "#73BF69", value: 1 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "background",
        graphMode: "none"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "sanJuan" },
          host: { filter: "SSJ-CORE01" },
          item: { filter: "ICMP ping" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 2,
      title: "Switch Adm (SSJ-SWADM)",
      type: "stat",
      gridPos: { x: 3, y: 0, w: 3, h: 4 },
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      fieldConfig: {
        defaults: {
          mappings: [
            { type: "value", options: { "0": { text: "DOWN", color: "#E45959" }, "1": { text: "ONLINE", color: "#73BF69" } } }
          ],
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#E45959", value: null },
              { color: "#73BF69", value: 1 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "background",
        graphMode: "none"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "sanJuan" },
          host: { filter: "SSJ-SWADM" },
          item: { filter: "ICMP ping" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 3,
      title: "Hyper-V Físico (SSJ-HPV01)",
      type: "stat",
      gridPos: { x: 6, y: 0, w: 3, h: 4 },
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      fieldConfig: {
        defaults: {
          mappings: [
            { type: "value", options: { "0": { text: "DOWN", color: "#E45959" }, "1": { text: "ONLINE", color: "#73BF69" } } }
          ],
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#E45959", value: null },
              { color: "#73BF69", value: 1 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "background",
        graphMode: "none"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "sanJuan" },
          host: { filter: "SSJ-HPV01" },
          item: { filter: "ICMP ping" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 4,
      title: "Veeam BKP (SSJ-BKP01)",
      type: "stat",
      gridPos: { x: 9, y: 0, w: 3, h: 4 },
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      fieldConfig: {
        defaults: {
          mappings: [
            { type: "value", options: { "0": { text: "DOWN", color: "#E45959" }, "1": { text: "AGENT UP", color: "#73BF69" } } }
          ],
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#E45959", value: null },
              { color: "#73BF69", value: 1 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "background",
        graphMode: "none"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "sanJuan" },
          host: { filter: "SSJ-BKP01" },
          item: { filter: "Zabbix agent ping" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 5,
      title: "File Server (SSJ-FIL01)",
      type: "stat",
      gridPos: { x: 12, y: 0, w: 3, h: 4 },
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      fieldConfig: {
        defaults: {
          mappings: [
            { type: "value", options: { "0": { text: "DOWN", color: "#E45959" }, "1": { text: "AGENT UP", color: "#73BF69" } } }
          ],
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#E45959", value: null },
              { color: "#73BF69", value: 1 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "background",
        graphMode: "none"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "sanJuan" },
          host: { filter: "SSJ-FIL01" },
          item: { filter: "Zabbix agent ping" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 6,
      title: "QNAP NAS (SSJ-NAS01)",
      type: "stat",
      gridPos: { x: 15, y: 0, w: 3, h: 4 },
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      fieldConfig: {
        defaults: {
          mappings: [
            { type: "value", options: { "0": { text: "DOWN", color: "#E45959" }, "1": { text: "STORAGE OK", color: "#73BF69" } } }
          ],
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#E45959", value: null },
              { color: "#73BF69", value: 1 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "background",
        graphMode: "none"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "sanJuan" },
          host: { filter: "SSJ-NAS01" },
          item: { filter: "ICMP ping" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 7,
      title: "Domain Controller (SSJ-DCO01)",
      type: "stat",
      gridPos: { x: 18, y: 0, w: 3, h: 4 },
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      fieldConfig: {
        defaults: {
          mappings: [
            { type: "value", options: { "0": { text: "DOWN", color: "#E45959" }, "1": { text: "AD SYNC", color: "#73BF69" } } }
          ],
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#E45959", value: null },
              { color: "#73BF69", value: 1 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "background",
        graphMode: "none"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "sanJuan" },
          host: { filter: "SSJ-DCO01" },
          item: { filter: "Zabbix agent ping" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 8,
      title: "Servicios/Print (SSJ-SVC01)",
      type: "stat",
      gridPos: { x: 21, y: 0, w: 3, h: 4 },
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      fieldConfig: {
        defaults: {
          mappings: [
            { type: "value", options: { "0": { text: "DOWN", color: "#E45959" }, "1": { text: "ONLINE", color: "#73BF69" } } }
          ],
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#E45959", value: null },
              { color: "#73BF69", value: 1 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "background",
        graphMode: "none"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "sanJuan" },
          host: { filter: "SSJ-SVC01" },
          item: { filter: "Zabbix agent ping" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 1.5: MALLA OPERATIVA DE DISPONIBILIDAD (y: 4, h: 6)
    // -------------------------------------------------------------
    {
      id: 100,
      title: "Malla Hexagonal de Disponibilidad de Infraestructura San Juan (SSJ)",
      type: "grafana-polystat-panel",
      gridPos: { x: 0, y: 4, w: 24, h: 6 },
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      options: {
        polystat: {
          shape: "hexagon",
          displayMode: "all",
          columns: 4,
          rows: 2,
          fontSize: 12,
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
          group: { filter: "sanJuan" },
          host: { filter: "/.*/" },
          item: { filter: "/(ICMP ping|Zabbix agent ping)/" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 2: CONECTIVIDAD, LATENCIA Y CALIDAD DE ENLACE (y: 10, h: 7)
    // -------------------------------------------------------------
    {
      id: 9,
      title: "Latencia y RTT de Enlace a Dispositivos San Juan (ms)",
      type: "timeseries",
      gridPos: { x: 0, y: 10, w: 14, h: 7 },
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      fieldConfig: {
        defaults: {
          unit: "s",
          custom: {
            drawStyle: "line",
            lineInterpolation: "smooth",
            fillOpacity: 10,
            lineWidth: 2
          }
        }
      },
      options: {
        legend: { displayMode: "table", placement: "bottom", calcs: ["lastNotNull", "mean", "max"] }
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "sanJuan" },
          host: { filter: "/${device_type:raw}/" },
          item: { filter: "ICMP response time" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 10,
      title: "Pérdida de Paquetes en Enlaces de San Juan (%)",
      type: "timeseries",
      gridPos: { x: 14, y: 10, w: 10, h: 7 },
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      fieldConfig: {
        defaults: {
          unit: "percent",
          min: 0,
          max: 100,
          custom: {
            drawStyle: "line",
            lineWidth: 2,
            fillOpacity: 15
          },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#73BF69", value: null },
              { color: "#FFA059", value: 5 },
              { color: "#E45959", value: 20 }
            ]
          }
        }
      },
      options: {
        legend: { displayMode: "list", placement: "bottom" }
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "sanJuan" },
          host: { filter: "/${device_type:raw}/" },
          item: { filter: "ICMP loss" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 3: CÓMPUTO & SATURACIÓN: CPU Y MEMORIA RAM (y: 17, h: 8)
    // -------------------------------------------------------------
    {
      id: 11,
      title: "Consumo de Cómputo CPU (%) - Servidores San Juan",
      type: "timeseries",
      gridPos: { x: 0, y: 17, w: 12, h: 8 },
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      fieldConfig: {
        defaults: {
          unit: "percent",
          min: 0,
          max: 100,
          custom: {
            drawStyle: "line",
            lineInterpolation: "smooth",
            fillOpacity: 15,
            lineWidth: 2,
            gradientMode: "opacity"
          },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#73BF69", value: null },
              { color: "#FFA059", value: 75 },
              { color: "#E45959", value: 90 }
            ]
          }
        }
      },
      options: {
        legend: { displayMode: "table", placement: "bottom", calcs: ["lastNotNull", "mean", "max"] }
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "sanJuan" },
          host: { filter: "/${device_type:raw}/" },
          item: { filter: "CPU utilization" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 12,
      title: "Saturación de Memoria RAM (%) - Servidores San Juan",
      type: "timeseries",
      gridPos: { x: 12, y: 17, w: 12, h: 8 },
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      fieldConfig: {
        defaults: {
          unit: "percent",
          min: 0,
          max: 100,
          custom: {
            drawStyle: "line",
            lineInterpolation: "smooth",
            fillOpacity: 15,
            lineWidth: 2,
            gradientMode: "opacity"
          },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#73BF69", value: null },
              { color: "#FFA059", value: 80 },
              { color: "#E45959", value: 92 }
            ]
          }
        }
      },
      options: {
        legend: { displayMode: "table", placement: "bottom", calcs: ["lastNotNull", "mean", "max"] }
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "sanJuan" },
          host: { filter: "/${device_type:raw}/" },
          item: { filter: "Memory utilization" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 4: ALMACENAMIENTO - TREEMAP Y BAR GAUGE (y: 25, h: 8)
    // -------------------------------------------------------------
    {
      id: 120,
      title: "Almacenamiento: Capacidad y Distribución de Volúmenes San Juan (Treemap)",
      type: "marcusolsson-treemap-panel",
      gridPos: { x: 0, y: 25, w: 12, h: 8 },
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      options: {
        tilingAlgorithm: "squarify"
      },
      fieldConfig: {
        defaults: {
          unit: "percent",
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#73BF69", value: null },
              { color: "#FFA059", value: 80 },
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
          group: { filter: "sanJuan" },
          host: { filter: "/.*/" },
          item: { filter: "/FS \\[.*?\\]: Space: Used, in %/" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 13,
      title: "Utilización de Particiones de Datos y Volúmenes de Sistema (Bar Gauge)",
      type: "bargauge",
      gridPos: { x: 12, y: 25, w: 12, h: 8 },
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      fieldConfig: {
        defaults: {
          unit: "percent",
          min: 0,
          max: 100,
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#73BF69", value: null },
              { color: "#FFA059", value: 80 },
              { color: "#E45959", value: 90 }
            ]
          },
          color: { mode: "thresholds" }
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        orientation: "horizontal",
        displayMode: "gradient",
        showUnfilled: true
      },
      targets: [
        {
          refId: "Data",
          schema: 12,
          queryType: "0",
          group: { filter: "sanJuan" },
          host: { filter: "/SSJ-(HPV01|FIL01|BKP01)/" },
          item: { filter: "/FS \\[(DATA\\(D:\\)|DATOS\\(E:\\)|DATA-BKP\\(F:\\)|VM\\(E:\\))\\]: Space: Used, in %/" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "Sys",
          schema: 12,
          queryType: "0",
          group: { filter: "sanJuan" },
          host: { filter: "/.*/" },
          item: { filter: "/FS \\[\\(C:\\)\\]: Space: Used, in %/" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 5: INCIDENTES ACTIVOS EN SAN JUAN (y: 33, h: 8)
    // -------------------------------------------------------------
    {
      id: 15,
      title: "Incidentes y Alarmas Activas en Localidad San Juan (Zabbix Triggers)",
      type: "table",
      gridPos: { x: 0, y: 33, w: 24, h: 8 },
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      options: {
        showHeader: true
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "4",
          mode: 4,
          group: { filter: "sanJuan" },
          host: { filter: "/${device_type:raw}/" },
          showProblems: "problems",
          options: {
            acknowledged: 2,
            minSeverity: 1,
            hostsInMaintenance: false
          }
        }
      ]
    }
  ]
};

// Save local backup JSON
const dashboardsDir = path.resolve(import.meta.dirname, '../.zabbix_context/dashboards');
if (!fs.existsSync(dashboardsDir)) {
  fs.mkdirSync(dashboardsDir, { recursive: true });
}
fs.writeFileSync(path.join(dashboardsDir, 'milicic-sanjuan-infra.json'), JSON.stringify(dashboard, null, 2));

const payload = JSON.stringify({
  dashboard,
  folderUid: "milicic-observability",
  overwrite: true
});

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || "";
if (!grafanaToken) {
  try {
    grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
  } catch (e) {
    console.error('Error al obtener token:', e.message);
  }
}

const req = http.request("http://172.27.210.154:3005/api/dashboards/db", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${grafanaToken}`,
    "Content-Length": Buffer.byteLength(payload)
  }
}, res => {
  let b = "";
  res.on("data", d => b += d);
  res.on("end", () => {
    console.log("STATUS:", res.statusCode);
    console.log("RESPONSE:", b);
  });
});

req.on("error", console.error);
req.write(payload);
req.end();
