import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

function grafanaRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = http.request({
      hostname: '172.27.210.154',
      port: 3005,
      path: path,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(b) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: b });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const C = {
  disaster: '#E02F44',
  high: '#FA6400',
  average: '#F2CC0C',
  warning: '#FADE2A',
  info: '#5794F2',
  ok: '#73BF69',
  brand: '#EA580C',
  blue: '#38BDF8',
  purple: '#A855F7',
  slateDark: '#0F172A',
  slateCard: '#1E293B'
};

const DS = { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' };

async function buildDashboardV2() {
  console.log('1. Loading base configuration from live dashboard...');
  const baseJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../scratch/live_ad_soc.json'), 'utf8'));

  // Create clean V2 structure
  const d2 = {
    ...baseJson,
    title: "Active Directory & Cyber SOC: Identidades, Seguridad y Salud del Bosque V2",
    uid: "milicic-activedirectory-soc-v2",
    version: 1,
    id: null,
    tags: ["milicic", "ad", "activedirectory", "cyber-soc", "v2", "identidades", "windows", "domain-controllers"],
    time: { from: "now-7d", to: "now" },
    refresh: "1m",
    panels: []
  };

  // Helper map of base panels by ID
  const panelMap = {};
  for (const p of baseJson.panels) {
    if (p.type !== 'row') panelMap[p.id] = JSON.parse(JSON.stringify(p));
  }

  // -------------------------------------------------------------
  // SECCIÓN 1: POSTURA DE CIBERSEGURIDAD & KPIS EJECUTIVOS
  // -------------------------------------------------------------
  d2.panels.push({
    id: 100,
    title: "🛡️ 1. Postura de Ciberseguridad & KPIs Ejecutivos (Bosque MLCCNET)",
    type: "row",
    gridPos: { x: 0, y: 0, w: 24, h: 1 },
    collapsed: false,
    panels: []
  });

  // Stat 1: Bloqueos de Cuenta
  const p1 = panelMap[1] || {};
  d2.panels.push({
    ...p1,
    id: 1,
    title: "Bloqueos AD (24h)",
    description: "Cuentas bloqueadas en el bosque en las últimas 24 horas (Multi-DC). Umbral crítico si >= 1.",
    gridPos: { x: 0, y: 1, w: 4, h: 4 },
    fieldConfig: {
      defaults: {
        ...p1.fieldConfig?.defaults,
        displayName: "Bloqueos AD",
        noValue: "0",
        color: { mode: "thresholds" },
        thresholds: {
          mode: "absolute",
          steps: [
            { color: C.ok, value: null },
            { color: C.high, value: 1 },
            { color: C.disaster, value: 5 }
          ]
        }
      }
    },
    options: {
      ...p1.options,
      reduceOptions: { calcs: ["lastNotNull"], fields: "", values: false },
      textMode: "value_and_name",
      colorMode: "background",
      graphMode: "none",
      justifyMode: "center"
    }
  });

  // Stat 2: Fallos de Pre-Autenticación Kerberos
  const p2 = panelMap[2] || {};
  d2.panels.push({
    ...p2,
    id: 2,
    title: "Preauth Kerberos (24h)",
    description: "Fallos de preautenticación Kerberos (Event 4771). Detección de bucles de red y credenciales expiradas.",
    gridPos: { x: 4, y: 1, w: 4, h: 4 },
    fieldConfig: {
      defaults: {
        ...p2.fieldConfig?.defaults,
        displayName: "Preauth Kerb",
        noValue: "0",
        color: { mode: "thresholds" },
        thresholds: {
          mode: "absolute",
          steps: [
            { color: C.ok, value: null },
            { color: C.average, value: 2000 },
            { color: C.high, value: 6000 }
          ]
        }
      }
    },
    options: {
      ...p2.options,
      reduceOptions: { calcs: ["lastNotNull"], fields: "", values: false },
      textMode: "value_and_name",
      colorMode: "background",
      graphMode: "none",
      justifyMode: "center"
    }
  });

  // Stat 3: Fallos de Logon
  const p3 = panelMap[3] || {};
  d2.panels.push({
    ...p3,
    id: 3,
    title: "Fallos Logon (24h)",
    description: "Intentos fallidos de autenticación (Event 4625). Tráfico normal de red < 400 en 24h.",
    gridPos: { x: 8, y: 1, w: 4, h: 4 },
    fieldConfig: {
      defaults: {
        ...p3.fieldConfig?.defaults,
        displayName: "Fallos Logon",
        noValue: "0",
        color: { mode: "thresholds" },
        thresholds: {
          mode: "absolute",
          steps: [
            { color: C.ok, value: null },
            { color: C.average, value: 400 },
            { color: C.high, value: 1000 },
            { color: C.disaster, value: 2500 }
          ]
        }
      }
    },
    options: {
      ...p3.options,
      reduceOptions: { calcs: ["lastNotNull"], fields: "", values: false },
      textMode: "value_and_name",
      colorMode: "background",
      graphMode: "none",
      justifyMode: "center"
    }
  });

  // Stat 4: Modificación de Grupos Admin
  const p4 = panelMap[4] || {};
  d2.panels.push({
    ...p4,
    id: 4,
    title: "Grupos Admin (7d)",
    description: "Modificaciones en grupos privilegiados (Domain Admins / Enterprise Admins).",
    gridPos: { x: 12, y: 1, w: 4, h: 4 },
    fieldConfig: {
      defaults: {
        ...p4.fieldConfig?.defaults,
        displayName: "Modificaciones",
        noValue: "0",
        color: { mode: "thresholds" },
        thresholds: {
          mode: "absolute",
          steps: [
            { color: C.ok, value: null },
            { color: C.high, value: 1 }
          ]
        }
      }
    },
    options: {
      ...p4.options,
      reduceOptions: { calcs: ["lastNotNull"], fields: "", values: false },
      textMode: "value_and_name",
      colorMode: "background",
      graphMode: "none",
      justifyMode: "center"
    }
  });

  // Stat 5: Uptime de Controladores
  const p5 = panelMap[5] || {};
  d2.panels.push({
    ...p5,
    id: 5,
    title: "Disponibilidad / Uptime",
    description: "Tiempo de actividad continuo de los controladores de dominio.",
    gridPos: { x: 16, y: 1, w: 4, h: 4 },
    fieldConfig: {
      defaults: {
        ...p5.fieldConfig?.defaults,
        displayName: "Uptime DC"
      }
    },
    options: {
      ...p5.options,
      textMode: "value_and_name",
      colorMode: "value",
      justifyMode: "center"
    }
  });

  // Stat 6: Incidentes Activos en AD DS
  const p6 = panelMap[6] || {};
  d2.panels.push({
    ...p6,
    id: 6,
    title: "Alarmas Activas AD",
    description: "Total de problemas no resueltos en Zabbix que afectan a controladores de dominio.",
    gridPos: { x: 20, y: 1, w: 4, h: 4 },
    fieldConfig: {
      defaults: {
        ...p6.fieldConfig?.defaults,
        displayName: "Alarmas",
        noValue: "0",
        color: { mode: "thresholds" },
        thresholds: {
          mode: "absolute",
          steps: [
            { color: C.ok, value: null },
            { color: C.high, value: 1 },
            { color: C.disaster, value: 3 }
          ]
        }
      }
    },
    options: {
      ...p6.options,
      reduceOptions: { calcs: ["lastNotNull"], fields: "", values: false },
      textMode: "value_and_name",
      colorMode: "background",
      graphMode: "none",
      justifyMode: "center"
    }
  });

  // -------------------------------------------------------------
  // SECCIÓN 2: TELEMETRÍA DE AUTENTICACIÓN & FALLOS DE LOGON
  // -------------------------------------------------------------
  d2.panels.push({
    id: 110,
    title: "📊 2. Telemetría de Autenticación & Fallos de Logon (Event 4625 & Protocolos)",
    type: "row",
    gridPos: { x: 0, y: 5, w: 24, h: 1 },
    collapsed: false,
    panels: []
  });

  // Panel 201: Tasa Horaria de Fallos de Logon
  d2.panels.push({
    id: 201,
    title: "📈 Tasa Horaria de Fallos de Logon (Event 4625 · Multi-DC)",
    description: "Evolución horaria de intentos fallidos comparando SRO-DCO01 y SRO-DCO02. Permite detectar picos anómalos o intentos de fuerza bruta.",
    type: "timeseries",
    gridPos: { x: 0, y: 6, w: 12, h: 7 },
    datasource: DS,
    timeFrom: "24h",
    fieldConfig: {
      defaults: {
        unit: "short",
        displayName: "Fallos/Hora",
        color: { mode: "palette-classic" },
        custom: {
          drawStyle: "bars",
          barAlignment: 0,
          fillOpacity: 55,
          gradientMode: "opacity",
          lineWidth: 1,
          thresholdsStyle: { mode: "line" }
        },
        thresholds: {
          mode: "absolute",
          steps: [
            { color: C.ok, value: null },
            { color: C.average, value: 25 },
            { color: C.high, value: 50 },
            { color: C.disaster, value: 100 }
          ]
        },
        links: [
          {
            title: "🔍 Ver Logs de Logon Fallido (4625) en Zabbix",
            url: "https://zabbix.mlccnet.local/history.php?action=showvalues&itemids%5B0%5D=83715&itemids%5B1%5D=96713",
            targetBlank: true
          }
        ]
      },
      overrides: [
        {
          matcher: { id: "byName", options: "Tasa de Fallos de Autenticación (1h) · SRO-DCO01" },
          properties: [
            { id: "displayName", value: "SRO-DCO01 (PDC Emulator)" },
            { id: "custom.lineColor", value: C.brand }
          ]
        },
        {
          matcher: { id: "byName", options: "Tasa de Fallos de Autenticación (1h) · SRO-DCO02" },
          properties: [
            { id: "displayName", value: "SRO-DCO02 (Secundario)" },
            { id: "custom.lineColor", value: C.blue }
          ]
        }
      ]
    },
    options: {
      tooltip: { mode: "multi", sort: "desc" },
      legend: { displayMode: "list", placement: "bottom", calcs: ["max", "mean", "lastNotNull"] }
    },
    targets: [
      {
        refId: "DCO01",
        schema: 12,
        queryType: "0",
        group: { filter: "AD" },
        host: { filter: "SRO-DCO01" },
        application: { filter: "" },
        item: { filter: "Tasa de Fallos de Autenticación (1h) · SRO-DCO01" },
        functions: [],
        resultFormat: "time_series",
        options: { showDisabledItems: false }
      },
      {
        refId: "DCO02",
        schema: 12,
        queryType: "0",
        group: { filter: "AD" },
        host: { filter: "SRO-DCO02" },
        application: { filter: "" },
        item: { filter: "Tasa de Fallos de Autenticación (1h) · SRO-DCO02" },
        functions: [],
        resultFormat: "time_series",
        options: { showDisabledItems: false }
      }
    ]
  });

  // Panel 202: Telemetría de Protocolos: Kerberos vs NTLM
  d2.panels.push({
    id: 202,
    title: "🛡️ Telemetría de Protocolos: Kerberos vs NTLM Legado",
    description: "Postura de seguridad: Proporción de autenticaciones legadas NTLM vs Kerberos moderno y fallos de preautenticación.",
    type: "timeseries",
    gridPos: { x: 12, y: 6, w: 12, h: 7 },
    datasource: DS,
    timeFrom: "24h",
    fieldConfig: {
      defaults: {
        custom: {
          drawStyle: "line",
          lineInterpolation: "smooth",
          lineWidth: 2,
          fillOpacity: 15,
          gradientMode: "opacity"
        }
      },
      overrides: [
        {
          matcher: { id: "byName", options: "Ratio Autenticación NTLM / Kerberos (24h)" },
          properties: [
            { id: "unit", value: "percentunit" },
            { id: "custom.lineColor", value: C.ok },
            { id: "displayName", value: "Ratio NTLM / Kerberos" }
          ]
        },
        {
          matcher: { id: "byName", options: "Fallos Preautenticación Kerberos (24h - Multi-DC)" },
          properties: [
            { id: "unit", value: "short" },
            { id: "custom.lineColor", value: C.average },
            { id: "custom.axisPlacement", value: "right" },
            { id: "displayName", value: "Fallos Preauth Kerberos (24h)" }
          ]
        }
      ]
    },
    options: {
      tooltip: { mode: "multi", sort: "desc" },
      legend: { displayMode: "list", placement: "bottom", calcs: ["lastNotNull", "max"] }
    },
    targets: [
      {
        refId: "RATIO",
        schema: 12,
        queryType: "0",
        group: { filter: "AD" },
        host: { filter: "SRO-DCO01" },
        application: { filter: "" },
        item: { filter: "Ratio Autenticación NTLM / Kerberos (24h)" },
        functions: [],
        resultFormat: "time_series",
        options: { showDisabledItems: false }
      },
      {
        refId: "KERB",
        schema: 12,
        queryType: "0",
        group: { filter: "AD" },
        host: { filter: "SRO-DCO01" },
        application: { filter: "" },
        item: { filter: "Fallos Preautenticación Kerberos (24h - Multi-DC)" },
        functions: [],
        resultFormat: "time_series",
        options: { showDisabledItems: false }
      }
    ]
  });

  // -------------------------------------------------------------
  // SECCIÓN 3: AUDITORÍA FORENSE DE IDENTIDADES (ÚLTIMOS 7 DÍAS)
  // -------------------------------------------------------------
  d2.panels.push({
    id: 120,
    title: "🔍 3. Auditoría Forense de Identidades (Eventos 4740 · 4728 · 4720 — Últimos 7 Días)",
    type: "row",
    gridPos: { x: 0, y: 13, w: 24, h: 1 },
    collapsed: false,
    panels: []
  });

  // Tabla 60: Bloqueos de Cuenta
  const p60 = panelMap[60] || {};
  d2.panels.push({
    ...p60,
    id: 60,
    title: "🔒 Bloqueos de Cuenta (Event 4740 · 7 Días)",
    description: "Historial de bloqueos de cuenta correlacionando usuario afectado, workstation origen y fecha exacta.",
    gridPos: { x: 0, y: 14, w: 12, h: 9 }
  });

  // Tabla 61: Modificación de Grupos Privilegiados
  const p61 = panelMap[61] || {};
  d2.panels.push({
    ...p61,
    id: 61,
    title: "👥 Modificación de Grupos Privilegiados",
    description: "Auditoría forense de altas y bajas en grupos administrativos (Domain Admins / Enterprise Admins).",
    gridPos: { x: 12, y: 14, w: 12, h: 9 }
  });

  // Tabla 62: Ciclo de Vida de Cuentas
  const p62 = panelMap[62] || {};
  d2.panels.push({
    ...p62,
    id: 62,
    title: "👤 Ciclo de Vida de Cuentas (Creación, Alta y Baja)",
    description: "Registro de cuentas creadas (4720), habilitadas (4722) y deshabilitadas (4725) en el bosque.",
    gridPos: { x: 0, y: 23, w: 24, h: 8 }
  });

  // -------------------------------------------------------------
  // SECCIÓN 4: SALUD DE SERVICIOS VITALES & REPLICACIÓN
  // -------------------------------------------------------------
  d2.panels.push({
    id: 130,
    title: "⚡ 4. Salud de Servicios Vitales & Replicación de Dominio",
    type: "row",
    gridPos: { x: 0, y: 31, w: 24, h: 1 },
    collapsed: false,
    panels: []
  });

  // Panel 10: Matriz de Servicios Vitales
  const p10 = panelMap[10] || {};
  d2.panels.push({
    ...p10,
    id: 10,
    title: "⚡ Estado de Servicios Vitales de AD DS",
    description: "Monitoreo en tiempo real de NTDS, DNS, Kerberos (Kdc), Netlogon, DFSR y W32Time en cada DC.",
    gridPos: { x: 0, y: 32, w: 24, h: 5 }
  });

  // -------------------------------------------------------------
  // SECCIÓN 5: RENDIMIENTO DE CONTROLADORES DE DOMINIO
  // -------------------------------------------------------------
  d2.panels.push({
    id: 140,
    title: "💻 5. Rendimiento de Controladores de Dominio & Carga de Autenticación",
    type: "row",
    gridPos: { x: 0, y: 37, w: 24, h: 1 },
    collapsed: false,
    panels: []
  });

  // Panel 20: CPU
  const p20 = panelMap[20] || {};
  d2.panels.push({
    ...p20,
    id: 20,
    title: "💻 Consumo de CPU (%)",
    description: "Uso de CPU por controlador. Alerta sostenida si supera el 75%.",
    gridPos: { x: 0, y: 38, w: 12, h: 7 }
  });

  // Panel 21: RAM
  const p21 = panelMap[21] || {};
  d2.panels.push({
    ...p21,
    id: 21,
    title: "🧠 Consumo de Memoria RAM (%)",
    description: "Memoria física utilizada por controlador. Base de datos NTDS cacheada en RAM.",
    gridPos: { x: 12, y: 38, w: 12, h: 7 }
  });

  // Panel 30: Cola CPU
  const p30 = panelMap[30] || {};
  d2.panels.push({
    ...p30,
    id: 30,
    title: "⏳ Cola de CPU (Processor Queue)",
    description: "Hilos listos para ejecución esperando CPU. Un valor > 2 hilos/core indica saturación.",
    gridPos: { x: 0, y: 45, w: 8, h: 6 }
  });

  // Panel 32: Context Switches
  const p32 = panelMap[32] || {};
  d2.panels.push({
    ...p32,
    id: 32,
    title: "🔄 Concurrencia de Autenticación (Context Switches/s)",
    description: "Cambios de contexto por segundo. Refleja carga concurrente de peticiones de autenticación.",
    gridPos: { x: 8, y: 45, w: 8, h: 6 }
  });

  // Panel 31: Throughput de Red
  const p31 = panelMap[31] || {};
  d2.panels.push({
    ...p31,
    id: 31,
    title: "🌐 Tráfico de Red (Bits In / Out)",
    description: "Ancho de banda cursado en las interfaces de red de los controladores.",
    gridPos: { x: 16, y: 45, w: 8, h: 6 }
  });

  // -------------------------------------------------------------
  // SECCIÓN 6: ALMACENAMIENTO & BASE DE DATOS NTDS
  // -------------------------------------------------------------
  d2.panels.push({
    id: 150,
    title: "💾 6. Almacenamiento & Rendimiento de Base de Datos NTDS",
    type: "row",
    gridPos: { x: 0, y: 51, w: 24, h: 1 },
    collapsed: false,
    panels: []
  });

  // Panel 41: Uso Disco C:
  const p41 = panelMap[41] || {};
  d2.panels.push({
    ...p41,
    id: 41,
    title: "💽 Espacio Ocupado en Disco C: (%)",
    description: "Capacidad utilizada en volumen C: donde residen base NTDS.dit y recursos SYSVOL.",
    gridPos: { x: 0, y: 52, w: 6, h: 7 }
  });

  // Panel 35: Colas E/S Disco
  const p35 = panelMap[35] || {};
  d2.panels.push({
    ...p35,
    id: 35,
    title: "⏱️ Colas de E/S en Disco (Read & Write Queue)",
    description: "Longitud de colas promedio de lectura y escritura en disco físico.",
    gridPos: { x: 6, y: 52, w: 9, h: 7 }
  });

  // Panel 36: Latencia E/S Disco
  const p36 = panelMap[36] || {};
  d2.panels.push({
    ...p36,
    id: 36,
    title: "⚡ Latencia de Disco (Avg ms Read/Write)",
    description: "Tiempo promedio de respuesta de lectura y escritura en milisegundos.",
    gridPos: { x: 15, y: 52, w: 9, h: 7 }
  });

  // -------------------------------------------------------------
  // SECCIÓN 7: INCIDENTES Y ALARMAS ACTIVAS
  // -------------------------------------------------------------
  d2.panels.push({
    id: 160,
    title: "🚨 7. Incidentes y Alarmas Activas en Active Directory",
    type: "row",
    gridPos: { x: 0, y: 59, w: 24, h: 1 },
    collapsed: false,
    panels: []
  });

  // Panel 50: Registro de Incidentes
  const p50 = panelMap[50] || {};
  d2.panels.push({
    ...p50,
    id: 50,
    title: "🚨 Registro de Incidentes y Alarmas Activas (Zabbix Triggers)",
    description: "Problemas y disparadores actualmente no resueltos que afectan la infraestructura de Active Directory.",
    gridPos: { x: 0, y: 60, w: 24, h: 7 }
  });

  console.log(`2. Dashboard V2 prepared with ${d2.panels.length} panels.`);

  // Save to file for audit
  fs.writeFileSync(path.join(__dirname, '../.zabbix_context/dashboards/milicic-activedirectory-soc-v2.json'), JSON.stringify(d2, null, 2), 'utf8');

  console.log('3. Deploying to Grafana as a new dashboard (V2)...');
  const saveRes = await grafanaRequest('POST', '/api/dashboards/db', {
    dashboard: d2,
    folderId: 0,
    overwrite: true,
    message: 'Initial deployment of Active Directory & Cyber SOC V2 with human-centric category rows and clean titles'
  });

  if (saveRes.status !== 200) {
    throw new Error(`Failed to save V2 dashboard: ${saveRes.status} - ${JSON.stringify(saveRes.data)}`);
  }

  console.log('SUCCESS! V2 Dashboard created:');
  console.log(`URL: http://172.27.210.154:3005${saveRes.data.url}`);
  console.log(`UID: ${saveRes.data.uid}`);
  console.log(`Version: ${saveRes.data.version}`);
}

buildDashboardV2().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
