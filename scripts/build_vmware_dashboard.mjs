import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const dashboard = {
  title: "Virtualización y Storage: VMware, Hypervisors & Datastores",
  uid: "milicic-vmware-datastores",
  tags: ["milicic", "virtualization", "vmware", "hypervisors", "storage"],
  timezone: "browser",
  schemaVersion: 40,
  time: { from: "now-3h", to: "now" },
  refresh: "30s",
  panels: [
    // -------------------------------------------------------------
    // ROW 1: Hypervisor & Core Node Availability (y: 0, h: 4)
    // -------------------------------------------------------------
    {
      id: 1,
      title: "ESXi Node 131 (172.30.70.131)",
      type: "stat",
      gridPos: { x: 0, y: 0, w: 4, h: 4 },
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
          group: { filter: "Datacenter" },
          host: { filter: "172.30.70.131" },
          item: { filter: "Hypervisor ping" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 2,
      title: "ESXi Node 132 (172.30.70.132)",
      type: "stat",
      gridPos: { x: 4, y: 0, w: 4, h: 4 },
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
          group: { filter: "Datacenter" },
          host: { filter: "172.30.70.132" },
          item: { filter: "Hypervisor ping" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 3,
      title: "vCenter Accessibility",
      type: "stat",
      gridPos: { x: 8, y: 0, w: 4, h: 4 },
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
          group: { filter: "Hypervisors" },
          host: { filter: "vCenter" },
          item: { filter: "ICMP ping" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 4,
      title: "San Juan Hyper-V (SSJ-HPV01)",
      type: "stat",
      gridPos: { x: 12, y: 0, w: 4, h: 4 },
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
          group: { filter: "Hypervisors" },
          host: { filter: "SSJ-HPV01" },
          item: { filter: "ICMP ping" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 5,
      title: "File Server (SRO-FIL01)",
      type: "stat",
      gridPos: { x: 16, y: 0, w: 4, h: 4 },
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
          group: { filter: "Windows_Server" },
          host: { filter: "SRO-FIL01" },
          item: { filter: "Zabbix agent ping" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 6,
      title: "Veeam Backup (SRO-BKP01)",
      type: "stat",
      gridPos: { x: 20, y: 0, w: 4, h: 4 },
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
          group: { filter: "Backup_Server" },
          host: { filter: "SRO-BKP01" },
          item: { filter: "Zabbix agent ping" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 2: Datastores & Storage Utilization (y: 4, h: 8)
    // -------------------------------------------------------------
    {
      id: 100,
      title: "Distribución Jerárquica de Capacidad de Almacenamiento & Datastores (Treemap)",
      type: "marcusolsson-treemap-panel",
      gridPos: { x: 0, y: 4, w: 12, h: 8 },
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
          group: { filter: "/.*(Windows_Server|Backup_Server|Storage_Server).*/" },
          host: { filter: "/.*(FIL01|BKP01|APP01|APP03|SQL01).*/" },
          item: { filter: "/FS \\[.*?\\]: Space: Used, in %/" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 7,
      title: "Utilización de Volúmenes y Unidades Críticas (Bar Gauge)",
      type: "bargauge",
      gridPos: { x: 12, y: 4, w: 12, h: 8 },
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
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*(Windows_Server|Backup_Server|Storage_Server).*/" },
          host: { filter: "/.*(FIL01|BKP01|APP01|APP03).*/" },
          item: { filter: "/FS \\[.*?\\]: Space: Used, in %/" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 3: Workload & Saturation: CPU & Memory (y: 12, h: 8)
    // -------------------------------------------------------------
    {
      id: 10,
      title: "CPU Utilization - Carga de Cómputo Servidores Core (%)",
      type: "timeseries",
      gridPos: { x: 0, y: 12, w: 12, h: 8 },
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
        legend: { displayMode: "table", placement: "bottom", calcs: ["lastNotNull", "max", "mean"] }
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/Windows_Server|AD|Backup_Server/" },
          host: { filter: "/SRO-FIL01|SRO-DCO01|SRO-DCO02|SRO-BKP01|SRO-SQL01/" },
          item: { filter: "CPU utilization" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 11,
      title: "Memory Utilization - Saturación de Memoria Servidores Core (%)",
      type: "timeseries",
      gridPos: { x: 12, y: 12, w: 12, h: 8 },
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
        legend: { displayMode: "table", placement: "bottom", calcs: ["lastNotNull", "max", "mean"] }
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/Windows_Server|AD|Backup_Server/" },
          host: { filter: "/SRO-FIL01|SRO-DCO01|SRO-DCO02|SRO-BKP01|SRO-SQL01/" },
          item: { filter: "Memory utilization" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 4: Saturation & Paging (y: 20, h: 6)
    // -------------------------------------------------------------
    {
      id: 12,
      title: "Saturación de Cómputo: Longitud de Cola de Procesador (Processor Queue Length)",
      type: "timeseries",
      gridPos: { x: 0, y: 20, w: 12, h: 6 },
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      fieldConfig: {
        defaults: {
          unit: "none",
          custom: {
            drawStyle: "line",
            lineWidth: 1.5,
            fillOpacity: 10
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
          group: { filter: "Windows_Server" },
          host: { filter: "/.*/" },
          item: { filter: "CPU queue length" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 13,
      title: "Frecuencia de Paginación y Faltas de Página (Page Faults / sec)",
      type: "timeseries",
      gridPos: { x: 12, y: 20, w: 12, h: 6 },
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      fieldConfig: {
        defaults: {
          unit: "ops",
          custom: {
            drawStyle: "line",
            lineWidth: 1.5,
            fillOpacity: 10
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
          group: { filter: "Windows_Server" },
          host: { filter: "/.*/" },
          item: { filter: "Memory page faults per second" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 5: Incidentes Activos en Virtualización y Almacenamiento (y: 26, h: 7)
    // -------------------------------------------------------------
    {
      id: 14,
      title: "Incidentes Activos en Virtualización, Servidores y Almacenamiento (Zabbix Triggers)",
      type: "table",
      gridPos: { x: 0, y: 26, w: 24, h: 7 },
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
          group: { filter: "/Hypervisors|Datacenter|Windows_Server|Backup_Server|Storage_Server|Virtual machines/" },
          host: { filter: "/.*/" },
          showProblems: "problems",
          options: {
            acknowledged: 2,
            minSeverity: 2,
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
fs.writeFileSync(path.join(dashboardsDir, 'milicic-vmware-datastores.json'), JSON.stringify(dashboard, null, 2));

const payload = JSON.stringify({
  dashboard,
  folderUid: "milicic-observability",
  overwrite: true
});

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || "";
if (!grafanaToken) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
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
