import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken || grafanaToken.length < 10) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const DATASOURCE_UID = "efz4nzx8r30g0c";
const DATASOURCE_TYPE = "alexanderzobnin-zabbix-datasource";

const sites = [
  { host: "FTG_milicic_border1_SNMP", name: "Central Rosario (Hub)", region: "Santa Fe", warn: 0.020, crit: 0.050 },
  { host: "FTG_ar-ssj-predio_SNMP", name: "Sede San Juan", region: "Cuyo", warn: 0.035, crit: 0.070 },
  { host: "FTG_ar-376-veladero_SNMP", name: "Mina Veladero", region: "San Juan", warn: 0.080, crit: 0.150 },
  { host: "FTG_ar-372-posco_SNMP", name: "Proyecto Posco", region: "Salta", warn: 0.080, crit: 0.150 },
  { host: "FTG_ar-223-rio_tinto_SNMP", name: "Proyecto Río Tinto", region: "Salta", warn: 0.080, crit: 0.150 },
  { host: "FTG_ar-377-YPF_3er-Loop_SNMP", name: "YPF Vaca Muerta", region: "Neuquén", warn: 0.050, crit: 0.100 },
  { host: "FTG_ar-374-sierra_grande_SNMP", name: "Obra Sierra Grande", region: "Río Negro", warn: 0.050, crit: 0.100 },
  { host: "FTG_ar-368-acueducto_SNMP", name: "Obra Acueducto", region: "Santa Fe", warn: 0.040, crit: 0.080 },
  { host: "FTG_ar-375-las_flores_SNMP", name: "Base Las Flores", region: "Buenos Aires", warn: 0.035, crit: 0.070 },
  { host: "FTG_ar-341-santa_fe_SNMP", name: "Sede Santa Fe", region: "Santa Fe", warn: 0.025, crit: 0.060 },
  { host: "FTG_ar-341-san_luis_SNMP", name: "Base San Luis", region: "San Luis", warn: 0.035, crit: 0.070 },
  { host: "FTG_pe-S04-lima_SNMP", name: "Filial Lima (Perú)", region: "Internacional", warn: 0.090, crit: 0.180 }
];

// Generar paneles stat tiles para la grilla
const siteTilePanels = sites.map((s, idx) => {
  const col = (idx % 6) * 4;
  const row = 8 + Math.floor(idx / 6) * 4;
  return {
    id: 100 + idx,
    title: s.name,
    type: "stat",
    gridPos: { x: col, y: row, w: 4, h: 4 },
    datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
    fieldConfig: {
      defaults: {
        unit: "s",
        color: { mode: "thresholds" },
        thresholds: {
          mode: "absolute",
          steps: [
            { color: "#10B981", value: null },
            { color: "#F59E0B", value: s.warn },
            { color: "#EF4444", value: s.crit }
          ]
        }
      }
    },
    options: {
      reduceOptions: { calcs: ["lastNotNull"], values: false },
      colorMode: "background",
      graphMode: "area",
      textMode: "value_and_name"
    },
    targets: [
      {
        refId: "A",
        schema: 12,
        queryType: "0",
        group: { filter: "/(FortiGate|FortiWorld)/" },
        host: { filter: s.host },
        item: { filter: "ICMP response time" },
        resultFormat: "time_series",
        options: { showDisabledItems: false }
      }
    ]
  };
});

// Targets para el gráfico comparativo
const rttTimeseriesTargets = sites.map((s, idx) => ({
  refId: "S" + idx,
  schema: 12,
  queryType: "0",
  group: { filter: "/(FortiGate|FortiWorld)/" },
  host: { filter: s.host },
  item: { filter: "ICMP response time" },
  resultFormat: "time_series",
  options: { showDisabledItems: false }
}));

// Targets para el bar gauge de pérdida de paquetes
const packetLossTargets = sites.map((s, idx) => ({
  refId: "L" + idx,
  schema: 12,
  queryType: "0",
  group: { filter: "/(FortiGate|FortiWorld)/" },
  host: { filter: s.host },
  item: { filter: "ICMP loss" },
  resultFormat: "time_series",
  options: { showDisabledItems: false }
}));

const dashboard = {
  title: "MILICIC S.A. | Matriz de Calidad WAN & Latencia SD-WAN (Smokeping)",
  uid: "milicic-noc-latency-matrix",
  tags: ["milicic", "noc", "latency", "sdwan", "smokeping", "wan", "icmp", "obras", "mineria"],
  timezone: "browser",
  schemaVersion: 40,
  time: { from: "now-6h", to: "now" },
  refresh: "30s",
  panels: [
    // -------------------------------------------------------------
    // ROW 0: ENCABEZADO NOC (y: 0, h: 4)
    // -------------------------------------------------------------
    {
      id: 1,
      title: "Centro de Comando NOC - Matriz de Calidad de Enlaces WAN",
      type: "marcusolsson-dynamictext-panel",
      gridPos: { x: 0, y: 0, w: 24, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      options: {
        content: `
<div style="background: linear-gradient(90deg, #0F172A 0%, #1E293B 100%); border-left: 8px solid #0284C7; padding: 18px 24px; border-radius: 8px; color: #F8FAFC; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
  <div>
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="display: inline-block; width: 14px; height: 14px; background: #0284C7; border-radius: 50%; box-shadow: 0 0 12px #0284C7;"></span>
      <h1 style="margin: 0; color: #38BDF8; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">MILICIC S.A. | MATRIZ DE CALIDAD WAN & LATENCIA SD-WAN</h1>
    </div>
    <p style="margin: 6px 0 0 0; color: #94A3B8; font-size: 14px;">Telemetría RTT Continua, Pérdida de Paquetes y Jitter en Frentes Mineros, Viales, Sedes y Filial Perú</p>
  </div>
  <div style="display: flex; gap: 14px;">
    <div style="background: rgba(15,23,42,0.8); border: 1px solid #1E293B; padding: 8px 16px; border-radius: 6px; text-align: center;">
      <span style="color: #64748B; font-size: 11px; font-weight: bold; text-transform: uppercase;">Sedes Monitoreadas</span>
      <div style="color: #38BDF8; font-size: 14px; font-weight: bold;">12 PUNTOS</div>
    </div>
    <div style="background: rgba(15,23,42,0.8); border: 1px solid #1E293B; padding: 8px 16px; border-radius: 6px; text-align: center;">
      <span style="color: #64748B; font-size: 11px; font-weight: bold; text-transform: uppercase;">Minería de Altura</span>
      <div style="color: #22C55E; font-size: 14px; font-weight: bold;">ENLACE SATELITAL OK</div>
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
    // ROW 1: 4 STRATEGIC LATENCY HIGHLIGHTS (y: 4, h: 4)
    // -------------------------------------------------------------
    {
      id: 2,
      title: "Latencia Hub Rosario ↔ San Juan",
      type: "stat",
      gridPos: { x: 0, y: 4, w: 6, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "s",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#10B981", value: null },
              { color: "#F59E0B", value: 0.035 },
              { color: "#EF4444", value: 0.070 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "background",
        graphMode: "area"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "FTG_ar-ssj-predio_SNMP" },
          item: { filter: "ICMP response time" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 3,
      title: "Latencia Mina Veladero (4000 msnm)",
      type: "stat",
      gridPos: { x: 6, y: 4, w: 6, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "s",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#10B981", value: null },
              { color: "#F59E0B", value: 0.080 },
              { color: "#EF4444", value: 0.150 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "background",
        graphMode: "area"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "FTG_ar-376-veladero_SNMP" },
          item: { filter: "ICMP response time" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 4,
      title: "Latencia Proyecto Posco (Litio)",
      type: "stat",
      gridPos: { x: 12, y: 4, w: 6, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "s",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#10B981", value: null },
              { color: "#F59E0B", value: 0.080 },
              { color: "#EF4444", value: 0.150 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "background",
        graphMode: "area"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "FTG_ar-372-posco_SNMP" },
          item: { filter: "ICMP response time" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 5,
      title: "Latencia Filial Lima (Perú)",
      type: "stat",
      gridPos: { x: 18, y: 4, w: 6, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "s",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#10B981", value: null },
              { color: "#F59E0B", value: 0.090 },
              { color: "#EF4444", value: 0.180 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "background",
        graphMode: "area"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "FTG_pe-S04-lima_SNMP" },
          item: { filter: "ICMP response time" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 2: GRILLA COMPLETA DE 12 SEDES (y: 8, h: 8)
    // -------------------------------------------------------------
    ...siteTilePanels,

    // -------------------------------------------------------------
    // ROW 3: CURVA COMPARATIVA MULTI-SEDE & PACKET LOSS (y: 16, h: 10)
    // -------------------------------------------------------------
    {
      id: 200,
      title: "Curva Comparativa Continua de Latencia RTT Multi-Sede (Smokeping)",
      type: "timeseries",
      gridPos: { x: 0, y: 16, w: 16, h: 10 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          custom: {
            drawStyle: "line",
            lineInterpolation: "smooth",
            lineWidth: 2,
            fillOpacity: 5,
            gradientMode: "opacity"
          },
          unit: "s",
          color: { mode: "palette-classic" }
        }
      },
      options: {
        tooltip: { mode: "multi", sort: "desc" },
        legend: { displayMode: "table", placement: "right", calcs: ["lastNotNull", "mean", "max"] }
      },
      targets: rttTimeseriesTargets
    },
    {
      id: 205,
      title: "Pérdida de Paquetes ICMP (%) en Tiempo Real",
      type: "bargauge",
      gridPos: { x: 16, y: 16, w: 8, h: 10 },
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
              { color: "#F59E0B", value: 1 },
              { color: "#EF4444", value: 5 }
            ]
          }
        }
      },
      options: {
        orientation: "horizontal",
        displayMode: "gradient",
        showUnfilled: true
      },
      targets: packetLossTargets
    },

    // -------------------------------------------------------------
    // ROW 4: BALANCE DE TRÁFICO SD-WAN (y: 26, h: 8)
    // -------------------------------------------------------------
    {
      id: 210,
      title: "Balance de Tráfico SD-WAN Perimetral: TASA vs Claro (RX / TX)",
      type: "timeseries",
      gridPos: { x: 0, y: 26, w: 24, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          custom: {
            drawStyle: "line",
            lineInterpolation: "smooth",
            lineWidth: 2,
            fillOpacity: 12,
            gradientMode: "opacity"
          },
          unit: "bps",
          color: { mode: "palette-classic" }
        }
      },
      options: {
        tooltip: { mode: "multi", sort: "desc" },
        legend: { displayMode: "table", placement: "right", calcs: ["lastNotNull", "max"] }
      },
      targets: [
        {
          refId: "TASA_RX",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "FTG_milicic_border1_SNMP" },
          item: { filter: "Interface port14(tasa): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "TASA_TX",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "FTG_milicic_border1_SNMP" },
          item: { filter: "Interface port14(tasa): Bits sent" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "Claro_RX",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "FTG_milicic_border1_SNMP" },
          item: { filter: "Interface port15(claro): Bits received" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "Claro_TX",
          schema: 12,
          queryType: "0",
          group: { filter: "/(FortiGate|FortiWorld)/" },
          host: { filter: "FTG_milicic_border1_SNMP" },
          item: { filter: "Interface port15(claro): Bits sent" },
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
  message: "Deploy SD-WAN & Remote Sites Network Latency Matrix"
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
        console.log('✅ MATRIZ DE LATENCIA SD-WAN DESPLEGADA CON ÉXITO');
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
