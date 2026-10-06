import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

function api(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
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

function createBarGaugePanel({
  id,
  title,
  x,
  y,
  w = 6,
  h = 7,
  target,
  regex,
  renamePattern,
  unit = 'percent',
  min = 0,
  max,
  decimals,
  thresholds
}) {
  return {
    id,
    title,
    type: 'bargauge',
    gridPos: { h, w, x, y },
    datasource: {
      type: 'alexanderzobnin-zabbix-datasource',
      uid: 'efz4nzx8r30g0c'
    },
    targets: [
      {
        refId: 'A',
        schema: 13,
        queryType: '0',
        group: { filter: target.group },
        host: { filter: target.host || '/${sede:raw}/' },
        item: { filter: target.item },
        resultFormat: 'time_series',
        datasource: {
          type: 'alexanderzobnin-zabbix-datasource',
          uid: 'efz4nzx8r30g0c'
        },
        options: {
          count: false,
          disableDataAlignment: false,
          showDisabledItems: false,
          skipEmptyValues: false,
          useTrends: 'default',
          useZabbixValueMapping: false
        },
        table: { skipEmptyValues: false },
        application: { filter: '' },
        itemTag: { filter: '' },
        tags: { filter: '' },
        macro: { filter: '' },
        proxy: { filter: '' },
        trigger: { filter: '' },
        functions: [],
        evaltype: '0',
        textFilter: '',
        countTriggersBy: ''
      }
    ],
    transformations: [
      {
        id: 'renameByRegex',
        options: {
          regex: regex,
          renamePattern: renamePattern
        }
      },
      {
        id: 'reduce',
        options: {
          includeTimeField: false,
          mode: 'seriesToRows',
          reducers: ['lastNotNull']
        }
      },
      {
        id: 'organize',
        options: {
          excludeByName: {},
          indexByName: {},
          renameByName: {
            Field: 'Name',
            'Last *NotNull': 'Value'
          }
        }
      },
      {
        id: 'sortBy',
        options: {
          fields: {},
          sort: [{ desc: true, field: 'Value' }]
        }
      },
      {
        id: 'limit',
        options: {
          limitField: 5
        }
      }
    ],
    fieldConfig: {
      defaults: {
        color: { mode: 'thresholds' },
        ...(min !== undefined ? { min } : {}),
        ...(max !== undefined ? { max } : {}),
        ...(decimals !== undefined ? { decimals } : {}),
        thresholds: {
          mode: 'absolute',
          steps: thresholds
        },
        unit: unit
      },
      overrides: []
    },
    options: {
      displayMode: 'gradient',
      minVizHeight: 10,
      minVizWidth: 0,
      namePlacement: 'auto',
      orientation: 'horizontal',
      reduceOptions: {
        calcs: ['lastNotNull'],
        fields: '',
        values: false
      },
      showUnfilled: true,
      sizing: 'auto',
      valueMode: 'color'
    }
  };
}

async function run() {
  console.log('Fetching live dashboard from Grafana...');
  const res = await api('/api/dashboards/uid/noc-zabbix-command-center');
  if (res.status !== 200) {
    console.error('Error fetching dashboard:', res);
    return;
  }

  const dash = res.data.dashboard;
  console.log(`Current version: ${dash.version}, Panels count: ${dash.panels.length}`);

  // Save backup
  fs.writeFileSync('./scratch/dash_backup_before_kpis.json', JSON.stringify(dash, null, 2));

  // Find max ID currently used
  let maxId = 0;
  dash.panels.forEach(p => {
    if (p.id > maxId) maxId = p.id;
  });

  // Let's adjust existing panels:
  // 1. Panel 15 (Tráfico de Sesiones Activas) currently at y: 12, h: 14. Adjust h to 9 so it finishes at y: 21 flush with Panel 17 & Panel 8.
  const p15 = dash.panels.find(p => p.id === 15);
  if (p15) {
    p15.gridPos = { h: 9, w: 8, x: 16, y: 12 };
  }

  // 2. Panel 13 (CPU): set w: 6, x: 0, y: 21, h: 7
  const p13 = dash.panels.find(p => p.id === 13);
  if (p13) {
    p13.gridPos = { h: 7, w: 6, x: 0, y: 21 };
  }

  // 3. Panel 18 (RAM): set w: 6, x: 6, y: 21, h: 7
  const p18 = dash.panels.find(p => p.id === 18);
  if (p18) {
    p18.gridPos = { h: 7, w: 6, x: 6, y: 21 };
  }

  // 4. Panel 19 (Discos): fix title, query, regex, gridPos (x: 12, w: 6, y: 21, h: 7)
  const p19 = dash.panels.find(p => p.id === 19);
  if (p19) {
    p19.title = 'Top 5 Servidores (Uso de Disco %)';
    p19.gridPos = { h: 7, w: 6, x: 12, y: 21 };
    p19.targets[0].item = { filter: '/FS \\[.*]: Space: Used, in %/' };
    p19.transformations[0] = {
      id: 'renameByRegex',
      options: {
        regex: '^(.*?):\\s*FS\\s*\\[(.*?)\\]:.*',
        renamePattern: '$1 [$2]'
      }
    };
    p19.fieldConfig.defaults.thresholds = {
      mode: 'absolute',
      steps: [
        { color: '#73BF69', value: 0 },
        { color: '#FADE2A', value: 80 },
        { color: '#E02F44', value: 90 }
      ]
    };
  }

  // 5. Panel 14 (UPS Load): move to Fila 1 (x: 18, w: 6, y: 21, h: 7)
  const p14 = dash.panels.find(p => p.id === 14);
  if (p14) {
    p14.title = 'Top 5 Datacenters (Carga Eléctrica UPS %)';
    p14.gridPos = { h: 7, w: 6, x: 18, y: 21 };
    p14.fieldConfig.defaults.thresholds = {
      mode: 'absolute',
      steps: [
        { color: '#73BF69', value: 0 },
        { color: '#FADE2A', value: 60 },
        { color: '#E02F44', value: 80 }
      ]
    };
  }

  // Remove any old versions of new panels if re-running
  dash.panels = dash.panels.filter(p => !['wan-latency', 'wan-bandwidth', 'wan-loss', 'storage-iops'].includes(p._customTag));

  // 6. Panel 20: Top 5 Sedes WAN (Mayor Latencia Ping ms)
  const p20 = createBarGaugePanel({
    id: ++maxId,
    title: 'Top 5 Sedes WAN (Mayor Latencia Ping ms)',
    x: 0,
    y: 28,
    w: 6,
    h: 7,
    target: {
      group: '/(FortiGate|ANTENAS P2P)/',
      host: '/${sede:raw}/',
      item: 'ICMP response time'
    },
    regex: '^(?:FTG_|)(.*?)(?:_SNMP|):.*',
    renamePattern: '$1',
    unit: 's',
    decimals: 1,
    thresholds: [
      { color: '#73BF69', value: 0 },
      { color: '#FADE2A', value: 0.05 },
      { color: '#E02F44', value: 0.10 }
    ]
  });
  p20._customTag = 'wan-latency';

  // 7. Panel 21: Top 5 Enlaces WAN / Internet (Ancho de Banda)
  const p21 = createBarGaugePanel({
    id: ++maxId,
    title: 'Top 5 Enlaces WAN / Internet (Ancho de Banda)',
    x: 6,
    y: 28,
    w: 6,
    h: 7,
    target: {
      group: 'FortiGate',
      host: '/${sede:raw}/',
      item: '/Interface (port14|port15|wan|internet|claro|tasa|rosario|telecom).*: Bits received/'
    },
    regex: '^(?:FTG_)?(.*?)(?:_SNMP)?: Interface (.*?):.*',
    renamePattern: '$1 ($2)',
    unit: 'bps',
    thresholds: [
      { color: '#73BF69', value: 0 },
      { color: '#FADE2A', value: 50000000 },
      { color: '#E02F44', value: 100000000 }
    ]
  });
  p21._customTag = 'wan-bandwidth';

  // 8. Panel 22: Top Sedes WAN (Pérdida de Paquetes ICMP %)
  const p22 = createBarGaugePanel({
    id: ++maxId,
    title: 'Top Sedes WAN (Pérdida de Paquetes ICMP %)',
    x: 12,
    y: 28,
    w: 6,
    h: 7,
    target: {
      group: '/(FortiGate|ANTENAS P2P)/',
      host: '/${sede:raw}/',
      item: 'ICMP loss'
    },
    regex: '^(?:FTG_|)(.*?)(?:_SNMP|):.*',
    renamePattern: '$1',
    unit: 'percent',
    min: 0,
    max: 100,
    thresholds: [
      { color: '#73BF69', value: 0 },
      { color: '#FADE2A', value: 1 },
      { color: '#E02F44', value: 5 }
    ]
  });
  p22._customTag = 'wan-loss';

  // 9. Panel 23: Top 5 Storage SAN HPE MSA (Carga IOPS)
  const p23 = createBarGaugePanel({
    id: ++maxId,
    title: 'Top 5 Storage SAN HPE MSA (Carga IOPS)',
    x: 18,
    y: 28,
    w: 6,
    h: 7,
    target: {
      group: '/(Storage_Server|Storage)/',
      host: '/${sede:raw}/',
      item: '/Disk group .*: IOPS, total rate/'
    },
    regex: '^(.*?): Disk group \\[(.*?)\\].*',
    renamePattern: '$1 [$2]',
    unit: 'iops',
    thresholds: [
      { color: '#73BF69', value: 0 },
      { color: '#FADE2A', value: 100 },
      { color: '#E02F44', value: 300 }
    ]
  });
  p23._customTag = 'storage-iops';

  // Add new panels to dashboard
  dash.panels.push(p20, p21, p22, p23);

  // 10. Panel 12 (Triggers / Active Incidents): Ensure it starts at y: 35, w: 24, h: 10
  const p12 = dash.panels.find(p => p.id === 12);
  if (p12) {
    p12.gridPos = { h: 10, w: 24, x: 0, y: 35 };
  }

  // Update dashboard in Grafana
  console.log(`Sending updated dashboard (version ${dash.version + 1}) to Grafana...`);
  const updateRes = await api('/api/dashboards/db', 'POST', {
    dashboard: dash,
    overwrite: true,
    message: 'NOC Command Center: Integración de Fila 1 y Fila 2 de Top 5 KPIs de Infraestructura'
  });

  console.log('Update result:', updateRes);
  if (updateRes.status === 200) {
    console.log('Successfully deployed! URL:', updateRes.data.url);
  }
}

run().catch(console.error);
