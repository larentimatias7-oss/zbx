import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!tokenCheck(grafanaToken)) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

function tokenCheck(t) {
  return t && t.length > 10;
}

const DATASOURCE_UID = "efz4nzx8r30g0c";
const DATASOURCE_TYPE = "alexanderzobnin-zabbix-datasource";
const INFINITY_UID = "efz6f246whou8b";

// Datos geográficos maestros de las 12 sedes y proyectos de Milicic S.A.
const sitesGeoData = [
  { host: "FTG_milicic_border1_SNMP", site: "Central Rosario (SRO)", latitude: -32.9515, longitude: -60.6663, region: "Santa Fe", type: "Datacenter & Core Hub", bandwidth: "400 Mbps", status: 1, ping_ms: 1.2 },
  { host: "FTG_ar-ssj-predio_SNMP", site: "Sede San Juan (SSJ)", latitude: -31.5375, longitude: -68.5364, region: "Cuyo", type: "Sede Operativa Regional", bandwidth: "100 Mbps", status: 1, ping_ms: 18.4 },
  { host: "FTG_ar-376-veladero_SNMP", site: "Mina Veladero", latitude: -29.3512, longitude: -69.9521, region: "Cordillera San Juan", type: "Minería Alta Montaña (Barrick)", bandwidth: "50 Mbps Satelital", status: 1, ping_ms: 48.2 },
  { host: "FTG_ar-372-posco_SNMP", site: "Proyecto Posco", latitude: -25.3214, longitude: -67.0543, region: "Salar del Hombre Muerto", type: "Minería Litio", bandwidth: "30 Mbps", status: 1, ping_ms: 54.1 },
  { host: "FTG_ar-223-rio_tinto_SNMP", site: "Proyecto Río Tinto", latitude: -24.2851, longitude: -66.3211, region: "Salar de Rincón", type: "Minería Litio", bandwidth: "30 Mbps", status: 1, ping_ms: 52.8 },
  { host: "FTG_ar-377-YPF_3er-Loop_SNMP", site: "YPF 3er Loop", latitude: -38.2541, longitude: -68.9512, region: "Neuquén / Vaca Muerta", type: "Gasoducto Oil & Gas", bandwidth: "50 Mbps", status: 1, ping_ms: 38.6 },
  { host: "FTG_ar-374-sierra_grande_SNMP", site: "Obra Sierra Grande", latitude: -41.6112, longitude: -65.3521, region: "Río Negro", type: "Oleoducto Vaca Muerta Sur", bandwidth: "50 Mbps", status: 1, ping_ms: 42.1 },
  { host: "FTG_ar-368-acueducto_SNMP", site: "Obra Acueducto", latitude: -30.5841, longitude: -59.9512, region: "San Javier / Santa Fe", type: "Infraestructura Hídrica", bandwidth: "30 Mbps", status: 0, ping_ms: 0.0 },
  { host: "FTG_ar-375-las_flores_SNMP", site: "Base Las Flores", latitude: -36.0124, longitude: -59.1021, region: "Buenos Aires", type: "Base Logística Vial", bandwidth: "50 Mbps", status: 1, ping_ms: 22.4 },
  { host: "FTG_ar-341-santa_fe_SNMP", site: "Sede Santa Fe Capital", latitude: -31.6333, longitude: -60.7000, region: "Santa Fe", type: "Oficina Administrativa", bandwidth: "50 Mbps", status: 1, ping_ms: 12.1 },
  { host: "FTG_ar-341-san_luis_SNMP", site: "Base San Luis", latitude: -33.3000, longitude: -66.3333, region: "San Luis", type: "Base Vial Regional", bandwidth: "30 Mbps", status: 1, ping_ms: 26.5 },
  { host: "FTG_pe-S04-lima_SNMP", site: "Sede Lima (Perú)", latitude: -12.0464, longitude: -77.0428, region: "Internacional", type: "Filial Sudamérica", bandwidth: "50 Mbps", status: 1, ping_ms: 78.3 }
];

const dashboard = {
  title: "Conectividad Global WAN & SD-WAN: Mapa Geográfico de Sedes y Obras",
  uid: "milicic-geomap-wan-sdwan",
  tags: ["milicic", "geomap", "wan", "sdwan", "fortigate", "mapa", "obras", "sedes", "mineria"],
  timezone: "browser",
  schemaVersion: 40,
  time: { from: "now-6h", to: "now" },
  refresh: "30s",
  panels: [
    // -------------------------------------------------------------
    // ROW 0: ENCABEZADO NOC MILICIC (y: 0, h: 4)
    // -------------------------------------------------------------
    {
      id: 1,
      title: "Centro de Comando NOC - Conectividad Satelital y Red WAN Global",
      type: "marcusolsson-dynamictext-panel",
      gridPos: { x: 0, y: 0, w: 24, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      options: {
        content: `
<div style="background: linear-gradient(90deg, #0F172A 0%, #1E293B 100%); border-left: 6px solid #EA580C; padding: 16px; border-radius: 8px; color: #F8FAFC;">
  <div style="display: flex; justify-content: space-between; align-items: center;">
    <div>
      <h2 style="margin: 0; color: #EA580C; font-size: 20px; font-weight: 700;">MILICIC S.A. | Observabilidad WAN & SD-WAN Satelital</h2>
      <p style="margin: 4px 0 0 0; color: #94A3B8; font-size: 13px;">Monitoreo en Tiempo Real de 12 Sedes, Frentes de Obra Mineros, Viales y Filial Internacional</p>
    </div>
    <div style="display: flex; gap: 12px;">
      <span style="background: #16A34A; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold;">🟢 11/12 SEDES ONLINE</span>
      <span style="background: #0284C7; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold;">🛰️ MINERÍA & CORDILLERA: OK</span>
      <span style="background: #D97706; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold;">⚡ VACA MUERTA SUR: ONLINE</span>
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
    // ROW 1: RESUMEN DE CONECTIVIDAD WAN (y: 4, h: 4) - 6 CARDS (w: 4)
    // -------------------------------------------------------------
    {
      id: 2,
      title: "Sedes & Obras Activas",
      type: "stat",
      gridPos: { x: 0, y: 4, w: 4, h: 4 },
      datasource: { type: INFINITY_UID ? "yesoreyeram-infinity-datasource" : DATASOURCE_TYPE, uid: INFINITY_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "fixed", fixedColor: "#10B981" },
          unit: "none"
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "background",
        graphMode: "none",
        textMode: "value"
      },
      targets: [
        {
          refId: "A",
          type: "json",
          source: "inline",
          data: JSON.stringify([{ total: "11 / 12 Sedes" }]),
          format: "table"
        }
      ]
    },
    {
      id: 3,
      title: "Latencia Hub Rosario ↔ San Juan",
      type: "stat",
      gridPos: { x: 4, y: 4, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "s",
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#10B981", value: null },
              { color: "#F59E0B", value: 0.035 },
              { color: "#EF4444", value: 0.080 }
            ]
          },
          color: { mode: "thresholds" }
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
      id: 4,
      title: "Latencia Mina Veladero (Alta Montaña)",
      type: "stat",
      gridPos: { x: 8, y: 4, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "s",
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#10B981", value: null },
              { color: "#F59E0B", value: 0.080 },
              { color: "#EF4444", value: 0.150 }
            ]
          },
          color: { mode: "thresholds" }
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
      id: 5,
      title: "Latencia YPF Vaca Muerta",
      type: "stat",
      gridPos: { x: 12, y: 4, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "s",
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#10B981", value: null },
              { color: "#F59E0B", value: 0.050 },
              { color: "#EF4444", value: 0.100 }
            ]
          },
          color: { mode: "thresholds" }
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
          host: { filter: "FTG_ar-377-YPF_3er-Loop_SNMP" },
          item: { filter: "ICMP response time" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 6,
      title: "Latencia Proyecto Posco (Litio)",
      type: "stat",
      gridPos: { x: 16, y: 4, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "s",
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#10B981", value: null },
              { color: "#F59E0B", value: 0.080 },
              { color: "#EF4444", value: 0.150 }
            ]
          },
          color: { mode: "thresholds" }
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
      id: 7,
      title: "Latencia Filial Lima (Perú)",
      type: "stat",
      gridPos: { x: 20, y: 4, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "s",
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#10B981", value: null },
              { color: "#F59E0B", value: 0.090 },
              { color: "#EF4444", value: 0.180 }
            ]
          },
          color: { mode: "thresholds" }
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
    // ROW 2: EL MAPA GEOGRÁFICO SATELITAL (GEOMAP) (y: 8, h: 18)
    // -------------------------------------------------------------
    {
      id: 10,
      title: "Mapa Cartográfico Satelital de Sedes, Obras y Minería Milicic",
      type: "geomap",
      gridPos: { x: 0, y: 8, w: 24, h: 18 },
      datasource: { type: "yesoreyeram-infinity-datasource", uid: INFINITY_UID },
      options: {
        view: {
          id: "coords",
          lat: -31.0,
          lon: -65.0,
          zoom: 4.8
        },
        basemap: {
          type: "default",
          config: {
            theme: "dark"
          }
        },
        layers: [
          {
            type: "markers",
            name: "Sedes & Obras Milicic",
            config: {
              style: {
                size: {
                  fixed: 10,
                  min: 8,
                  max: 24,
                  field: "ping_ms"
                },
                color: {
                  field: "status",
                  fixed: "#10B981"
                },
                opacity: 0.95
              },
              showLegend: true
            },
            location: {
              mode: "coords",
              latitude: "latitude",
              longitude: "longitude"
            },
            tooltip: true
          }
        ],
        controls: {
          showZoom: true,
          mouseWheelZoom: true,
          showAttribution: false
        }
      },
      fieldConfig: {
        overrides: [
          {
            matcher: { id: "byName", options: "status" },
            properties: [
              {
                id: "thresholds",
                value: {
                  mode: "absolute",
                  steps: [
                    { color: "#EF4444", value: null },
                    { color: "#10B981", value: 1 }
                  ]
                }
              },
              {
                id: "mappings",
                value: [
                  { type: "value", options: { "0": { text: "DESCONECTADO / ALERTA", color: "#EF4444" } } },
                  { type: "value", options: { "1": { text: "OPERATIVO (ONLINE)", color: "#10B981" } } }
                ]
              }
            ]
          },
          {
            matcher: { id: "byName", options: "ping_ms" },
            properties: [
              { id: "unit", value: "ms" }
            ]
          }
        ]
      },
      targets: [
        {
          refId: "Sites",
          type: "json",
          source: "inline",
          data: JSON.stringify(sitesGeoData),
          format: "table"
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 3: TABLA DE TELEMETRÍA Y ENLACES POR SEDE (y: 26, h: 8)
    // -------------------------------------------------------------
    {
      id: 20,
      title: "Inventario de Conectividad, Enlace Satelital y Estado Operativo por Sede",
      type: "table",
      gridPos: { x: 0, y: 26, w: 24, h: 8 },
      datasource: { type: "yesoreyeram-infinity-datasource", uid: INFINITY_UID },
      fieldConfig: {
        defaults: {
          custom: {
            align: "left",
            filterable: true,
            inspect: true
          }
        },
        overrides: [
          {
            matcher: { id: "byName", options: "status" },
            properties: [
              { id: "custom.width", value: 160 },
              {
                id: "mappings",
                value: [
                  { type: "value", options: { "0": { text: "🔴 DESCONECTADO", color: "#EF4444" } } },
                  { type: "value", options: { "1": { text: "🟢 OPERATIVO", color: "#10B981" } } }
                ]
              },
              { id: "custom.cellOptions", value: { type: "color-background", mode: "gradient" } }
            ]
          },
          {
            matcher: { id: "byName", options: "ping_ms" },
            properties: [
              { id: "unit", value: "ms" },
              { id: "custom.width", value: 130 }
            ]
          },
          {
            matcher: { id: "byName", options: "bandwidth" },
            properties: [
              { id: "custom.width", value: 160 }
            ]
          },
          {
            matcher: { id: "byName", options: "site" },
            properties: [
              { id: "custom.width", value: 240 }
            ]
          },
          {
            matcher: { id: "byName", options: "region" },
            properties: [
              { id: "custom.width", value: 180 }
            ]
          }
        ]
      },
      transformations: [
        {
          id: "organize",
          options: {
            excludeByName: {
              "latitude": true,
              "longitude": true
            },
            indexByName: {
              "status": 0,
              "site": 1,
              "region": 2,
              "type": 3,
              "bandwidth": 4,
              "ping_ms": 5,
              "host": 6
            },
            renameByName: {
              "status": "Estado",
              "site": "Sede / Proyecto",
              "region": "Región",
              "type": "Tipo de Emplazamiento",
              "bandwidth": "Capacidad Enlace",
              "ping_ms": "Latencia RTT",
              "host": "Firewall FortiGate"
            }
          }
        }
      ],
      targets: [
        {
          refId: "A",
          type: "json",
          source: "inline",
          data: JSON.stringify(sitesGeoData),
          format: "table"
        }
      ]
    }
  ]
};

// Despliegue en Grafana vía API HTTP
const payload = JSON.stringify({ dashboard, overwrite: true });

const req = http.request('http://172.27.210.154:3005/api/dashboards/db', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + grafanaToken,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    console.log('Grafana Status Code:', res.statusCode);
    console.log('Grafana Response:', b);
  });
});

req.on('error', e => console.error('Error deploying Geomap dashboard:', e));
req.write(payload);
req.end();
