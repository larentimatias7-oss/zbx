import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DS = { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" };
const HOST_GROUP = "Zabbix servers";
const HOST = "Zabbix server";

// Thresholds comunes para % de utilización de procesos
const processPctThresholds = {
  mode: "absolute",
  steps: [
    { color: "#73BF69", value: null },   // OK   < 75%
    { color: "#FFC859", value: 75 },     // Warn 75-90%
    { color: "#E45959", value: 90 }      // Crit > 90%
  ]
};

/** Stat panel para un único proceso Zabbix */
function processStat(id, title, itemFilter, x, y, w = 4, h = 4) {
  return {
    id, title, type: "stat",
    gridPos: { x, y, w, h },
    datasource: DS,
    fieldConfig: {
      defaults: {
        unit: "percent",
        min: 0, max: 100,
        color: { mode: "thresholds" },
        thresholds: processPctThresholds
      }
    },
    options: {
      reduceOptions: { calcs: ["lastNotNull"], values: false },
      colorMode: "background",
      graphMode: "area",
      textMode: "auto",
      orientation: "auto"
    },
    targets: [{
      refId: "A", schema: 12, queryType: "0",
      group: { filter: HOST_GROUP },
      host: { filter: HOST },
      item: { filter: itemFilter },
      resultFormat: "time_series",
      options: { showDisabledItems: false }
    }]
  };
}

/** Stat panel para métricas de cache con thresholds invertidos (más libre = mejor) */
function cacheStat(id, title, itemFilter, x, y, w = 6, h = 4, invertedOk = false) {
  const steps = invertedOk
    ? [ { color: "#E45959", value: null }, { color: "#FFC859", value: 20 }, { color: "#73BF69", value: 50 } ]
    : [ { color: "#73BF69", value: null }, { color: "#FFC859", value: 75 }, { color: "#E45959", value: 90 } ];
  return {
    id, title, type: "stat",
    gridPos: { x, y, w, h },
    datasource: DS,
    fieldConfig: {
      defaults: {
        unit: "percent",
        min: 0, max: 100,
        color: { mode: "thresholds" },
        thresholds: { mode: "absolute", steps }
      }
    },
    options: {
      reduceOptions: { calcs: ["lastNotNull"], values: false },
      colorMode: "background",
      graphMode: "area",
      textMode: "auto"
    },
    targets: [{
      refId: "A", schema: 12, queryType: "0",
      group: { filter: HOST_GROUP },
      host: { filter: HOST },
      item: { filter: itemFilter },
      resultFormat: "time_series",
      options: { showDisabledItems: false }
    }]
  };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
const dashboard = {
  title: "Zabbix Server: Health & Performance",
  uid: "milicic-zabbix-server-health",
  tags: ["milicic", "zabbix", "platform", "plataforma", "server-health"],
  timezone: "browser",
  schemaVersion: 40,
  time: { from: "now-3h", to: "now" },
  refresh: "1m",
  panels: [

    // ═══════════════════════════════════════════════════════════════════════
    // ROW 0: TÍTULO
    // ═══════════════════════════════════════════════════════════════════════
    {
      id: 100, type: "row", title: "⚙️ Utilización de Procesos — Zabbix Server",
      collapsed: false, gridPos: { x: 0, y: 0, w: 24, h: 1 }
    },

    // ═══════════════════════════════════════════════════════════════════════
    // ROW 1: KPI STATS — Procesos Clave (y: 1)
    // ═══════════════════════════════════════════════════════════════════════

    // Housekeeper — el protagonista de este cambio
    {
      id: 1,
      title: "🧹 Housekeeper",
      type: "stat",
      gridPos: { x: 0, y: 1, w: 4, h: 5 },
      datasource: DS,
      fieldConfig: {
        defaults: {
          unit: "percent", min: 0, max: 100,
          color: { mode: "thresholds" },
          thresholds: processPctThresholds,
          displayName: "Housekeeper"
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "background", graphMode: "area",
        textMode: "auto", orientation: "auto",
        text: { valueSize: 32 }
      },
      targets: [{
        refId: "A", schema: 12, queryType: "0",
        group: { filter: HOST_GROUP }, host: { filter: HOST },
        item: { filter: "Utilization of housekeeper internal processes, in %" },
        resultFormat: "time_series", options: { showDisabledItems: false }
      }]
    },

    // ICMP Pinger
    processStat(2, "📡 ICMP Pinger",
      "Utilization of icmp pinger data collector processes, in %", 4, 1),

    // Unreachable Poller
    processStat(3, "🔌 Unreachable Poller",
      "Utilization of unreachable poller data collector processes, in %", 8, 1),

    // Poller
    processStat(4, "🔍 Poller",
      "Utilization of poller data collector processes, in %", 12, 1),

    // History Syncer
    processStat(5, "💾 History Syncer",
      "Utilization of history syncer internal processes, in %", 16, 1),

    // VMware Collector
    processStat(6, "☁️ VMware Collector",
      "Utilization of vmware collector data collector processes, in %", 20, 1),

    // ═══════════════════════════════════════════════════════════════════════
    // ROW 2: Segunda fila de stats (y: 6)
    // ═══════════════════════════════════════════════════════════════════════
    processStat(7, "🔧 Preprocessing Worker",
      "Utilization of preprocessing worker internal processes, in %", 0, 6),
    processStat(8, "⚡ LLD Worker",
      "Utilization of LLD worker internal processes, in %", 4, 6),
    processStat(9, "🔔 Escalator",
      "Utilization of escalator internal processes, in %", 8, 6),
    processStat(10, "📤 Alerter",
      "Utilization of alerter internal processes, in %", 12, 6),
    processStat(11, "🌐 SNMP Poller",
      "Utilization of snmp poller data collector processes, in %", 16, 6),
    processStat(12, "🔗 Agent Poller",
      "Utilization of agent poller data collector processes, in %", 20, 6),

    // ═══════════════════════════════════════════════════════════════════════
    // ROW 3: TIME SERIES — Todos los procesos en una sola vista (y: 11)
    // ═══════════════════════════════════════════════════════════════════════
    {
      id: 200, type: "row", title: "📈 Tendencia Histórica de Procesos",
      collapsed: false, gridPos: { x: 0, y: 11, w: 24, h: 1 }
    },
    {
      id: 13,
      title: "Utilización de Procesos — Últimas 3 horas",
      type: "timeseries",
      gridPos: { x: 0, y: 12, w: 24, h: 10 },
      datasource: DS,
      fieldConfig: {
        defaults: {
          unit: "percent", min: 0, max: 100,
          custom: { lineWidth: 2, fillOpacity: 8, spanNulls: true }
        },
        overrides: [
          {
            matcher: { id: "byName", options: "Utilization of housekeeper internal processes, in %" },
            properties: [
              { id: "displayName", value: "Housekeeper" },
              { id: "color", value: { mode: "fixed", fixedColor: "#E45959" } },
              { id: "custom.lineWidth", value: 3 }
            ]
          },
          {
            matcher: { id: "byName", options: "Utilization of icmp pinger data collector processes, in %" },
            properties: [{ id: "displayName", value: "ICMP Pinger" }, { id: "color", value: { mode: "fixed", fixedColor: "#FFC859" } }]
          },
          {
            matcher: { id: "byName", options: "Utilization of unreachable poller data collector processes, in %" },
            properties: [{ id: "displayName", value: "Unreachable Poller" }, { id: "color", value: { mode: "fixed", fixedColor: "#FFA059" } }]
          },
          {
            matcher: { id: "byName", options: "Utilization of poller data collector processes, in %" },
            properties: [{ id: "displayName", value: "Poller" }, { id: "color", value: { mode: "fixed", fixedColor: "#5794F2" } }]
          },
          {
            matcher: { id: "byName", options: "Utilization of history syncer internal processes, in %" },
            properties: [{ id: "displayName", value: "History Syncer" }, { id: "color", value: { mode: "fixed", fixedColor: "#73BF69" } }]
          },
          {
            matcher: { id: "byName", options: "Utilization of vmware collector data collector processes, in %" },
            properties: [{ id: "displayName", value: "VMware Collector" }, { id: "color", value: { mode: "fixed", fixedColor: "#B877D9" } }]
          },
          {
            matcher: { id: "byName", options: "Utilization of preprocessing worker internal processes, in %" },
            properties: [{ id: "displayName", value: "Preprocessing Worker" }, { id: "color", value: { mode: "fixed", fixedColor: "#37872D" } }]
          }
        ]
      },
      options: {
        tooltip: { mode: "multi", sort: "desc" },
        legend: { displayMode: "table", placement: "bottom", calcs: ["lastNotNull", "max", "mean"] }
      },
      targets: [
        {
          refId: "A", schema: 12, queryType: "0",
          group: { filter: HOST_GROUP }, host: { filter: HOST },
          item: { filter: "/Utilization of (housekeeper|icmp pinger|unreachable poller) (internal|data collector) processes/" },
          resultFormat: "time_series", options: { showDisabledItems: false }
        },
        {
          refId: "B", schema: 12, queryType: "0",
          group: { filter: HOST_GROUP }, host: { filter: HOST },
          item: { filter: "/Utilization of (poller|history syncer|vmware collector|preprocessing worker) (internal|data collector) processes/" },
          resultFormat: "time_series", options: { showDisabledItems: false }
        }
      ]
    },

    // ═══════════════════════════════════════════════════════════════════════
    // ROW 4: CACHE & QUEUE (y: 22)
    // ═══════════════════════════════════════════════════════════════════════
    {
      id: 300, type: "row", title: "🗃️ Cache & Queue — Zabbix Server",
      collapsed: false, gridPos: { x: 0, y: 22, w: 24, h: 1 }
    },

    // Cache de Configuración libre %
    cacheStat(14, "🔧 Configuration Cache (libre)",
      "/Configuration cache, % free/", 0, 23, 6, 5, true),

    // History Cache libre %
    cacheStat(15, "📚 History Cache (libre)",
      "/History write cache, % free/", 6, 23, 6, 5, true),

    // Value Cache hits
    {
      id: 16, title: "💡 Value Cache — Hit Rate",
      type: "stat",
      gridPos: { x: 12, y: 23, w: 6, h: 5 },
      datasource: DS,
      fieldConfig: {
        defaults: {
          unit: "percent", min: 0, max: 100,
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#E45959", value: null },
              { color: "#FFC859", value: 50 },
              { color: "#73BF69", value: 80 }
            ]
          }
        }
      },
      options: { reduceOptions: { calcs: ["lastNotNull"], values: false }, colorMode: "background", graphMode: "area" },
      targets: [{
        refId: "A", schema: 12, queryType: "0",
        group: { filter: HOST_GROUP }, host: { filter: HOST },
        item: { filter: "/Value cache effectiveness/" },
        resultFormat: "time_series", options: { showDisabledItems: false }
      }]
    },

    // Queue Size
    {
      id: 17, title: "📋 Queue Size (items en espera)",
      type: "stat",
      gridPos: { x: 18, y: 23, w: 6, h: 5 },
      datasource: DS,
      fieldConfig: {
        defaults: {
          unit: "short",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#73BF69", value: null },
              { color: "#FFC859", value: 100 },
              { color: "#E45959", value: 1000 }
            ]
          }
        }
      },
      options: { reduceOptions: { calcs: ["lastNotNull"], values: false }, colorMode: "background", graphMode: "area" },
      targets: [{
        refId: "A", schema: 12, queryType: "0",
        group: { filter: HOST_GROUP }, host: { filter: HOST },
        item: { filter: "/Queue over 10 minutes|Zabbix queue/" },
        resultFormat: "time_series", options: { showDisabledItems: false }
      }]
    },

    // ═══════════════════════════════════════════════════════════════════════
    // ROW 5: CACHE TIME SERIES (y: 28)
    // ═══════════════════════════════════════════════════════════════════════
    {
      id: 18,
      title: "Cache libre % — Tendencia",
      type: "timeseries",
      gridPos: { x: 0, y: 28, w: 24, h: 8 },
      datasource: DS,
      fieldConfig: {
        defaults: {
          unit: "percent", min: 0, max: 100,
          custom: { lineWidth: 2, fillOpacity: 10, spanNulls: true }
        }
      },
      options: {
        tooltip: { mode: "multi" },
        legend: { displayMode: "table", placement: "bottom", calcs: ["lastNotNull", "min"] }
      },
      targets: [{
        refId: "A", schema: 12, queryType: "0",
        group: { filter: HOST_GROUP }, host: { filter: HOST },
        item: { filter: "/% free|effectiveness/" },
        resultFormat: "time_series", options: { showDisabledItems: false }
      }]
    },

    // ═══════════════════════════════════════════════════════════════════════
    // ROW 6: PROBLEMAS ACTIVOS en Zabbix Server (y: 36)
    // ═══════════════════════════════════════════════════════════════════════
    {
      id: 400, type: "row", title: "🚨 Problemas Activos — Zabbix Server",
      collapsed: false, gridPos: { x: 0, y: 36, w: 24, h: 1 }
    },
    {
      id: 19,
      title: "Problemas Activos",
      type: "table",
      gridPos: { x: 0, y: 37, w: 24, h: 8 },
      datasource: DS,
      fieldConfig: {
        defaults: { custom: { align: "left" } },
        overrides: [
          {
            matcher: { id: "byName", options: "Severidad" },
            properties: [
              { id: "custom.width", value: 100 },
              { id: "mappings", value: [
                { type: "value", options: {
                  "0": { text: "Not classified", color: "#97AAB3" },
                  "1": { text: "Information",    color: "#7499FF" },
                  "2": { text: "Warning",        color: "#FFC859" },
                  "3": { text: "Average",        color: "#FFA059" },
                  "4": { text: "High",           color: "#E97659" },
                  "5": { text: "Disaster",       color: "#E45959" }
                }}
              ]},
              { id: "custom.displayMode", value: "color-background-solid" }
            ]
          },
          {
            matcher: { id: "byName", options: "ACK" },
            properties: [
              { id: "custom.width", value: 60 },
              { id: "mappings", value: [
                { type: "value", options: {
                  "0": { text: "No",  color: "#E45959" },
                  "1": { text: "Sí",  color: "#73BF69" }
                }}
              ]},
              { id: "custom.displayMode", value: "color-text" }
            ]
          }
        ]
      },
      options: {
        sortBy: [{ displayName: "Severidad", desc: true }],
        footer: { show: false }
      },
      transformations: [
        { id: "extractFields", options: { format: "json", source: "Problems" } },
        {
          id: "organize",
          options: {
            excludeByName: {
              Problems: true, triggerid: true, eventid: true, tags: true,
              items: true, groups: true, url: true, comments: true,
              description: true, value: true, opdata: true, suppressed: true,
              suppression_data: true, acknowledges: true
            },
            indexByName: { severity: 0, timestamp: 1, name: 2, hosts: 3, acknowledged: 4 },
            renameByName: {
              severity: "Severidad", timestamp: "Inicio",
              name: "Problema / Alarma", hosts: "Host", acknowledged: "ACK"
            }
          }
        }
      ],
      targets: [{
        refId: "A", schema: 12, queryType: "5",
        group: { filter: HOST_GROUP }, host: { filter: HOST },
        options: { showDisabledItems: false, hostFilter: HOST }
      }]
    }

  ]  // end panels
};  // end dashboard

// ─── Guardar JSON local ───────────────────────────────────────────────────────
const dashboardsDir = path.join('.zabbix_context', 'dashboards');
fs.mkdirSync(dashboardsDir, { recursive: true });
fs.writeFileSync(
  path.join(dashboardsDir, 'milicic-zabbix-server-health.json'),
  JSON.stringify(dashboard, null, 2)
);
console.log('[zabbix-health] JSON guardado en .zabbix_context/dashboards/');

// ─── Deploy a Grafana ─────────────────────────────────────────────────────────
const payload = JSON.stringify({
  dashboard,
  folderUid: "milicic-observability",
  overwrite: true
});

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || "";
if (!grafanaToken) {
  grafanaToken = execSync(
    'powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"',
    { encoding: 'utf8' }
  ).trim();
}

if (!grafanaToken) {
  console.error('[ERROR] GRAFANA_SERVICE_ACCOUNT_TOKEN no encontrado. Exportá la variable y re-ejecutá.');
  process.exit(1);
}

console.log('[zabbix-health] Desplegando dashboard en Grafana...');

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
    const parsed = JSON.parse(b);
    console.log("STATUS:", res.statusCode);
    if (parsed.url) {
      console.log("✅ Dashboard disponible en: http://172.27.210.154:3005" + parsed.url);
    } else {
      console.log("RESPONSE:", b);
    }
  });
});

req.on("error", console.error);
req.write(payload);
req.end();
