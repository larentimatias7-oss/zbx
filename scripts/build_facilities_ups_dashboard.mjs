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
  title: "Datacenter Facilities & Energía Crítica: Monitoreo de UPS & Suministro Eléctrico",
  uid: "milicic-facilities-ups",
  tags: ["milicic", "facilities", "energia", "ups", "datacenter", "baterias", "infraestructura"],
  timezone: "browser",
  schemaVersion: 40,
  time: { from: "now-6h", to: "now" },
  refresh: "30s",
  templating: {
    list: [
      {
        name: "ups",
        label: "Equipo UPS",
        type: "query",
        datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
        query: {
          queryType: "2",
          group: "/UPS/",
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
    // ROW 0: KPIS DE ENERGÍA CRÍTICA (y: 0, h: 4) - 8 CARDS (w: 3)
    // -------------------------------------------------------------
    {
      id: 1,
      title: "Autonomía Mínima Garantizada",
      type: "stat",
      gridPos: { x: 0, y: 0, w: 3, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#E45959", value: null },
              { color: "#FFC859", value: 30 },
              { color: "#16A34A", value: 60 }
            ]
          },
          unit: "m"
        }
      },
      options: {
        reduceOptions: { calcs: ["min"], values: false },
        colorMode: "background",
        graphMode: "none",
        textMode: "value"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/UPS/" },
          host: { filter: "/${ups:regex}/" },
          item: { filter: "Battery Time Remaining" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 2,
      title: "Autonomía Promedio Ponderada",
      type: "stat",
      gridPos: { x: 3, y: 0, w: 3, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#E45959", value: null },
              { color: "#FFC859", value: 60 },
              { color: "#16A34A", value: 120 }
            ]
          },
          unit: "m"
        }
      },
      options: {
        reduceOptions: { calcs: ["mean"], values: false },
        colorMode: "value",
        graphMode: "none",
        textMode: "value"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/UPS/" },
          host: { filter: "/${ups:regex}/" },
          item: { filter: "Battery Time Remaining" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 3,
      title: "Potencia Consumida Datacenter",
      type: "stat",
      gridPos: { x: 6, y: 0, w: 3, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "fixed", fixedColor: "#5794F2" },
          unit: "watt"
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
          host: { filter: "UPS SRO CORE" },
          item: { filter: "UPS Power Consumption (W)" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 4,
      title: "Carga Media del Inversor (%)",
      type: "stat",
      gridPos: { x: 9, y: 0, w: 3, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#16A34A", value: null },
              { color: "#FFC859", value: 70 },
              { color: "#E45959", value: 85 }
            ]
          },
          unit: "percent",
          min: 0,
          max: 100
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
          group: { filter: "/UPS/" },
          host: { filter: "/${ups:regex}/" },
          item: { filter: "UPS Load (%)" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 5,
      title: "Carga de Baterías (%)",
      type: "stat",
      gridPos: { x: 12, y: 0, w: 3, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#E45959", value: null },
              { color: "#FFC859", value: 50 },
              { color: "#16A34A", value: 90 }
            ]
          },
          unit: "percent",
          min: 0,
          max: 100
        }
      },
      options: {
        reduceOptions: { calcs: ["min"], values: false },
        colorMode: "value",
        graphMode: "none",
        textMode: "auto"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/UPS/" },
          host: { filter: "/${ups:regex}/" },
          item: { filter: "Battery Charge Remaining" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 6,
      title: "Tensión de Entrada AC (Red)",
      type: "stat",
      gridPos: { x: 15, y: 0, w: 3, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#E45959", value: null },
              { color: "#FFC859", value: 195 },
              { color: "#16A34A", value: 210 },
              { color: "#FFC859", value: 240 },
              { color: "#E45959", value: 250 }
            ]
          },
          unit: "volt"
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
          group: { filter: "/UPS/" },
          host: { filter: "/${ups:regex}/" },
          item: { filter: "Ups Input Voltage" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 7,
      title: "Tensión de Salida AC (Carga TI)",
      type: "stat",
      gridPos: { x: 18, y: 0, w: 3, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#E45959", value: null },
              { color: "#16A34A", value: 215 },
              { color: "#E45959", value: 235 }
            ]
          },
          unit: "volt"
        }
      },
      options: {
        reduceOptions: { calcs: ["mean"], values: false },
        colorMode: "value",
        graphMode: "none",
        textMode: "auto"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/UPS/" },
          host: { filter: "/${ups:regex}/" },
          item: { filter: "Ups Output Voltage" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 8,
      title: "Incidentes de Energía Activos",
      type: "stat",
      gridPos: { x: 21, y: 0, w: 3, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#16A34A", value: null },
              { color: "#FFC859", value: 1 },
              { color: "#E45959", value: 2 }
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
          queryType: "5",
          group: { filter: "/UPS/" },
          host: { filter: "/${ups:regex}/" },
          trigger: { filter: "/.*/" },
          options: { acknowledged: 2, minSeverity: 1 }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 1: MATRIZ DE ESTADO POR UNIDAD UPS (y: 4, h: 8)
    // -------------------------------------------------------------
    {
      id: 15,
      title: "Mosaico Hexagonal de Energía: Autonomía y Estado de Baterías (Polystat)",
      type: "grafana-polystat-panel",
      gridPos: { x: 0, y: 4, w: 10, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      options: {
        polystat: {
          shape: "hexagon",
          displayMode: "all",
          columns: 3,
          rows: 2,
          fontSize: 12,
          fontColor: "#FFFFFF"
        },
        thresholds: [
          { color: "#E45959", state: 0, value: 0 },
          { color: "#FFC859", state: 1, value: 30 },
          { color: "#16A34A", state: 2, value: 60 }
        ]
      },
      fieldConfig: {
        defaults: {
          unit: "m",
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#E45959", value: null },
              { color: "#FFC859", value: 30 },
              { color: "#16A34A", value: 60 }
            ]
          }
        }
      },
      targets: [
        {
          refId: "Runtime",
          schema: 12,
          queryType: "0",
          group: { filter: "/UPS/" },
          host: { filter: "/${ups:regex}/" },
          item: { filter: "Battery Time Remaining" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 10,
      title: "Matriz Operativa de Sistemas de Energía Ininterrumpida (UPS)",
      type: "table",
      gridPos: { x: 10, y: 4, w: 14, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          custom: { align: "auto" }
        },
        overrides: [
          {
            matcher: { id: "byName", options: "UPS Load (%)" },
            properties: [
              { id: "unit", value: "percent" },
              { id: "custom.cellOptions", value: { type: "gauge", mode: "basic" } },
              {
                id: "thresholds",
                value: {
                  mode: "absolute",
                  steps: [
                    { color: "#16A34A", value: null },
                    { color: "#FFC859", value: 65 },
                    { color: "#E45959", value: 85 }
                  ]
                }
              }
            ]
          },
          {
            matcher: { id: "byName", options: "Battery Charge Remaining" },
            properties: [
              { id: "unit", value: "percent" },
              { id: "custom.cellOptions", value: { type: "color-background" } },
              {
                id: "thresholds",
                value: {
                  mode: "absolute",
                  steps: [
                    { color: "#E45959", value: null },
                    { color: "#FFC859", value: 60 },
                    { color: "#16A34A", value: 90 }
                  ]
                }
              }
            ]
          },
          {
            matcher: { id: "byName", options: "Battery Time Remaining" },
            properties: [
              { id: "unit", value: "m" }
            ]
          },
          {
            matcher: { id: "byName", options: "Ups Input Voltage" },
            properties: [
              { id: "unit", value: "volt" }
            ]
          },
          {
            matcher: { id: "byName", options: "Ups Output Current" },
            properties: [
              { id: "unit", value: "amp" }
            ]
          }
        ]
      },
      transformations: [
        {
          id: "reduce",
          options: { reducers: ["lastNotNull"] }
        }
      ],
      targets: [
        {
          refId: "Load",
          schema: 12,
          queryType: "0",
          group: { filter: "/UPS/" },
          host: { filter: "/${ups:regex}/" },
          item: { filter: "UPS Load (%)" },
          resultFormat: "time_series"
        },
        {
          refId: "Charge",
          schema: 12,
          queryType: "0",
          group: { filter: "/UPS/" },
          host: { filter: "/${ups:regex}/" },
          item: { filter: "Battery Charge Remaining" },
          resultFormat: "time_series"
        },
        {
          refId: "Runtime",
          schema: 12,
          queryType: "0",
          group: { filter: "/UPS/" },
          host: { filter: "/${ups:regex}/" },
          item: { filter: "Battery Time Remaining" },
          resultFormat: "time_series"
        },
        {
          refId: "Vin",
          schema: 12,
          queryType: "0",
          group: { filter: "/UPS/" },
          host: { filter: "/${ups:regex}/" },
          item: { filter: "Ups Input Voltage" },
          resultFormat: "time_series"
        },
        {
          refId: "Iout",
          schema: 12,
          queryType: "0",
          group: { filter: "/UPS/" },
          host: { filter: "/${ups:regex}/" },
          item: { filter: "Ups Output Current" },
          resultFormat: "time_series"
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 2: TELEMETRÍA DE TENSIÓN & CARGA (y: 12, h: 8)
    // -------------------------------------------------------------
    {
      id: 20,
      title: "Calidad de Suministro Eléctrico: Tensión Entrada vs Salida (VAC)",
      type: "timeseries",
      gridPos: { x: 0, y: 12, w: 12, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          custom: {
            drawStyle: "line",
            lineInterpolation: "smooth",
            lineWidth: 2,
            fillOpacity: 10
          },
          unit: "volt"
        }
      },
      targets: [
        {
          refId: "Voltages",
          schema: 12,
          queryType: "0",
          group: { filter: "/UPS/" },
          host: { filter: "/${ups:regex}/" },
          item: { filter: "/Ups (Input|Output) Voltage/" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 21,
      title: "Porcentaje de Carga del Inversor (%) en el Tiempo",
      type: "timeseries",
      gridPos: { x: 12, y: 12, w: 12, h: 8 },
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
          refId: "Load",
          schema: 12,
          queryType: "0",
          group: { filter: "/UPS/" },
          host: { filter: "/${ups:regex}/" },
          item: { filter: "UPS Load (%)" },
          resultFormat: "time_series"
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 3: SALUD DEL BANCO DE BATERÍAS (y: 20, h: 8)
    // -------------------------------------------------------------
    {
      id: 30,
      title: "Autonomía Estimada de Batería (Minutos de Backup)",
      type: "timeseries",
      gridPos: { x: 0, y: 20, w: 12, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          custom: {
            drawStyle: "line",
            lineInterpolation: "smooth",
            lineWidth: 2,
            fillOpacity: 15
          },
          unit: "m",
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "red", value: null },
              { color: "#FFC859", value: 15 },
              { color: "#16A34A", value: 30 }
            ]
          }
        }
      },
      targets: [
        {
          refId: "Runtime",
          schema: 12,
          queryType: "0",
          group: { filter: "/UPS/" },
          host: { filter: "/${ups:regex}/" },
          item: { filter: "Battery Time Remaining" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 31,
      title: "Tensión de Banco de Baterías (VDC) & Corriente de Carga (A)",
      type: "timeseries",
      gridPos: { x: 12, y: 20, w: 12, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          custom: {
            drawStyle: "line",
            lineInterpolation: "smooth",
            lineWidth: 2,
            fillOpacity: 10
          }
        }
      },
      targets: [
        {
          refId: "Vbatt",
          schema: 12,
          queryType: "0",
          group: { filter: "/UPS/" },
          host: { filter: "/${ups:regex}/" },
          item: { filter: "Battery Voltage" },
          resultFormat: "time_series"
        },
        {
          refId: "Iout",
          schema: 12,
          queryType: "0",
          group: { filter: "/UPS/" },
          host: { filter: "/${ups:regex}/" },
          item: { filter: "Ups Output Current" },
          resultFormat: "time_series"
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 4: INCIDENTES ACTIVOS EN ENERGÍA (y: 28, h: 6)
    // -------------------------------------------------------------
    {
      id: 40,
      title: "Alarmas e Incidentes de Energía Crítica y UPS (Zabbix)",
      type: "table",
      gridPos: { x: 0, y: 28, w: 24, h: 6 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "5",
          group: { filter: "/UPS/" },
          host: { filter: "/${ups:regex}/" },
          trigger: { filter: "/.*/" },
          options: { acknowledged: 2, minSeverity: 1 }
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
const backupPath = path.join(backupDir, 'milicic-facilities-ups.json');
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
        console.log(`\n¡DASHBOARD FACILITIES & UPS DESPLEGADO CON ÉXITO!`);
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
