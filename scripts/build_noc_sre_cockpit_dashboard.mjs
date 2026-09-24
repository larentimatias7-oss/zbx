import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken || grafanaToken.length < 10) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const DATASOURCE_UID = "efz4nzx8r30g0c";
const DATASOURCE_TYPE = "alexanderzobnin-zabbix-datasource";

const dashboard = {
  title: "MILICIC S.A. | SRE Golden Signals & Infrastructure Service Cockpit",
  uid: "milicic-noc-sre-cockpit",
  tags: ["milicic", "noc", "sre", "goldensignals", "slo", "sla", "infrastructure", "cockpit"],
  timezone: "browser",
  schemaVersion: 40,
  time: { from: "now-6h", to: "now" },
  refresh: "30s",
  panels: [
    // -------------------------------------------------------------
    // ROW 0: ENCABEZADO SRE (y: 0, h: 4)
    // -------------------------------------------------------------
    {
      id: 1,
      title: "Centro de Comando SRE - Golden Signals & Niveles de Servicio",
      type: "marcusolsson-dynamictext-panel",
      gridPos: { x: 0, y: 0, w: 24, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      options: {
        content: `
<div style="background: linear-gradient(90deg, #0F172A 0%, #1E293B 100%); border-left: 8px solid #10B981; padding: 18px 24px; border-radius: 8px; color: #F8FAFC; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
  <div>
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="display: inline-block; width: 14px; height: 14px; background: #10B981; border-radius: 50%; box-shadow: 0 0 12px #10B981;"></span>
      <h1 style="margin: 0; color: #34D399; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">MILICIC S.A. | SRE GOLDEN SIGNALS & SERVICE COCKPIT</h1>
    </div>
    <p style="margin: 6px 0 0 0; color: #94A3B8; font-size: 14px;">Monitoreo Basado en los 4 Golden Signals: Latencia, Tráfico, Errores y Saturación de Recursos</p>
  </div>
  <div style="display: flex; gap: 14px;">
    <div style="background: rgba(15,23,42,0.8); border: 1px solid #1E293B; padding: 8px 16px; border-radius: 6px; text-align: center;">
      <span style="color: #64748B; font-size: 11px; font-weight: bold; text-transform: uppercase;">Objetivo SLO</span>
      <div style="color: #10B981; font-size: 14px; font-weight: bold;">99.90% DISP.</div>
    </div>
    <div style="background: rgba(15,23,42,0.8); border: 1px solid #1E293B; padding: 8px 16px; border-radius: 6px; text-align: center;">
      <span style="color: #64748B; font-size: 11px; font-weight: bold; text-transform: uppercase;">Presupuesto de Error</span>
      <div style="color: #38BDF8; font-size: 14px; font-weight: bold;">43 min / mes</div>
    </div>
    <div style="background: rgba(15,23,42,0.8); border: 1px solid #1E293B; padding: 8px 16px; border-radius: 6px; text-align: center;">
      <span style="color: #64748B; font-size: 11px; font-weight: bold; text-transform: uppercase;">Metodología</span>
      <div style="color: #F59E0B; font-size: 14px; font-weight: bold;">USE & RED</div>
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
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Dell N-Series: CPU usage 1m" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 1: 6 SERVICE TIER STATUS CARDS (y: 4, h: 4)
    // -------------------------------------------------------------
    {
      id: 2,
      title: "Tier 1: Perímetro WAN Fortinet",
      type: "stat",
      gridPos: { x: 0, y: 4, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#EF4444", value: null },
              { color: "#10B981", value: 1 }
            ]
          },
          mappings: [
            { type: "value", options: { "0": { text: "DOWN", color: "#EF4444" }, "1": { text: "OPERATIVO", color: "#10B981" } } }
          ]
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "background",
        graphMode: "none",
        textMode: "value_and_name"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "FTG_milicic_border1_SNMP" },
          item: { filter: "ICMP ping" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 3,
      title: "Tier 2: Core 10G Dell Stack",
      type: "stat",
      gridPos: { x: 4, y: 4, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#EF4444", value: null },
              { color: "#10B981", value: 1 }
            ]
          },
          mappings: [
            { type: "value", options: { "0": { text: "DOWN", color: "#EF4444" }, "1": { text: "OPERATIVO", color: "#10B981" } } }
          ]
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "background",
        graphMode: "none",
        textMode: "value_and_name"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "ICMP ping" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 4,
      title: "Tier 3: Clúster ESXi Cómputo",
      type: "stat",
      gridPos: { x: 8, y: 4, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#EF4444", value: null },
              { color: "#10B981", value: 1 }
            ]
          },
          mappings: [
            { type: "value", options: { "0": { text: "DOWN", color: "#EF4444" }, "1": { text: "OPERATIVO", color: "#10B981" } } }
          ]
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "background",
        graphMode: "none",
        textMode: "value_and_name"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "SRO-ESX01" },
          item: { filter: "ICMP ping" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 5,
      title: "Tier 4: Storage Central SAN MSA",
      type: "stat",
      gridPos: { x: 12, y: 4, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#EF4444", value: null },
              { color: "#10B981", value: 1 }
            ]
          },
          mappings: [
            { type: "value", options: { "0": { text: "DOWN", color: "#EF4444" }, "1": { text: "OPERATIVO", color: "#10B981" } } }
          ]
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "background",
        graphMode: "none",
        textMode: "value_and_name"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "SRO-STO01" },
          item: { filter: "ICMP ping" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 6,
      title: "Tier 5: Directorio Activo FSMO",
      type: "stat",
      gridPos: { x: 16, y: 4, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#EF4444", value: null },
              { color: "#10B981", value: 1 }
            ]
          },
          mappings: [
            { type: "value", options: { "0": { text: "DOWN", color: "#EF4444" }, "1": { text: "OPERATIVO", color: "#10B981" } } }
          ]
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "background",
        graphMode: "none",
        textMode: "value_and_name"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "SRO-DCO01" },
          item: { filter: "ICMP ping" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 7,
      title: "Tier 6: Respaldo UPS Emerson",
      type: "stat",
      gridPos: { x: 20, y: 4, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#EF4444", value: null },
              { color: "#10B981", value: 1 }
            ]
          },
          mappings: [
            { type: "value", options: { "0": { text: "ALERTA", color: "#EF4444" }, "1": { text: "ONLINE", color: "#10B981" } } }
          ]
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "background",
        graphMode: "none",
        textMode: "value_and_name"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "UPS SRO CORE" },
          item: { filter: "Battery Status" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 2: GOLDEN SIGNAL: SATURATION & RESOURCE HEADROOM (y: 8, h: 6)
    // -------------------------------------------------------------
    {
      id: 10,
      title: "Golden Signal 1: Saturación de Recursos Clave (CPU, Memoria y Baterías %)",
      type: "bargauge",
      gridPos: { x: 0, y: 8, w: 24, h: 6 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "percent",
          min: 0,
          max: 100,
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#10B981", value: null },
              { color: "#F59E0B", value: 70 },
              { color: "#EF4444", value: 85 }
            ]
          }
        }
      },
      options: {
        orientation: "horizontal",
        displayMode: "gradient",
        showUnfilled: true
      },
      targets: [
        {
          refId: "Core01_CPU",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Dell N-Series: CPU usage 1m" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "Core02_CPU",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE02" },
          item: { filter: "Dell N-Series: CPU usage 1m" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "FTG_CPU",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "FTG_milicic_border1_SNMP" },
          item: { filter: "CPU utilization" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "Zabbix_CPU",
          schema: 12,
          queryType: "0",
          group: { filter: "Zabbix servers" },
          host: { filter: "Zabbix server" },
          item: { filter: "CPU utilization" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "DCO01_CPU",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "SRO-DCO01" },
          item: { filter: "CPU utilization" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "UPS_Load",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "UPS SRO CORE" },
          item: { filter: "UPS Load (%)" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 3: GOLDEN SIGNAL 2: TRAFFIC & GOLDEN SIGNAL 3: LATENCY (y: 14, h: 9)
    // -------------------------------------------------------------
    {
      id: 20,
      title: "Golden Signal 2: Tráfico y Throughput (Backbone 10G vs Perímetro WAN)",
      type: "timeseries",
      gridPos: { x: 0, y: 14, w: 12, h: 9 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          custom: {
            drawStyle: "line",
            lineInterpolation: "smooth",
            lineWidth: 2,
            fillOpacity: 10,
            gradientMode: "opacity"
          },
          unit: "bps",
          color: { mode: "palette-classic" }
        }
      },
      options: {
        tooltip: { mode: "multi", sort: "desc" },
        legend: { displayMode: "table", placement: "bottom", calcs: ["lastNotNull", "max"] }
      },
      targets: [
        {
          refId: "InterCore_LAG",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Interface Te1/0/20(Uplink_SW_Dell): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "Uplink_1930",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Interface Te1/0/6(UPLINK SW211): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "WAN_TASA",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "FTG_milicic_border1_SNMP" },
          item: { filter: "Interface port14(tasa): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "WAN_Claro",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "FTG_milicic_border1_SNMP" },
          item: { filter: "Interface port15(claro): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 25,
      title: "Golden Signal 3: Latencia RTT en Servicios Vitales (Red, Cómputo & Bases)",
      type: "timeseries",
      gridPos: { x: 12, y: 14, w: 12, h: 9 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          custom: {
            drawStyle: "line",
            lineInterpolation: "smooth",
            lineWidth: 2,
            fillOpacity: 10,
            gradientMode: "opacity"
          },
          unit: "s",
          color: { mode: "palette-classic" }
        }
      },
      options: {
        tooltip: { mode: "multi", sort: "desc" },
        legend: { displayMode: "table", placement: "bottom", calcs: ["lastNotNull", "mean"] }
      },
      targets: [
        {
          refId: "CORE01_RTT",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "ICMP response time" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "ESX01_RTT",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "SRO-ESX01" },
          item: { filter: "ICMP response time" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "STO01_RTT",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "SRO-STO01" },
          item: { filter: "ICMP response time" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "SQL01_RTT",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "SRO-SQL01" },
          item: { filter: "ICMP response time" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 4: NOC NAVIGATION HUB & DRILLDOWN (y: 23, h: 4)
    // -------------------------------------------------------------
    {
      id: 30,
      title: "Consola de Acceso Rápido y Navegación NOC",
      type: "marcusolsson-dynamictext-panel",
      gridPos: { x: 0, y: 23, w: 24, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      options: {
        content: `
<div style="background: linear-gradient(90deg, #0F172A 0%, #1E293B 100%); border: 1px solid #334155; padding: 14px 20px; border-radius: 8px; display: flex; justify-content: space-around; align-items: center;">
  <a href="/d/milicic-noc-wallboard" style="text-decoration: none; background: #0284C7; color: white; padding: 10px 18px; border-radius: 6px; font-weight: bold; font-size: 13px; display: flex; align-items: center; gap: 8px; box-shadow: 0 2px 8px rgba(2,132,199,0.4);">
    📺 NOC COMMAND WALLBOARD
  </a>
  <a href="/d/milicic-noc-latency-matrix" style="text-decoration: none; background: #059669; color: white; padding: 10px 18px; border-radius: 6px; font-weight: bold; font-size: 13px; display: flex; align-items: center; gap: 8px; box-shadow: 0 2px 8px rgba(5,150,105,0.4);">
    ⚡ MATRIZ LATENCIA SD-WAN
  </a>
  <a href="/d/milicic-canvas-campus-sro" style="text-decoration: none; background: #7C3AED; color: white; padding: 10px 18px; border-radius: 6px; font-weight: bold; font-size: 13px; display: flex; align-items: center; gap: 8px; box-shadow: 0 2px 8px rgba(124,58,237,0.4);">
    🏢 WEATHERMAP CAMPUS SRO
  </a>
  <a href="/d/milicic-geomap-wan-sdwan" style="text-decoration: none; background: #EA580C; color: white; padding: 10px 18px; border-radius: 6px; font-weight: bold; font-size: 13px; display: flex; align-items: center; gap: 8px; box-shadow: 0 2px 8px rgba(234,88,12,0.4);">
    🛰️ MAPA SATELITAL DE SEDES
  </a>
  <a href="https://zabbix.mlccnet.local" target="_blank" style="text-decoration: none; background: #DC2626; color: white; padding: 10px 18px; border-radius: 6px; font-weight: bold; font-size: 13px; display: flex; align-items: center; gap: 8px; box-shadow: 0 2px 8px rgba(220,38,38,0.4);">
    🔴 ZABBIX 7.0 CONSOLE
  </a>
</div>
        `
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "switch" },
          host: { filter: "SRO-E02-PB00-CORE01" },
          item: { filter: "Dell N-Series: CPU usage 1m" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    }
  ]
};

const payload = JSON.stringify({
  dashboard: dashboard,
  overwrite: true,
  message: "Deploy SRE Golden Signals & Infrastructure Service Cockpit"
});

const req = http.request({
  hostname: '172.27.210.154',
  port: 3005,
  path: '/api/dashboards/db',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + grafanaToken,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', data);
    try {
      const resp = JSON.parse(data);
      if (resp.status === 'success') {
        console.log('\n======================================================');
        console.log('✅ SRE GOLDEN SIGNALS COCKPIT DESPLEGADO CON ÉXITO');
        console.log('URL: http://172.27.210.154:3005' + resp.url);
        console.log('======================================================\n');
      }
    } catch (e) {
      console.error('Error al parsear:', e);
    }
  });
});

req.write(payload);
req.end();
