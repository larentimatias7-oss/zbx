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
  title: "Respaldo y Continuidad del Negocio: Veeam Backup & Repositorios de Datos",
  uid: "milicic-backup-veeam",
  tags: ["milicic", "backup", "veeam", "almacenamiento", "bdr", "continuidad", "infraestructura"],
  timezone: "browser",
  schemaVersion: 40,
  time: { from: "now-12h", to: "now" },
  refresh: "30s",
  templating: {
    list: [
      {
        name: "server",
        label: "Servidor / Repositorio",
        type: "custom",
        query: "Todos : (.*BKP.*|.*NAS.*|.*STO.*), Servidores Backup : .*BKP.*, SRO-BKP01 (Rosario) : SRO-BKP01, SSJ-BKP01 (San Juan) : SSJ-BKP01, Almacenamiento NAS/STO : (.*NAS.*|.*STO.*)",
        current: { text: "Todos", value: "(.*BKP.*|.*NAS.*|.*STO.*)" },
        options: [
          { text: "Todos", value: "(.*BKP.*|.*NAS.*|.*STO.*)", selected: true },
          { text: "Servidores Backup", value: ".*BKP.*", selected: false },
          { text: "SRO-BKP01 (Rosario)", value: "SRO-BKP01", selected: false },
          { text: "SSJ-BKP01 (San Juan)", value: "SSJ-BKP01", selected: false },
          { text: "Almacenamiento NAS/STO", value: "(.*NAS.*|.*STO.*)", selected: false }
        ],
        includeAll: false,
        hide: 0
      }
    ]
  },
  panels: [
    // -------------------------------------------------------------
    // ROW 0: KPIS DE RESPALDO, DISPONIBILIDAD & SLA (y: 0, h: 4) - 8 CARDS (w: 3)
    // -------------------------------------------------------------
    {
      id: 1,
      title: "Servidores Backup en Línea",
      type: "stat",
      gridPos: { x: 0, y: 0, w: 3, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "fixed", fixedColor: "#16A34A" },
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
          group: { filter: "/(Backup_Server|Storage_Server)/" },
          host: { filter: "/${server:raw}/" },
          item: { filter: "ICMP ping" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 2,
      title: "Disponibilidad BDR (SLA %)",
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
              { color: "#FFC859", value: 95 },
              { color: "#16A34A", value: 99 }
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
        graphMode: "none",
        textMode: "value"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/(Backup_Server|Storage_Server)/" },
          host: { filter: "/.*(BKP|NAS|STO).*/" },
          item: { filter: "ICMP ping" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 3,
      title: "Salud Servicios Core Veeam",
      type: "stat",
      gridPos: { x: 6, y: 0, w: 3, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#16A34A", value: null },
              { color: "#E45959", value: 1 }
            ]
          },
          mappings: [
            {
              type: "value",
              options: {
                "0": { text: "100% OK", color: "#16A34A" }
              }
            },
            {
              type: "range",
              options: {
                from: 1,
                to: 99,
                result: { text: "Atención", color: "#E45959" }
              }
            }
          ]
        }
      },
      options: {
        reduceOptions: { calcs: ["max"], values: false },
        colorMode: "value",
        graphMode: "none",
        textMode: "value"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/(Backup_Server|Storage_Server)/" },
          host: { filter: "SRO-BKP01" },
          item: { filter: "/State of service \"(VeeamBackupSvc|VeeamBrokerSvc|VeeamTransportSvc)\"/" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 4,
      title: "Transferencia en Backup",
      type: "stat",
      gridPos: { x: 9, y: 0, w: 3, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "fixed", fixedColor: "#5794F2" },
          unit: "bps"
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
          group: { filter: "/(Backup_Server|Storage_Server)/" },
          host: { filter: "/${server:raw}/" },
          item: { filter: "/.*Bits received.*/" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 5,
      title: "Espacio Usado en C: (%)",
      type: "stat",
      gridPos: { x: 12, y: 0, w: 3, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#16A34A", value: null },
              { color: "#FFC859", value: 75 },
              { color: "#E45959", value: 90 }
            ]
          },
          unit: "percent",
          min: 0,
          max: 100
        }
      },
      options: {
        reduceOptions: { calcs: ["max"], values: false },
        colorMode: "value",
        graphMode: "area",
        textMode: "auto"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/(Backup_Server|Storage_Server)/" },
          host: { filter: "/${server:raw}/" },
          item: { filter: "/.*FS.*Space.*Used, in %.*/" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 6,
      title: "Cola de CPU (Queue)",
      type: "stat",
      gridPos: { x: 15, y: 0, w: 3, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#16A34A", value: null },
              { color: "#FFC859", value: 3 },
              { color: "#E45959", value: 8 }
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
          queryType: "0",
          group: { filter: "/(Backup_Server|Storage_Server)/" },
          host: { filter: "/${server:raw}/" },
          item: { filter: "CPU queue length" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 7,
      title: "Uptime Servidores BDR",
      type: "stat",
      gridPos: { x: 18, y: 0, w: 3, h: 4 },
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
        graphMode: "none",
        textMode: "value"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/(Backup_Server|Storage_Server)/" },
          host: { filter: "/${server:raw}/" },
          item: { filter: "Uptime" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 8,
      title: "Incidentes Activos en Backup",
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
          group: { filter: "/(Backup_Server|Storage_Server)/" },
          host: { filter: "/${server:raw}/" },
          trigger: { filter: "/.*/" },
          options: { acknowledged: 2, minSeverity: 1 }
        }
      ]
    },

    // -------------------------------------------------------------
    // -------------------------------------------------------------
    // ROW 1: CAPACIDAD DE ALMACENAMIENTO DE REPOSITORIOS (y: 4, h: 7)
    // -------------------------------------------------------------
    {
      id: 10,
      title: "Capacidad de Almacenamiento en Repositorios y Discos de Backup (%)",
      type: "bargauge",
      gridPos: { x: 0, y: 4, w: 12, h: 7 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          min: 0,
          max: 100,
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
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        orientation: "horizontal",
        displayMode: "gradient",
        showUnfilled: true
      },
      targets: [
        {
          refId: "Disks",
          schema: 12,
          queryType: "0",
          group: { filter: "/(Backup_Server|Storage_Server)/" },
          host: { filter: "/${server:raw}/" },
          item: { filter: "/.*FS.*Space.*Used, in %.*/" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 11,
      title: "Distribución Jerárquica de Capacidad de Discos (Treemap)",
      type: "marcusolsson-treemap-panel",
      gridPos: { x: 12, y: 4, w: 12, h: 7 },
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
          refId: "Disks",
          schema: 12,
          queryType: "0",
          group: { filter: "/(Backup_Server|Storage_Server)/" },
          host: { filter: "/${server:raw}/" },
          item: { filter: "/.*FS.*Space.*Used, in %.*/" },
          resultFormat: "time_series"
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 2: COMPUTO EN SERVIDORES DE BACKUP (y: 11, h: 8)
    // -------------------------------------------------------------
    {
      id: 20,
      title: "Utilización de CPU durante Ventanas de Respaldo (%)",
      type: "timeseries",
      gridPos: { x: 0, y: 11, w: 12, h: 8 },
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
          refId: "CPU",
          schema: 12,
          queryType: "0",
          group: { filter: "/(Backup_Server|Storage_Server)/" },
          host: { filter: "/${server:raw}/" },
          item: { filter: "CPU utilization" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 21,
      title: "Consumo de Memoria RAM en Servidores de Respaldo (%)",
      type: "timeseries",
      gridPos: { x: 12, y: 11, w: 12, h: 8 },
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
          refId: "RAM",
          schema: 12,
          queryType: "0",
          group: { filter: "/(Backup_Server|Storage_Server)/" },
          host: { filter: "/${server:raw}/" },
          item: { filter: "Memory utilization" },
          resultFormat: "time_series"
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 3: CONCURRENCIA & RED EN BACKUP (y: 19, h: 8)
    // -------------------------------------------------------------
    {
      id: 30,
      title: "Cola de Procesamiento & Paging durante Jobs de Veeam",
      type: "timeseries",
      gridPos: { x: 0, y: 19, w: 12, h: 8 },
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
          group: { filter: "/(Backup_Server|Storage_Server)/" },
          host: { filter: "/${server:raw}/" },
          item: { filter: "CPU queue length" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 31,
      title: "Throughput de Red: Tráfico In/Out en Transferencia de Datos",
      type: "timeseries",
      gridPos: { x: 12, y: 19, w: 12, h: 8 },
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
          group: { filter: "/(Backup_Server|Storage_Server)/" },
          host: { filter: "/${server:raw}/" },
          item: { filter: "/.*Bits (received|sent).*/" },
          resultFormat: "time_series"
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 4: CALENDARIO DE VENTANAS & INCIDENTES (y: 27, h: 8)
    // -------------------------------------------------------------
    {
      id: 35,
      title: "Calendario Operativo Mensual de Ventanas de Respaldo Veeam",
      type: "marcusolsson-calendar-panel",
      gridPos: { x: 0, y: 27, w: 12, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      options: {
        calendarType: "month",
        timeField: "Time"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/(Backup_Server|Storage_Server)/" },
          host: { filter: "SRO-BKP01" },
          item: { filter: "/Interface.*Bits received/i" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 40,
      title: "Incidentes y Alarmas Activas en Infraestructura de Backup (Zabbix)",
      type: "table",
      gridPos: { x: 12, y: 27, w: 12, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "5",
          group: { filter: "/(Backup_Server|Storage_Server)/" },
          host: { filter: "/${server:raw}/" },
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
const backupPath = path.join(backupDir, 'milicic-backup-veeam.json');
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
        console.log(`\n¡DASHBOARD BACKUP VEEAM DESPLEGADO CON ÉXITO!`);
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
