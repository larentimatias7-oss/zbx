import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function api(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: '172.27.210.154',
      port: 3005,
      path,
      method,
      headers: {
        'Authorization': 'Bearer ' + token,
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(b) });
        } catch(e) {
          resolve({ status: res.statusCode, raw: b });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// Mapeo amigable de Sedes para leyendas de red
const SEDES_MAP = [
  { match: 'border1', label: '🏢 Rosario (Borde Core)' },
  { match: '377|YPF|Loop', label: '🛢️ YPF 3er Loop' },
  { match: '374|sierra_grande', label: '⛏️ Sierra Grande' },
  { match: '223|rio_tinto', label: '⛏️ Río Tinto (Salta)' },
  { match: '372|posco', label: '⛏️ Posco (Litio)' },
  { match: 'santa_fe', label: '📍 Santa Fe' },
  { match: 'san_luis', label: '📍 San Luis' },
  { match: 'las_flores', label: '📍 Las Flores' },
  { match: 'lima', label: '🇵🇪 Lima (Perú)' },
  { match: 'veladero', label: '⛏️ Veladero' },
  { match: 'acueducto', label: '💧 Acueducto' },
  { match: 'ssj|san_juan', label: '🏢 San Juan (Predio)' }
];

async function main() {
  console.log('1. Obteniendo dashboard actual...');
  const res = await api('/api/dashboards/uid/noc-zabbix-command-center');
  if (res.status !== 200) throw new Error('Error al obtener dashboard: ' + res.status);
  
  const dash = res.data.dashboard;
  console.log(`Versión actual: ${dash.version}`);
  
  // Guardar backup
  fs.writeFileSync(`./scratch/dash_backup_before_enhancement_v${dash.version}.json`, JSON.stringify(dash, null, 2));

  // --- 1. MEJORA DEL PANEL 15: TRÁFICO DE SESIONES ACTIVAS ---
  const p15 = dash.panels.find(p => p.id === 15);
  if (p15) {
    console.log('Optimizando Panel 15 (Sesiones Activas)...');
    p15.title = '🛡️ Tráfico de Sesiones Activas (FortiGates SD-WAN)';
    p15.description = 'Sesiones concurrentes activas. Umbrales: 🟡 Preventivo 18K | 🔴 Crítico 22K (calculado sobre el baseline histórico de 7 días).';
    
    // Eje Y con escala suficiente para ver la línea de 22K
    p15.fieldConfig.defaults.custom = {
      ...p15.fieldConfig.defaults.custom,
      axisSoftMax: 24000,
      axisPlacement: 'left',
      gradientMode: 'opacity',
      fillOpacity: 14,
      lineWidth: 2,
      lineInterpolation: 'smooth',
      thresholdsStyle: { mode: 'line' }
    };

    // Umbrales claros
    p15.fieldConfig.defaults.thresholds = {
      mode: 'absolute',
      steps: [
        { color: '#73BF69', value: null },
        { color: '#F2CC0C', value: 18000 },
        { color: '#E02F44', value: 22000 }
      ]
    };

    // Leyenda en Modo Tabla ordenada con Último y Máximo
    p15.options.legend = {
      calcs: ['lastNotNull', 'max'],
      displayMode: 'table',
      placement: 'bottom',
      showLegend: true,
      sortBy: 'Last *',
      sortDesc: true
    };

    // Overrides de nombres amigables con Emojis corporativos
    p15.fieldConfig.overrides = SEDES_MAP.map(s => ({
      matcher: { id: 'byRegexp', options: `.*(${s.match}).*` },
      properties: [{ id: 'displayName', value: s.label }]
    }));
  }

  // --- 2. MEJORA DE LOS TÍTULOS E INDICADORES KPI DE CABECERA ---
  const titlesUpgrade = {
    16: '⏱️ Latido Zabbix Server',
    3: '🖥️ Nodos Monitoreados',
    7: '🌐 Disponibilidad Global Red',
    4: '🚨 Incidentes P1 (Disaster/High)',
    5: '⚠️ Alertas P2/P3 (Preventivas)',
    2: '⚙️ Motor Zabbix Core',
    8: '🛡️ Perímetro SD-WAN (Firewalls)',
    9: '💾 Servidores & Storage (Cómputo Core)',
    10: '🔌 Conmutación LAN & Wi-Fi (Switches/APs)',
    11: '⚡ Energía Crítica (UPS Datacenters)',
    17: '⚡ Tensión Entrada UPS (220V)',
    28: '🔋 Autonomía Baterías UPS (Min)',
    24: '🔒 Teletrabajo (VPN SSL Activas)',
    30: '🔗 Malla IPsec Core (Rosario ➔ San Juan & SAP)',
    13: '🔥 Top 5 Servidores (Consumo CPU %)',
    18: '🧠 Top 5 Servidores (Consumo RAM %)',
    19: '💽 Top 5 Servidores (Uso de Disco %)',
    14: '⚡ Top 5 Datacenters (Carga UPS %)',
    20: '📶 Top 5 Sedes WAN (Mayor Latencia Ping ms)',
    21: '🚀 Top 5 Enlaces WAN / Internet (Ancho de Banda)',
    22: '📉 Top Sedes WAN (Pérdida de Paquetes ICMP %)',
    23: '🗄️ Top 5 Storage SAN HPE MSA (Carga IOPS)'
  };

  dash.panels.forEach(p => {
    if (titlesUpgrade[p.id]) {
      console.log(`Actualizando título [ID ${p.id}]: '${p.title}' -> '${titlesUpgrade[p.id]}'`);
      p.title = titlesUpgrade[p.id];
    }
  });

  // --- 3. MEJORAS DE VISUALIZACIÓN EN OTROS GRÁFICOS DE TIEMPO ---
  // Panel 27: Tráfico WAN
  const p27 = dash.panels.find(p => p.id === 27);
  if (p27 && p27.options?.legend) {
    p27.title = '📊 Tendencia Comparativa de Tráfico WAN por Sede / Proyecto (Mbps)';
    p27.options.legend.calcs = ['lastNotNull', 'max'];
    p27.fieldConfig.defaults.custom = {
      ...p27.fieldConfig.defaults?.custom,
      gradientMode: 'opacity',
      fillOpacity: 12,
      lineInterpolation: 'smooth'
    };
  }

  // Panel 29: Balanceo ISP
  const p29 = dash.panels.find(p => p.id === 29);
  if (p29 && p29.options?.legend) {
    p29.title = '🌐 Borde Central: Balanceo ISP (Telecom TASA vs Claro) — In/Out';
    p29.options.legend.calcs = ['lastNotNull', 'max'];
    p29.fieldConfig.defaults.custom = {
      ...p29.fieldConfig.defaults?.custom,
      gradientMode: 'opacity',
      fillOpacity: 12,
      lineInterpolation: 'smooth'
    };
  }

  console.log('\n2. Desplegando dashboard con diseño visual y textos optimizados...');
  const deployRes = await api('/api/dashboards/db', 'POST', {
    dashboard: dash,
    overwrite: true,
    message: "Upgrade visuals: clean table legends, friendly site names, Y-axis soft max, and executive KPI typography"
  });

  console.log('Resultado de despliegue:', deployRes.status, deployRes.data?.status, deployRes.data?.version);
  fs.writeFileSync('./dashboards/noc-zabbix-command-center.json', JSON.stringify(dash, null, 2));
}

main().catch(console.error);
