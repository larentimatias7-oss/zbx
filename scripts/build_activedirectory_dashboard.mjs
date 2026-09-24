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
  title: "Active Directory & Cyber SOC: Identidades, Seguridad y Salud del Bosque",
  uid: "milicic-activedirectory-soc",
  tags: ["milicic", "ad", "activedirectory", "cyber-soc", "seguridad", "identidades", "windows", "domain-controllers"],
  timezone: "browser",
  schemaVersion: 40,
  time: { from: "now-3h", to: "now" },
  refresh: "1m",
  templating: {
    list: [
      {
        name: "dc",
        label: "Controlador de Dominio",
        type: "custom",
        query: "Todos : (SRO-DCO01|SRO-DCO02|SSJ-DCO01), SRO-DCO01 (Rosario - FSMO) : SRO-DCO01, SRO-DCO02 (Rosario - Sec) : SRO-DCO02, SSJ-DCO01 (San Juan) : SSJ-DCO01",
        current: { text: "Todos", value: "(SRO-DCO01|SRO-DCO02|SSJ-DCO01)" },
        options: [
          { text: "Todos", value: "(SRO-DCO01|SRO-DCO02|SSJ-DCO01)", selected: true },
          { text: "SRO-DCO01 (Rosario - FSMO)", value: "SRO-DCO01", selected: false },
          { text: "SRO-DCO02 (Rosario - Sec)", value: "SRO-DCO02", selected: false },
          { text: "SSJ-DCO01 (San Juan)", value: "SSJ-DCO01", selected: false }
        ],
        includeAll: false,
        hide: 0
      }
    ]
  },
  panels: [
    // -------------------------------------------------------------
    // ROW 0: AUDITORÍA DE IDENTIDAD & CYBER SOC (y: 0, h: 4)
    // -------------------------------------------------------------
    {
      id: 1,
      title: "Cuentas Bloqueadas (Event 4740)",
      type: "stat",
      gridPos: { x: 0, y: 0, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          noValue: "0",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#16A34A", value: null },
              { color: "#E45959", value: 1 }
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
          group: { filter: "AD" },
          host: { filter: "/${dc:raw}/" },
          item: { filter: "Eventlog by Zabbix agent: User locked" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 2,
      title: "Fallos Pre-Auth Kerberos (Event 4771)",
      type: "stat",
      gridPos: { x: 4, y: 0, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          noValue: "0",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#16A34A", value: null },
              { color: "#FFC859", value: 5 },
              { color: "#E45959", value: 20 }
            ]
          },
          unit: "none"
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
          group: { filter: "AD" },
          host: { filter: "/${dc:raw}/" },
          item: { filter: "Eventlog: Fallo de Preautenticación Kerberos (4771)" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 3,
      title: "Logons Fallidos NTLM (Event 4625)",
      type: "stat",
      gridPos: { x: 8, y: 0, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          noValue: "0",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#16A34A", value: null },
              { color: "#FFC859", value: 10 },
              { color: "#E45959", value: 50 }
            ]
          },
          unit: "none"
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
          group: { filter: "AD" },
          host: { filter: "/${dc:raw}/" },
          item: { filter: "Eventlog by Zabbix agent: Failed Login" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 4,
      title: "Cambios en Grupos Admin (4728/4732)",
      type: "stat",
      gridPos: { x: 12, y: 0, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          noValue: "0",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#16A34A", value: null },
              { color: "#E45959", value: 1 }
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
          group: { filter: "AD" },
          host: { filter: "/${dc:raw}/" },
          item: { filter: "Eventlog: Modificación de Grupos Privilegiados (4728, 4732, 4756)" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 5,
      title: "Tiempo de Actividad (Uptime Controladores)",
      type: "stat",
      gridPos: { x: 16, y: 0, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "fixed", fixedColor: "#16A34A" },
          unit: "s"
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
          group: { filter: "AD" },
          host: { filter: "/${dc:raw}/" },
          item: { filter: "Uptime" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 6,
      title: "Incidentes Activos en AD DS",
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
          group: { filter: "AD" },
          host: { filter: "/${dc:raw}/" },
          trigger: { filter: "/.*/" },
          options: { acknowledged: 2, minSeverity: 2 }
        }
      ]
    },
    // -------------------------------------------------------------
    // ROW 1: SEMÁFORO DE SERVICIOS CRÍTICOS AD DS (y: 4, h: 4)
    // NOTA: Cada servicio tiene su propio target (sin regex compuesta)
    // para evitar timeouts en la API de Zabbix.
    // -------------------------------------------------------------
    {
      id: 10,
      title: "Matriz de Servicios Vitales de Active Directory (NTDS | DNS | Kerberos | Netlogon | DFSR | W32Time)",
      type: "status-history",
      gridPos: { x: 0, y: 4, w: 24, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          custom: {
            lineWidth: 1,
            fillOpacity: 80
          },
          mappings: [
            {
              type: "value",
              options: {
                "0": { text: "RUNNING", color: "#16A34A", index: 0 },
                "1": { text: "PAUSED", color: "#FFC859", index: 1 },
                "6": { text: "STOPPED", color: "#E45959", index: 2 },
                "7": { text: "NOT FOUND", color: "#E45959", index: 3 }
              }
            }
          ]
        }
      },
      options: {
        colWidth: 0.9,
        showValue: "never",
        rowHeight: 0.9,
        legend: { displayMode: "list", placement: "bottom" }
      },
      targets: [
        // NTDS — Active Directory Domain Services
        {
          refId: "NTDS",
          schema: 12,
          queryType: "0",
          group: { filter: "AD" },
          host: { filter: "/${dc:raw}/" },
          item: { filter: "State of service \"NTDS\" (Active Directory Domain Services)" },
          resultFormat: "time_series"
        },
        // DNS Server
        {
          refId: "DNS",
          schema: 12,
          queryType: "0",
          group: { filter: "AD" },
          host: { filter: "/${dc:raw}/" },
          item: { filter: "State of service \"DNS\" (DNS Server)" },
          resultFormat: "time_series"
        },
        // Kerberos KDC
        {
          refId: "KDC",
          schema: 12,
          queryType: "0",
          group: { filter: "AD" },
          host: { filter: "/${dc:raw}/" },
          item: { filter: "State of service \"Kdc\" (Kerberos Key Distribution Center)" },
          resultFormat: "time_series"
        },
        // Netlogon
        {
          refId: "NETLOGON",
          schema: 12,
          queryType: "0",
          group: { filter: "AD" },
          host: { filter: "/${dc:raw}/" },
          item: { filter: "State of service \"Netlogon\" (Netlogon)" },
          resultFormat: "time_series"
        },
        // DFS Replication
        {
          refId: "DFSR",
          schema: 12,
          queryType: "0",
          group: { filter: "AD" },
          host: { filter: "/${dc:raw}/" },
          item: { filter: "State of service \"DFSR\" (DFS Replication)" },
          resultFormat: "time_series"
        },
        // Windows Time
        {
          refId: "W32TIME",
          schema: 12,
          queryType: "0",
          group: { filter: "AD" },
          host: { filter: "/${dc:raw}/" },
          item: { filter: "State of service \"W32Time\" (Windows Time)" },
          resultFormat: "time_series"
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 2: CÓMPUTO EN CONTROLADORES - CPU & MEMORIA (y: 8, h: 8)
    // -------------------------------------------------------------
    {
      id: 20,
      title: "Utilización de CPU en Controladores de Dominio (%)",
      type: "timeseries",
      gridPos: { x: 0, y: 8, w: 12, h: 8 },
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
          group: { filter: "AD" },
          host: { filter: "/${dc:raw}/" },
          item: { filter: "CPU utilization" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 21,
      title: "Consumo de Memoria RAM en Controladores de Dominio (%)",
      type: "timeseries",
      gridPos: { x: 12, y: 8, w: 12, h: 8 },
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
              { color: "#FFC859", value: 75 },
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
          group: { filter: "AD" },
          host: { filter: "/${dc:raw}/" },
          item: { filter: "Memory utilization" },
          resultFormat: "time_series"
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 3: CONCURRENCIA, CONTEXT SWITCHES & RED (y: 16, h: 8)
    // -------------------------------------------------------------
    {
      id: 30,
      title: "Cola de Procesador & Concurrencia (Processor Queue Length)",
      type: "timeseries",
      gridPos: { x: 0, y: 16, w: 8, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          custom: {
            drawStyle: "line",
            lineInterpolation: "smooth",
            lineWidth: 2,
            fillOpacity: 10
          },
          unit: "short"
        }
      },
      targets: [
        {
          refId: "Queue",
          schema: 12,
          queryType: "0",
          group: { filter: "AD" },
          host: { filter: "/${dc:raw}/" },
          item: { filter: "CPU queue length" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 32,
      title: "Tasa de Actividad de Autenticación / Context Switches (switches/seg)",
      type: "timeseries",
      gridPos: { x: 8, y: 16, w: 8, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          custom: {
            drawStyle: "line",
            lineInterpolation: "smooth",
            lineWidth: 2,
            fillOpacity: 12
          },
          unit: "ops"
        }
      },
      options: {
        legend: { displayMode: "table", placement: "bottom", calcs: ["lastNotNull", "mean"] }
      },
      targets: [
        {
          refId: "Switches",
          schema: 12,
          queryType: "0",
          group: { filter: "AD" },
          host: { filter: "/${dc:raw}/" },
          item: { filter: "Context switches per second" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 31,
      title: "Throughput de Red en Interfaces de Dominio (Bits In / Out)",
      type: "timeseries",
      gridPos: { x: 16, y: 16, w: 8, h: 8 },
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
          refId: "Net",
          schema: 12,
          queryType: "0",
          group: { filter: "AD" },
          host: { filter: "/${dc:raw}/" },
          item: { filter: "/Interface.*(Ethernet0|eth0).*Bits (received|sent)/i" },
          resultFormat: "time_series"
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 3.5: RENDIMIENTO & COLAS DE DISCO I/O (y: 24, h: 8)
    // -------------------------------------------------------------
    {
      id: 35,
      title: "Longitud de Colas de E/S de Disco (Avg Disk Read & Write Queue Length)",
      type: "timeseries",
      gridPos: { x: 0, y: 24, w: 12, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          custom: {
            drawStyle: "line",
            lineInterpolation: "smooth",
            lineWidth: 2,
            fillOpacity: 10
          },
          unit: "short"
        }
      },
      options: {
        legend: { displayMode: "table", placement: "bottom", calcs: ["lastNotNull", "max"] }
      },
      targets: [
        {
          refId: "ReadQueue",
          schema: 12,
          queryType: "0",
          group: { filter: "AD" },
          host: { filter: "/${dc:raw}/" },
          item: { filter: "0 C:: Average disk read queue length" },
          resultFormat: "time_series"
        },
        {
          refId: "WriteQueue",
          schema: 12,
          queryType: "0",
          group: { filter: "AD" },
          host: { filter: "/${dc:raw}/" },
          item: { filter: "0 C:: Average disk write queue length" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 36,
      title: "Latencia de E/S de Disco (Avg sec/Read & sec/Write en ms)",
      type: "timeseries",
      gridPos: { x: 12, y: 24, w: 12, h: 8 },
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
      options: {
        legend: { displayMode: "table", placement: "bottom", calcs: ["lastNotNull", "max"] }
      },
      targets: [
        {
          refId: "ReadLatency",
          schema: 12,
          queryType: "0",
          group: { filter: "AD" },
          host: { filter: "/${dc:raw}/" },
          item: { filter: "0 C:: Disk read request avg waiting time" },
          resultFormat: "time_series"
        },
        {
          refId: "WriteLatency",
          schema: 12,
          queryType: "0",
          group: { filter: "AD" },
          host: { filter: "/${dc:raw}/" },
          item: { filter: "0 C:: Disk write request avg waiting time" },
          resultFormat: "time_series"
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 4: MAPA HORARIO DE ACTIVIDAD & ALMACENAMIENTO (y: 32, h: 8)
    // -------------------------------------------------------------
    {
      id: 38,
      title: "Matriz 24x7: Densidad Horaria de Carga y Autenticación en Controladores (Hourly Heatmap)",
      type: "marcusolsson-hourly-heatmap-panel",
      gridPos: { x: 0, y: 32, w: 12, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      options: {
        from: 0,
        to: 23
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "AD" },
          host: { filter: "/${dc:raw}/" },
          item: { filter: "Context switches per second" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 41,
      title: "Distribución Jerárquica de Capacidad NTDS/SYSVOL (Treemap)",
      type: "marcusolsson-treemap-panel",
      gridPos: { x: 12, y: 32, w: 12, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      options: {
        tilingAlgorithm: "squarify"
      },
      fieldConfig: {
        defaults: {
          unit: "percent",
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#16A34A", value: null },
              { color: "#FFC859", value: 75 },
              { color: "#E45959", value: 90 }
            ]
          }
        }
      },
      targets: [
        {
          refId: "Disk",
          schema: 12,
          queryType: "0",
          group: { filter: "AD" },
          host: { filter: "/${dc:raw}/" },
          item: { filter: "/FS \\[(\\(?C:\\)?)\\]: Space: Used, in %/" },
          resultFormat: "time_series"
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 5: INCIDENTES ACTIVOS EN CONTROLADORES (y: 40, h: 6)
    // -------------------------------------------------------------
    {
      id: 50,
      title: "Incidentes y Alarmas Activas en Active Directory (Zabbix Problems)",
      type: "table",
      gridPos: { x: 0, y: 40, w: 24, h: 6 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "5",
          group: { filter: "AD" },
          host: { filter: "/${dc:raw}/" },
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
const backupPath = path.join(backupDir, 'milicic-activedirectory-soc.json');
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
        console.log(`\n¡DASHBOARD ACTIVE DIRECTORY DESPLEGADO CON ÉXITO!`);
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
