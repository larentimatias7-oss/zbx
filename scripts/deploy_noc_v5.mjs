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
  tags: ["noc", "zabbix", "milicic", "command-center", "v5"],
  timezone: "browser",
  schemaVersion: 40,
  version: 6,
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
      <h2 style="margin: 0; color: #FFFFFF; font-size: 17px; font-weight: 700;">NOC COMMAND CENTER &bull; Zabbix 7.0 LTS</h2>
    </div>
    <p style="margin: 3px 0 0 0; color: #94A3B8; font-size: 11px;">Monitoreo Global de Disponibilidad en Tiempo Real &bull; Matriz de Salud Organizada</p>
  </div>
</div>`
      }
    },
    {
      id: 2,
      title: "Heartbeat NOC",
      type: "stat",
      gridPos: { x: 20, y: 0, w: 4, h: 3 },
      datasource: { uid: dsUid },
      fieldConfig: {
        defaults: {
          unit: "s", color: { mode: "thresholds" },
          thresholds: { mode: "absolute", steps: [{ color: "#73BF69", value: null }, { color: "#FFC859", value: 60 }, { color: "#E45959", value: 120 }] }
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
      title: "Nodos Monitoreados (Totales)",
      type: "stat",
      gridPos: { x: 0, y: 3, w: 8, h: 4 },
      datasource: { uid: dsUid },
      fieldConfig: { defaults: { color: { mode: "fixed", fixedColor: "#38BDF8" } } },
      options: { reduceOptions: { calcs: ["lastNotNull"], values: false }, textMode: "value", colorMode: "background", graphMode: "none" },
      targets: [
        { refId: "A", schema: 12, queryType: "0", group: { filter: "/.*/" }, host: { filter: "/.*/" }, item: { filter: "/(ICMP ping|agent.ping)/" }, resultFormat: "time_series", options: { showDisabledItems: false } }
      ],
      transformations: [{ id: "calculateField", options: { mode: "reduceRow", reduce: { reducer: "count" }, replaceFields: true } }]
    },
    {
      id: 4,
      title: "Alertas Críticas Activas (Triggers)",
      type: "stat",
      gridPos: { x: 8, y: 3, w: 8, h: 4 },
      datasource: { uid: dsUid },
      fieldConfig: {
        defaults: {
          noValue: "0",
          color: { mode: "thresholds" },
          thresholds: { mode: "absolute", steps: [{ color: "#73BF69", value: null }, { color: "#E45959", value: 1 }] }
        }
      },
      options: { reduceOptions: { calcs: ["lastNotNull"], values: false }, textMode: "value", colorMode: "background", graphMode: "none" },
      targets: [
        { refId: "A", schema: 12, queryType: "4", group: { filter: "/.*/" }, host: { filter: "/.*/" }, showProblems: "problems", options: { minSeverity: 4, acknowledged: 2 } }
      ],
      transformations: [{ id: "calculateField", options: { mode: "reduceRow", reduce: { reducer: "count" }, replaceFields: true } }]
    },
    {
      id: 7,
      title: "Health Score",
      type: "gauge",
      gridPos: { x: 16, y: 3, w: 8, h: 4 },
      datasource: { uid: dsUid },
      fieldConfig: {
        defaults: {
          min: 0, max: 1, unit: "percentunit",
          color: { mode: "thresholds" },
          thresholds: { mode: "absolute", steps: [{ color: "#E45959", value: null }, { color: "#FFA059", value: 0.85 }, { color: "#FFC859", value: 0.92 }, { color: "#73BF69", value: 0.96 }] }
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

    // --- ROW 2: MATRIZ DE CUADROS (Stat Panels con orientation: auto) ---
    {
      id: 8,
      title: "Core, Switches y Perímetro (FortiGates)",
      type: "stat",
      gridPos: { x: 0, y: 7, w: 24, h: 6 },
      datasource: { uid: dsUid },
      fieldConfig: {
        defaults: {
          noValue: "?", color: { mode: "thresholds" },
          thresholds: { mode: "absolute", steps: [{ color: "#555555", value: null }, { color: "#E45959", value: 0 }, { color: "#73BF69", value: 1 }] },
          mappings: [{ type: "value", options: { "0": { text: "DOWN" }, "1": { text: "UP" } } }]
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        orientation: "auto", // <-- ESTA ES LA CLAVE PARA EL MOSAICO DE CUADROS
        textMode: "name",
        colorMode: "background", 
        graphMode: "none", 
        justifyMode: "center",
        text: { titleSize: 12 }
      },
      targets: [
        {
          refId: "A", schema: 12, queryType: "0",
          group: { filter: "/(switch|FortiGate)/" }, host: { filter: "/.*/" }, item: { filter: "ICMP ping" },
          resultFormat: "time_series", options: { showDisabledItems: false }
        }
      ],
      transformations: [
        { id: "renameByRegex", options: { regex: "(.*):.*", renamePattern: "$1" } }
      ]
    },

    // --- ROW 3: SERVIDORES E HIPERVISORES ---
    {
      id: 9,
      title: "Servidores, Hipervisores y Datacenter",
      type: "stat",
      gridPos: { x: 0, y: 13, w: 24, h: 7 },
      datasource: { uid: dsUid },
      fieldConfig: {
        defaults: {
          noValue: "?", color: { mode: "thresholds" },
          thresholds: { mode: "absolute", steps: [{ color: "#555555", value: null }, { color: "#E45959", value: 0 }, { color: "#73BF69", value: 1 }] },
          mappings: [{ type: "value", options: { "0": { text: "DOWN" }, "1": { text: "UP" } } }]
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        orientation: "auto", 
        textMode: "name", 
        colorMode: "background", 
        graphMode: "none", 
        justifyMode: "center",
        text: { titleSize: 12 }
      },
      targets: [
        {
          refId: "A", schema: 12, queryType: "0",
          group: { filter: "/(Zabbix servers|Datacenter|AD|Backup|Servers)/" }, host: { filter: "/.*/" }, item: { filter: "/(agent.ping|ICMP ping)/" },
          resultFormat: "time_series", options: { showDisabledItems: false }
        }
      ],
      transformations: [
        { id: "renameByRegex", options: { regex: "(.*):.*", renamePattern: "$1" } }
      ]
    },

    // --- ROW 4: ARUBA APs Y UPS ---
    {
      id: 10,
      title: "Puntos de Acceso (ARUBA APs)",
      type: "stat",
      gridPos: { x: 0, y: 20, w: 12, h: 6 },
      datasource: { uid: dsUid },
      fieldConfig: {
        defaults: {
          noValue: "?", color: { mode: "thresholds" },
          thresholds: { mode: "absolute", steps: [{ color: "#555555", value: null }, { color: "#E45959", value: 0 }, { color: "#73BF69", value: 1 }] },
          mappings: [{ type: "value", options: { "0": { text: "DOWN" }, "1": { text: "UP" } } }]
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        orientation: "auto", 
        textMode: "name", 
        colorMode: "background", 
        graphMode: "none", 
        justifyMode: "center",
        text: { titleSize: 12 }
      },
      targets: [
        {
          refId: "A", schema: 12, queryType: "0",
          group: { filter: "ARUBA APs" }, host: { filter: "/.*/" }, item: { filter: "ICMP ping" },
          resultFormat: "time_series", options: { showDisabledItems: false }
        }
      ],
      transformations: [
        { id: "renameByRegex", options: { regex: "(.*):.*", renamePattern: "$1" } }
      ]
    },
    {
      id: 11,
      title: "Energía y Facilities (UPS)",
      type: "stat",
      gridPos: { x: 12, y: 20, w: 12, h: 6 },
      datasource: { uid: dsUid },
      fieldConfig: {
        defaults: {
          noValue: "?", color: { mode: "thresholds" },
          thresholds: { mode: "absolute", steps: [{ color: "#555555", value: null }, { color: "#E45959", value: 0 }, { color: "#73BF69", value: 1 }] },
          mappings: [{ type: "value", options: { "0": { text: "DOWN" }, "1": { text: "UP" } } }]
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        orientation: "auto", 
        textMode: "name", 
        colorMode: "background", 
        graphMode: "none", 
        justifyMode: "center",
        text: { titleSize: 12 }
      },
      targets: [
        {
          refId: "A", schema: 12, queryType: "0",
          group: { filter: "UPS" }, host: { filter: "/.*/" }, item: { filter: "ICMP ping" },
          resultFormat: "time_series", options: { showDisabledItems: false }
        }
      ],
      transformations: [
        { id: "renameByRegex", options: { regex: "(.*):.*", renamePattern: "$1" } }
      ]
    }
  ]
};

async function deploy() {
  console.log("=== DESPLEGANDO DASHBOARD NOC V5 EN GRAFANA ===");
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
    console.log("Dashboard Desplegado V5!");
    fs.writeFileSync(path.join('dashboards', 'noc-zabbix-command-center.json'), JSON.stringify(dashboard, null, 2));
    fs.writeFileSync(path.join('.zabbix_context/dashboards', 'noc-zabbix-command-center.json'), JSON.stringify(dashboard, null, 2));
  } else {
    console.error("Error:", res);
  }
}).catch(console.error);
