import http from 'http';
import fs from 'fs';
import path from 'path';

const token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
const grafanaUrl = 'http://172.27.210.154:3005';
const dsUid = 'efz4nzx8r30g0c';

const dashboard = {
  id: null,
  uid: "noc-zabbix-command-center",
  title: "NOC - Zabbix Command Center",
  tags: ["noc", "zabbix", "milicic", "command-center", "v7", "expert"],
  timezone: "browser",
  schemaVersion: 40,
  version: 8,
  refresh: "30s",
  time: { from: "now-15m", to: "now" },
  templating: {
    list: [
      {
        name: "datasource",
        type: "datasource",
        query: "alexanderzobnin-zabbix-datasource",
        current: { text: "alexanderzobnin-zabbix-datasource", value: dsUid },
        hide: 2
      }
    ]
  },
  panels: [
    // --- ROW 0: HEADER ---
    {
      id: 1,
      title: "",
      type: "text",
      gridPos: { x: 0, y: 0, w: 20, h: 3 },
      options: {
        mode: "html",
        content: `
<div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%); border-left: 6px solid #EA580C; padding: 10px 16px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
  <div>
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="background: #EA580C; color: white; padding: 2px 7px; border-radius: 4px; font-weight: 800; font-size: 11px; letter-spacing: 0.5px;">MILICIC S.A.</span>
      <h2 style="margin: 0; color: #FFFFFF; font-size: 17px; font-weight: 700;">NOC COMMAND CENTER &bull; Observabilidad Core</h2>
    </div>
    <p style="margin: 3px 0 0 0; color: #94A3B8; font-size: 11px;">Monitoreo Global de Disponibilidad &bull; Matriz Predictiva de Salud &bull; Telemetría Crítica en Vivo</p>
  </div>
</div>`
      }
    },
    {
      id: 2,
      title: "Heartbeat Zabbix",
      type: "stat",
      gridPos: { x: 20, y: 0, w: 4, h: 3 },
      datasource: { uid: dsUid },
      fieldConfig: {
        defaults: {
          unit: "s", color: { mode: "thresholds" },
          thresholds: { mode: "absolute", steps: [{ color: "#E45959", value: null }, { color: "#73BF69", value: 0 }, { color: "#FFC859", value: 60 }, { color: "#E45959", value: 120 }] }
        }
      },
      options: { reduceOptions: { calcs: ["lastNotNull"], values: false }, orientation: "auto", textMode: "value_and_name", colorMode: "background", graphMode: "none", justifyMode: "center" },
      targets: [
        { refId: "A", schema: 12, queryType: "0", group: { filter: "Zabbix servers" }, host: { filter: "Zabbix server" }, item: { filter: "Zabbix agent ping" }, resultFormat: "time_series" }
      ]
    },

    // --- ROW 1: KPIs GLOBALES ---
    {
      id: 3,
      title: "Nodos Monitoreados",
      type: "stat",
      gridPos: { x: 0, y: 3, w: 5, h: 4 },
      datasource: { uid: dsUid },
      fieldConfig: { defaults: { color: { mode: "fixed", fixedColor: "#38BDF8" } } },
      options: { reduceOptions: { calcs: ["lastNotNull"], values: false }, textMode: "value", colorMode: "background", graphMode: "none" },
      targets: [
        { refId: "A", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "/.*/" }, item: { filter: "/(ICMP ping|agent.ping)/" }, resultFormat: "time_series", options: { showDisabledItems: false } }
      ],
      transformations: [{ id: "calculateField", options: { mode: "reduceRow", reduce: { reducer: "count" }, replaceFields: true } }]
    },
    {
      id: 7,
      title: "Salud Global (Disponibilidad)",
      type: "gauge",
      gridPos: { x: 5, y: 3, w: 5, h: 4 },
      datasource: { uid: dsUid },
      fieldConfig: {
        defaults: {
          min: 0, max: 1, unit: "percentunit",
          color: { mode: "thresholds" },
          thresholds: { mode: "absolute", steps: [{ color: "#E45959", value: null }, { color: "#E45959", value: 0 }, { color: "#FFA059", value: 0.85 }, { color: "#FFC859", value: 0.92 }, { color: "#73BF69", value: 0.96 }] }
        }
      },
      options: { showThresholdLabels: false, showThresholdMarkers: true, reduceOptions: { calcs: ["lastNotNull"], values: false } },
      targets: [
        { refId: "A", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "/.*/" }, item: { filter: "/(ICMP ping|agent.ping)/" }, resultFormat: "time_series", options: { showDisabledItems: false } }
      ],
      transformations: [
        { id: "calculateField", options: { mode: "reduceRow", reduce: { reducer: "mean" }, replaceFields: true } }
      ]
    },
    {
      id: 4,
      title: "Incidentes Críticos (Disaster/High)",
      type: "stat",
      gridPos: { x: 10, y: 3, w: 7, h: 4 },
      datasource: { uid: dsUid },
      fieldConfig: {
        defaults: {
          noValue: "0",
          color: { mode: "thresholds" },
          thresholds: { mode: "absolute", steps: [{ color: "#73BF69", value: null }, { color: "#73BF69", value: 0 }, { color: "#E45959", value: 1 }] }
        }
      },
      options: { reduceOptions: { calcs: ["lastNotNull"], values: false }, textMode: "value", colorMode: "background", graphMode: "none" },
      targets: [
        { refId: "A", schema: 12, queryType: "4", group: { filter: "/.*/" }, host: { filter: "/.*/" }, showProblems: "problems", options: { minSeverity: 4, acknowledged: 2 } }
      ],
      transformations: [{ id: "calculateField", options: { mode: "reduceRow", reduce: { reducer: "count" }, replaceFields: true } }]
    },
    {
      id: 5,
      title: "Alertas Preventivas (Warning/Average)",
      type: "stat",
      gridPos: { x: 17, y: 3, w: 7, h: 4 },
      datasource: { uid: dsUid },
      fieldConfig: {
        defaults: {
          noValue: "0",
          color: { mode: "thresholds" },
          thresholds: { mode: "absolute", steps: [{ color: "#73BF69", value: null }, { color: "#73BF69", value: 0 }, { color: "#FFC859", value: 1 }] }
        }
      },
      options: { reduceOptions: { calcs: ["lastNotNull"], values: false }, textMode: "value", colorMode: "background", graphMode: "none" },
      targets: [
        { refId: "A", schema: 12, queryType: "4", group: { filter: "/.*/" }, host: { filter: "/.*/" }, showProblems: "problems", options: { minSeverity: 2, acknowledged: 2 } }
      ],
      transformations: [
        { id: "filterByValue", options: { filters: [{ config: { id: "less", options: { value: 4 } }, fieldName: "Severity" }], type: "include", match: "all" } },
        { id: "calculateField", options: { mode: "reduceRow", reduce: { reducer: "count" }, replaceFields: true } }
      ]
    },

    // --- ROW 2: MATRIZ DE CUADROS (MOSAICO EXPERTO) ---
    // Modificado para usar 'last' en lugar de 'lastNotNull', mapeando null -> DOWN (Rojo)
    {
      id: 8,
      title: "Perímetro SD-WAN (FortiGates)",
      type: "stat",
      gridPos: { x: 0, y: 7, w: 6, h: 8 },
      datasource: { uid: dsUid },
      fieldConfig: {
        defaults: {
          noValue: "?", color: { mode: "thresholds" },
          thresholds: { mode: "absolute", steps: [{ color: "#E45959", value: null }, { color: "#E45959", value: 0 }, { color: "#73BF69", value: 1 }] },
          mappings: [{ type: "value", options: { "0": { text: "DOWN" }, "1": { text: "UP" } } }]
        }
      },
      options: {
        reduceOptions: { calcs: ["last"], values: false },
        orientation: "auto", textMode: "name", colorMode: "background", graphMode: "none", justifyMode: "center",
        text: { titleSize: 12 }
      },
      targets: [
        { refId: "A", schema: 12, queryType: "0", group: { filter: "FortiGate" }, host: { filter: "/.*/" }, item: { filter: "ICMP ping" }, resultFormat: "time_series" }
      ],
      transformations: [
        { id: "renameByRegex", options: { regex: "(.*):.*", renamePattern: "$1" } },
        { id: "renameByRegex", options: { regex: "FTG_(.*)", renamePattern: "$1" } },
        { id: "renameByRegex", options: { regex: "(.*)_SNMP", renamePattern: "$1" } }
      ]
    },
    {
      id: 9,
      title: "Infra. Core & Servidores",
      type: "stat",
      gridPos: { x: 6, y: 7, w: 6, h: 8 },
      datasource: { uid: dsUid },
      fieldConfig: {
        defaults: {
          noValue: "?", color: { mode: "thresholds" },
          thresholds: { mode: "absolute", steps: [{ color: "#E45959", value: null }, { color: "#E45959", value: 0 }, { color: "#73BF69", value: 1 }] },
          mappings: [{ type: "value", options: { "0": { text: "DOWN" }, "1": { text: "UP" } } }]
        }
      },
      options: {
        reduceOptions: { calcs: ["last"], values: false },
        orientation: "auto", textMode: "name", colorMode: "background", graphMode: "none", justifyMode: "center",
        text: { titleSize: 12 }
      },
      targets: [
        { refId: "A", schema: 12, queryType: "0", group: { filter: "/(Zabbix servers|Datacenter|AD|Backup|Servers)/" }, host: { filter: "/.*/" }, item: { filter: "/(agent.ping|ICMP ping)/" }, resultFormat: "time_series" }
      ],
      transformations: [
        { id: "renameByRegex", options: { regex: "(.*):.*", renamePattern: "$1" } },
        { id: "renameByRegex", options: { regex: "SRO-(.*)", renamePattern: "$1" } },
        { id: "renameByRegex", options: { regex: "SSJ-(.*)", renamePattern: "SJ-$1" } }
      ]
    },
    {
      id: 10,
      title: "Redes (Switches) y APs (Aruba)",
      type: "stat",
      gridPos: { x: 12, y: 7, w: 8, h: 8 }, // Ancho aumentado a 8 para que quepan mejor los 40 APs
      datasource: { uid: dsUid },
      fieldConfig: {
        defaults: {
          noValue: "?", color: { mode: "thresholds" },
          thresholds: { mode: "absolute", steps: [{ color: "#E45959", value: null }, { color: "#E45959", value: 0 }, { color: "#73BF69", value: 1 }] },
          mappings: [{ type: "value", options: { "0": { text: "DOWN" }, "1": { text: "UP" } } }]
        }
      },
      options: {
        reduceOptions: { calcs: ["last"], values: false },
        orientation: "auto", textMode: "name", colorMode: "background", graphMode: "none", justifyMode: "center",
        text: { titleSize: 12 }
      },
      targets: [
        { refId: "A", schema: 12, queryType: "0", group: { filter: "/(ARUBA APs|switch)/" }, host: { filter: "/.*/" }, item: { filter: "ICMP ping" }, resultFormat: "time_series" }
      ],
      transformations: [
        { id: "renameByRegex", options: { regex: "(.*):.*", renamePattern: "$1" } },
        { id: "renameByRegex", options: { regex: "AP (.*)", renamePattern: "$1" } },
        { id: "renameByRegex", options: { regex: "SW (.*)", renamePattern: "$1" } }
      ]
    },
    {
      id: 11,
      title: "Facilities & Energía (UPS)",
      type: "stat",
      gridPos: { x: 20, y: 7, w: 4, h: 8 }, // Ancho reducido a 4 porque son pocos
      datasource: { uid: dsUid },
      fieldConfig: {
        defaults: {
          noValue: "?", color: { mode: "thresholds" },
          thresholds: { mode: "absolute", steps: [{ color: "#E45959", value: null }, { color: "#E45959", value: 0 }, { color: "#73BF69", value: 1 }] },
          mappings: [{ type: "value", options: { "0": { text: "DOWN" }, "1": { text: "UP" } } }]
        }
      },
      options: {
        reduceOptions: { calcs: ["last"], values: false },
        orientation: "auto", textMode: "name", colorMode: "background", graphMode: "none", justifyMode: "center",
        text: { titleSize: 12 }
      },
      targets: [
        { refId: "A", schema: 12, queryType: "0", group: { filter: "UPS" }, host: { filter: "/.*/" }, item: { filter: "/(sysUpTime|Ups Input Voltage)/" }, resultFormat: "time_series" }
      ],
      transformations: [
        { id: "renameByRegex", options: { regex: "(.*):.*", renamePattern: "$1" } },
        { id: "renameByRegex", options: { regex: "UPS (.*)", renamePattern: "$1" } }
      ]
    },

    // --- ROW 3: TELEMETRÍA CRÍTICA Y PERFORMANCE ---
    {
      id: 13,
      title: "Top 5 Servidores (Consumo CPU %)",
      type: "bargauge",
      gridPos: { x: 0, y: 15, w: 8, h: 7 },
      datasource: { uid: dsUid },
      fieldConfig: {
        defaults: {
          min: 0, max: 100, unit: "percent",
          color: { mode: "thresholds" },
          thresholds: { mode: "absolute", steps: [{ color: "#73BF69", value: null }, { color: "#73BF69", value: 0 }, { color: "#FFC859", value: 75 }, { color: "#E45959", value: 90 }] }
        }
      },
      options: { orientation: "horizontal", displayMode: "gradient", showUnfilled: true },
      targets: [
        { refId: "A", schema: 12, queryType: "0", group: { filter: "/(Zabbix servers|Servers|Datacenter|FortiGate)/" }, host: { filter: "/.*/" }, item: { filter: "/(CPU utilization|CPU usage)/" }, resultFormat: "time_series" }
      ],
      transformations: [
        { id: "renameByRegex", options: { regex: "(.*):.*", renamePattern: "$1" } },
        { id: "reduce", options: { reducers: ["lastNotNull"], mode: "seriesToRows" } },
        { id: "organize", options: { excludeByName: {}, indexByName: {}, renameByName: { "Field": "Name", "Last *NotNull": "Value" } } },
        { id: "sortBy", options: { fields: {}, sort: [{ field: "Value", desc: true }] } },
        { id: "limit", options: { limitField: 5 } }
      ]
    },
    {
      id: 14,
      title: "Top 5 Datacenters (Carga Eléctrica UPS %)",
      type: "bargauge",
      gridPos: { x: 8, y: 15, w: 8, h: 7 },
      datasource: { uid: dsUid },
      fieldConfig: {
        defaults: {
          min: 0, max: 100, unit: "percent",
          color: { mode: "thresholds" },
          thresholds: { mode: "absolute", steps: [{ color: "#73BF69", value: null }, { color: "#73BF69", value: 0 }, { color: "#FFC859", value: 70 }, { color: "#E45959", value: 85 }] }
        }
      },
      options: { orientation: "horizontal", displayMode: "gradient", showUnfilled: true },
      targets: [
        { refId: "A", schema: 12, queryType: "0", group: { filter: "UPS" }, host: { filter: "/.*/" }, item: { filter: "/UPS Load/" }, resultFormat: "time_series" }
      ],
      transformations: [
        { id: "renameByRegex", options: { regex: "(.*):.*", renamePattern: "$1" } },
        { id: "reduce", options: { reducers: ["lastNotNull"], mode: "seriesToRows" } },
        { id: "organize", options: { excludeByName: {}, indexByName: {}, renameByName: { "Field": "Name", "Last *NotNull": "Value" } } },
        { id: "sortBy", options: { fields: {}, sort: [{ field: "Value", desc: true }] } },
        { id: "limit", options: { limitField: 5 } }
      ]
    },
    {
      id: 15,
      title: "Tráfico de Sesiones Activas (FortiGates SD-WAN)",
      type: "timeseries",
      gridPos: { x: 16, y: 15, w: 8, h: 7 },
      datasource: { uid: dsUid },
      fieldConfig: {
        defaults: {
          unit: "short",
          color: { mode: "palette-classic" },
          custom: { fillOpacity: 10, lineWidth: 2, drawStyle: "line" }
        }
      },
      options: { legend: { displayMode: "list", placement: "bottom", calcs: ["lastNotNull"] }, tooltip: { mode: "multi" } },
      targets: [
        { refId: "A", schema: 12, queryType: "0", group: { filter: "FortiGate" }, host: { filter: "/.*/" }, item: { filter: "/IPv4 Active sessions/" }, resultFormat: "time_series" }
      ],
      transformations: [
        { id: "renameByRegex", options: { regex: "FTG_(.*)_SNMP:.*", renamePattern: "$1" } }
      ]
    },

    // --- ROW 4: INCIDENTES ACTIVOS EN TIEMPO REAL ---
    {
      id: 12,
      title: "Feed de Incidentes Activos en Tiempo Real (Alertas Zabbix)",
      type: "table",
      gridPos: { x: 0, y: 22, w: 24, h: 8 },
      datasource: { uid: dsUid },
      options: {
        showHeader: true,
        sortBy: [{ displayName: "Severity", desc: true }]
      },
      fieldConfig: {
        defaults: {
          custom: { align: "auto", cellOptions: { type: "auto" } }
        },
        overrides: [
          { matcher: { id: "byName", options: "Severity" }, properties: [{ id: "custom.cellOptions", value: { type: "color-background", mode: "gradient" } }, { id: "custom.width", value: 120 }] },
          { matcher: { id: "byName", options: "Time" }, properties: [{ id: "custom.width", value: 150 }] }
        ]
      },
      targets: [
        // NOTA EXPERTO: Se elimina 'mode: 4' para que cargue directamente el listado de problemas y no el conteo por grupos.
        { refId: "A", schema: 12, queryType: "4", group: { filter: "/.*/" }, host: { filter: "/.*/" }, showProblems: "problems", options: { acknowledged: 2, minSeverity: 2, hostsInMaintenance: false } }
      ]
    }
  ]
};

async function deploy() {
  console.log("=== DESPLEGANDO DASHBOARD NOC V7 EN GRAFANA ===");
  const payload = JSON.stringify({ dashboard, folderUid: "milicic-noc", overwrite: true });

  return new Promise((resolve, reject) => {
    const req = http.request(`${grafanaUrl}/api/dashboards/db`, {
      method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, "Content-Length": Buffer.byteLength(payload) }
    }, res => {
      let b = "";
      res.on("data", d => b += d);
      res.on("end", () => resolve(JSON.parse(b)));
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

deploy().then(res => {
  if (res.status === "success") {
    console.log("Dashboard Desplegado V7!");
    fs.writeFileSync(path.join('dashboards', 'noc-zabbix-command-center.json'), JSON.stringify(dashboard, null, 2));
    fs.writeFileSync(path.join('.zabbix_context/dashboards', 'noc-zabbix-command-center.json'), JSON.stringify(dashboard, null, 2));
  } else {
    console.error("Error:", res);
  }
}).catch(console.error);
