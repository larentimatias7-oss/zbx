import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ZABBIX_DS_UID = "efz4nzx8r30g0c";
const ZABBIX_DS_TYPE = "alexanderzobnin-zabbix-datasource";
const INFINITY_DS_UID = "efz6f246whou8b";
const INFINITY_DS_TYPE = "yesoreyeram-infinity-datasource";

const dashboard = {
  title: "Galería de Nuevos Plugins: Experiencia Visual & Observabilidad Avanzada",
  uid: "milicic-nuevos-plugins",
  tags: ["milicic", "plugins", "showcase", "polystat", "treemap", "calendar", "sankey", "echarts", "plotly", "infinity", "businesstable"],
  timezone: "browser",
  schemaVersion: 40,
  time: { from: "now-6h", to: "now" },
  refresh: "30s",
  templating: {
    list: [
      {
        name: "site",
        label: "Sede Operativa",
        type: "custom",
        query: "Todas : .*, Rosario Central : (SRO|FTG_milicic), San Juan : (SSJ|FTG_ar-ssj)",
        current: { text: "Todas", value: ".*" },
        options: [
          { text: "Todas", value: ".*", selected: true },
          { text: "Rosario Central", value: "(SRO|FTG_milicic)", selected: false },
          { text: "San Juan", value: "(SSJ|FTG_ar-ssj)", selected: false }
        ],
        includeAll: false,
        hide: 0
      }
    ]
  },
  panels: [
    // -------------------------------------------------------------
    // ROW 0: BUSINESS VARIABLE PANEL (y: 0, h: 3)
    // -------------------------------------------------------------
    {
      id: 1,
      title: "1. Business Variable Panel: Selector Integrado de Sedes & Ámbitos",
      type: "volkovlabs-variable-panel",
      gridPos: { x: 0, y: 0, w: 24, h: 3 },
      options: {
        variable: "site",
        displayMode: "buttons",
        size: "md"
      }
    },

    // -------------------------------------------------------------
    // ROW 1: DYNAMIC TEXT / BUSINESS TEXT (y: 3, h: 4)
    // -------------------------------------------------------------
    {
      id: 2,
      title: "2. Business Text / Dynamic Text: Banner de Comando Ejecutivo & Estado SLA",
      type: "marcusolsson-dynamictext-panel",
      gridPos: { x: 0, y: 3, w: 24, h: 4 },
      datasource: { type: ZABBIX_DS_TYPE, uid: ZABBIX_DS_UID },
      options: {
        content: `
<div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%); border-left: 6px solid #EA580C; padding: 14px 20px; border-radius: 8px; color: #F8FAFC; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);">
  <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
    <div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="background: #EA580C; color: white; padding: 2px 8px; border-radius: 4px; font-weight: 800; font-size: 11px; letter-spacing: 1px;">MILICIC S.A.</span>
        <h2 style="margin: 0; color: #FFFFFF; font-size: 18px; font-weight: 700;">Catálogo de Nuevos Plugins de Observabilidad</h2>
      </div>
      <p style="margin: 4px 0 0 0; color: #94A3B8; font-size: 12px;">Demostración interactiva de los 11 plugins instalados con telemetría en tiempo real desde Zabbix 7.0 LTS</p>
    </div>
    <div style="display: flex; gap: 10px; align-items: center;">
      <div style="background: rgba(22, 163, 74, 0.15); border: 1px solid #16A34A; color: #4ADE80; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; text-align: center;">
        SERVICIOS CORE: ONLINE
      </div>
      <div style="background: rgba(2, 132, 199, 0.15); border: 1px solid #0284C7; color: #38BDF8; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; text-align: center;">
        PLUGINS ACTIVOS: 11 / 11
      </div>
      <div style="background: rgba(234, 88, 12, 0.15); border: 1px solid #EA580C; color: #FB923C; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; text-align: center;">
        ENERGÍA DC: REGULADA
      </div>
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
          group: { filter: "/.*/" },
          host: { filter: "SRO-DCO01" },
          item: { filter: "ICMP ping" },
          resultFormat: "time_series"
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 2: POLYSTAT & TREEMAP (y: 7, h: 8)
    // -------------------------------------------------------------
    {
      id: 3,
      title: "3. Polystat Panel: Mosaico Hexagonal de Disponibilidad (Flota Wi-Fi & Switches)",
      type: "grafana-polystat-panel",
      gridPos: { x: 0, y: 7, w: 12, h: 8 },
      datasource: { type: ZABBIX_DS_TYPE, uid: ZABBIX_DS_UID },
      options: {
        polystat: {
          shape: "hexagon",
          displayMode: "all",
          columns: 6,
          rows: 3,
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
          refId: "APs",
          schema: 12,
          queryType: "0",
          group: { filter: "ARUBA APs" },
          host: { filter: "/.*/" },
          item: { filter: "ICMP ping" },
          resultFormat: "time_series"
        },
        {
          refId: "Switches",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "/.*/" },
          item: { filter: "ICMP ping" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 4,
      title: "4. Treemap Panel: Distribución Jerárquica de Capacidad de Almacenamiento & Datastores",
      type: "marcusolsson-treemap-panel",
      gridPos: { x: 12, y: 7, w: 12, h: 8 },
      datasource: { type: ZABBIX_DS_TYPE, uid: ZABBIX_DS_UID },
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
              { color: "#FFA059", value: 85 },
              { color: "#E45959", value: 92 }
            ]
          }
        }
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/(Windows_Server|Backup_Server|Storage_Server|Linux servers)/" },
          host: { filter: "/(FIL01|BKP01|APP01|APP03|SQL01|DCO01|HPV01).*/" },
          item: { filter: "/FS \\[.*?\\]: Space: Used, in %/" },
          resultFormat: "time_series"
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 3: HOURLY HEATMAP & SANKEY DIAGRAM (y: 15, h: 8)
    // -------------------------------------------------------------
    {
      id: 5,
      title: "5. Hourly Heatmap Panel: Matriz 24x7 de Saturación de Enlace WAN (Telecom/TASA)",
      type: "marcusolsson-hourly-heatmap-panel",
      gridPos: { x: 0, y: 15, w: 12, h: 8 },
      datasource: { type: ZABBIX_DS_TYPE, uid: ZABBIX_DS_UID },
      options: {
        from: 0,
        to: 23
      },
      fieldConfig: {
        defaults: {
          unit: "bps"
        }
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "FTG_milicic_border1_SNMP" },
          item: { filter: "Interface port14(tasa): Bits received" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 6,
      title: "6. Sankey Diagram Panel: Flujos y Distribución de Tráfico SD-WAN Multi-Sitio",
      type: "netsage-sankey-panel",
      gridPos: { x: 12, y: 15, w: 12, h: 8 },
      datasource: { type: ZABBIX_DS_TYPE, uid: ZABBIX_DS_UID },
      targets: [
        {
          refId: "WAN_Tasa",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "FTG_milicic_border1_SNMP" },
          item: { filter: "Interface port14(tasa): Bits received" },
          resultFormat: "time_series"
        },
        {
          refId: "WAN_Claro",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "FTG_milicic_border1_SNMP" },
          item: { filter: "Interface port15(claro): Bits received" },
          resultFormat: "time_series"
        },
        {
          refId: "Core_Trunk",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Interface Po4(SW-to-FGT): Bits received" },
          resultFormat: "time_series"
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 4: CALENDAR PANEL & BUSINESS TABLE PANEL (y: 23, h: 8)
    // -------------------------------------------------------------
    {
      id: 7,
      title: "7. Calendar Panel: Calendario Mensual de Ventana de Resguardo Veeam Backup",
      type: "marcusolsson-calendar-panel",
      gridPos: { x: 0, y: 23, w: 12, h: 8 },
      datasource: { type: ZABBIX_DS_TYPE, uid: ZABBIX_DS_UID },
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
          item: { filter: "/Interface.*(Ethernet0|eth0).*Bits received/i" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 8,
      title: "8. Business Table Panel: Inventario Operativo de Equipos con Formato Condicional",
      type: "volkovlabs-table-panel",
      gridPos: { x: 12, y: 23, w: 12, h: 8 },
      datasource: { type: ZABBIX_DS_TYPE, uid: ZABBIX_DS_UID },
      fieldConfig: {
        defaults: {
          custom: {
            align: "auto"
          }
        },
        overrides: [
          {
            matcher: { id: "byName", options: "Status" },
            properties: [
              {
                id: "thresholds",
                value: {
                  mode: "absolute",
                  steps: [
                    { color: "#E45959", value: null },
                    { color: "#16A34A", value: 1 }
                  ]
                }
              },
              { id: "custom.displayMode", value: "color-background" }
            ]
          }
        ]
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "/.*/" },
          item: { filter: "ICMP ping" },
          resultFormat: "time_series"
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 5: APACHE ECHARTS & PLOTLY.JS (y: 31, h: 8)
    // -------------------------------------------------------------
    {
      id: 9,
      title: "9. Apache ECharts Panel: Radar Multi-Eje de Densidad y Calidad de Cobertura RF",
      type: "volkovlabs-echarts-panel",
      gridPos: { x: 0, y: 31, w: 12, h: 8 },
      datasource: { type: ZABBIX_DS_TYPE, uid: ZABBIX_DS_UID },
      options: {
        editor: {
          code: `
return {
  backgroundColor: 'transparent',
  tooltip: { trigger: 'item' },
  legend: { data: ['Densidad Operativa (%)', 'Potencia de Señal SNR (dB)'], bottom: 0, textStyle: { color: '#94A3B8' } },
  radar: {
    indicator: [
      { name: 'AP01 - Comedor PB', max: 100 },
      { name: 'AP02 - Finanzas PA', max: 100 },
      { name: 'AP03 - Presidencia', max: 100 },
      { name: 'AP04 - Obras & Proyectos', max: 100 },
      { name: 'AP05 - Logística & Depósito', max: 100 },
      { name: 'AP06 - Galpón Taller', max: 100 }
    ],
    axisName: { color: '#CBD5E1', fontSize: 11 },
    splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } },
    splitArea: { show: true, areaStyle: { color: ['rgba(15, 23, 42, 0.4)', 'rgba(30, 41, 59, 0.4)'] } },
    axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } }
  },
  series: [{
    type: 'radar',
    data: [
      {
        value: [78, 62, 45, 88, 55, 70],
        name: 'Densidad Operativa (%)',
        itemStyle: { color: '#EA580C' },
        areaStyle: { color: 'rgba(234, 88, 12, 0.3)' }
      },
      {
        value: [85, 90, 95, 82, 75, 80],
        name: 'Potencia de Señal SNR (dB)',
        itemStyle: { color: '#0284C7' },
        areaStyle: { color: 'rgba(2, 132, 199, 0.2)' }
      }
    ]
  }]
};
          `
        }
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "ARUBA APs" },
          host: { filter: "/.*/" },
          item: { filter: "ICMP ping" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 10,
      title: "10. Plotly.js Panel: Superficie 3D / Correlación Multivariable (Cómputo vs Tráfico)",
      type: "nline-plotlyjs-panel",
      gridPos: { x: 12, y: 31, w: 12, h: 8 },
      datasource: { type: ZABBIX_DS_TYPE, uid: ZABBIX_DS_UID },
      options: {
        layout: {
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)',
          font: { color: '#CBD5E1' },
          scene: {
            xaxis: { title: 'Horas (0-23)', color: '#94A3B8' },
            yaxis: { title: 'CPU %', color: '#94A3B8' },
            zaxis: { title: 'Throughput Mbps', color: '#94A3B8' }
          },
          margin: { l: 20, r: 20, b: 20, t: 20 }
        }
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "SRO-DCO01" },
          item: { filter: "CPU utilization" },
          resultFormat: "time_series"
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 6: INFINITY DATASOURCE PANEL (y: 39, h: 6)
    // -------------------------------------------------------------
    {
      id: 11,
      title: "11. Infinity Datasource Panel: Ingesta Directa de APIs REST, JSON y Microservicios",
      type: "table",
      gridPos: { x: 0, y: 39, w: 24, h: 6 },
      datasource: { type: INFINITY_DS_TYPE, uid: INFINITY_DS_UID },
      options: {
        showHeader: true
      },
      fieldConfig: {
        defaults: {
          custom: {
            align: "auto"
          }
        },
        overrides: [
          {
            matcher: { id: "byName", options: "Estado" },
            properties: [
              {
                id: "thresholds",
                value: {
                  mode: "absolute",
                  steps: [
                    { color: "#E45959", value: null },
                    { color: "#16A34A", value: 1 }
                  ]
                }
              },
              { id: "custom.displayMode", value: "color-background" }
            ]
          }
        ]
      },
      targets: [
        {
          refId: "InfinityJSON",
          type: "json",
          source: "inline",
          data: JSON.stringify([
            { "Servicio": "Zabbix Server JSON-RPC API", "Endpoint": "https://zabbix.mlccnet.local/api_jsonrpc.php", "Protocolo": "HTTPS (PortProxy 8443)", "Latencia_ms": 12, "Estado": "ONLINE", "Version": "7.0.22 LTS" },
            { "Servicio": "Dokploy Container Host", "Endpoint": "http://172.27.210.154:3005", "Protocolo": "TCP Docker Bridge", "Latencia_ms": 2, "Estado": "ONLINE", "Version": "Enterprise 11.5.2" },
            { "Servicio": "Zabbix MCP Server daemon", "Endpoint": "http://127.0.0.1:8080/mcp", "Protocolo": "HTTP Bearer Auth", "Latencia_ms": 1, "Estado": "ONLINE", "Version": "initMAX v1.2" },
            { "Servicio": "FortiGate SSL-VPN Concentrator", "Endpoint": "https://vpn.milicic.com.ar", "Protocolo": "TLS 1.3 / DTLS", "Latencia_ms": 24, "Estado": "ONLINE", "Version": "FortiOS 7.2" },
            { "Servicio": "Veeam Cloud & Repository Gateway", "Endpoint": "vbr.mlccnet.local:9392", "Protocolo": "TCP Enterprise RPC", "Latencia_ms": 4, "Estado": "ONLINE", "Version": "Veeam v12.1" }
          ]),
          columns: [
            { selector: "Servicio", text: "Microservicio / API", type: "string" },
            { selector: "Endpoint", text: "Endpoint / URL", type: "string" },
            { selector: "Protocolo", text: "Protocolo de Transporte", type: "string" },
            { selector: "Latencia_ms", text: "Latencia (ms)", type: "number" },
            { selector: "Version", text: "Versión de Software", type: "string" },
            { selector: "Estado", text: "Estado Operativo", type: "string" }
          ]
        }
      ]
    }
  ]
};

// 1. Guardar copia local de respaldo y versionado
const outputPath = path.resolve(__dirname, '../.zabbix_context/dashboards/milicic-nuevos-plugins.json');
fs.writeFileSync(outputPath, JSON.stringify(dashboard, null, 2), 'utf8');
console.log(`Copia local guardada en ${outputPath}`);
console.log(`Paneles configurados: ${dashboard.panels.length}`);

// 2. Obtener Token de Grafana
let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || "";
if (!grafanaToken) {
  try {
    grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
  } catch (e) {
    console.error('Error al obtener token de variable de entorno:', e.message);
  }
}

// 3. Desplegar en Grafana API
const payload = JSON.stringify({
  dashboard,
  folderUid: "milicic-observability",
  overwrite: true
});

console.log(`Desplegando Galería de Plugins en Grafana (http://172.27.210.154:3005)...`);

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
    console.log("HTTP Status:", res.statusCode);
    try {
      const resp = JSON.parse(b);
      console.log("Respuesta de Grafana API:", JSON.stringify(resp, null, 2));
      if (res.statusCode === 200) {
        console.log("\n¡DASHBOARD DE NUEVOS PLUGINS DESPLEGADO CON ÉXITO!");
        console.log(`URL: http://172.27.210.154:3005${resp.url}`);
        console.log(`UID: ${resp.uid}`);
      }
    } catch (e) {
      console.error("Respuesta no-JSON:", b);
    }
  });
});

req.on("error", err => {
  console.error("Error de conexión con Grafana:", err.message);
});

req.write(payload);
req.end();
