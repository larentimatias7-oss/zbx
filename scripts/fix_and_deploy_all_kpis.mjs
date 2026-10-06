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

function topFunc(n = 5, agg = 'last') {
  return [
    {
      def: {
        name: 'top',
        category: 'Filter',
        params: [
          { name: 'number', type: 'int' },
          { name: 'value', type: 'string' }
        ]
      },
      params: [n, agg]
    }
  ];
}

function configureKpiPanel({
  panel,
  title,
  group,
  host = '/${sede:raw}/',
  item,
  topAgg = 'last',
  topCount = 5,
  regex,
  renamePattern,
  unit = 'percent',
  min = 0,
  max,
  decimals,
  thresholds
}) {
  panel.title = title;
  panel.type = 'bargauge';
  panel.datasource = {
    type: 'alexanderzobnin-zabbix-datasource',
    uid: 'efz4nzx8r30g0c'
  };

  // Configure target with native top() function
  panel.targets = [
    {
      refId: 'A',
      schema: 13,
      queryType: '0',
      group: { filter: group },
      host: { filter: host },
      item: { filter: item },
      functions: topFunc(topCount, topAgg),
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
      evaltype: '0',
      textFilter: '',
      countTriggersBy: ''
    }
  ];

  // Only renameByRegex needed, sorting is done natively by Zabbix datasource
  panel.transformations = [
    {
      id: 'renameByRegex',
      options: {
        regex: regex,
        renamePattern: renamePattern
      }
    }
  ];

  panel.fieldConfig = {
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
  };

  panel.options = {
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
  };
}

async function run() {
  console.log('Fetching live dashboard...');
  const res = await api('/api/dashboards/uid/noc-zabbix-command-center');
  if (res.status !== 200) {
    console.error('Failed to fetch dashboard:', res);
    return;
  }

  const dash = res.data.dashboard;
  console.log(`Current version: ${dash.version}, Panels: ${dash.panels.length}`);

  // 1. Panel 13: CPU
  const p13 = dash.panels.find(p => p.id === 13);
  if (p13) {
    configureKpiPanel({
      panel: p13,
      title: 'Top 5 Servidores (Consumo CPU %)',
      group: '/(Windows_Server|Linux servers|Virtual machines|Hypervisors|Storage_Server|Backup_Server|Zabbix servers|AD)/',
      item: '/^CPU utilization$/',
      topAgg: 'avg',
      regex: '(.*):.*',
      renamePattern: '$1',
      unit: 'percent',
      min: 0,
      max: 100,
      thresholds: [
        { color: '#73BF69', value: 0 },
        { color: '#FADE2A', value: 75 },
        { color: '#E02F44', value: 90 }
      ]
    });
  }

  // 2. Panel 18: RAM
  const p18 = dash.panels.find(p => p.id === 18);
  if (p18) {
    configureKpiPanel({
      panel: p18,
      title: 'Top 5 Servidores (Consumo RAM %)',
      group: '/(Windows_Server|Linux servers|Virtual machines|Hypervisors|Storage_Server|Backup_Server|Zabbix servers|AD)/',
      item: 'Memory utilization',
      topAgg: 'last',
      regex: '(.*):.*',
      renamePattern: '$1',
      unit: 'percent',
      min: 0,
      max: 100,
      thresholds: [
        { color: '#73BF69', value: 0 },
        { color: '#FADE2A', value: 75 },
        { color: '#E02F44', value: 90 }
      ]
    });
  }

  // 3. Panel 19: Discos (Filtrando mounts de Docker y apuntando a discos reales)
  const p19 = dash.panels.find(p => p.id === 19);
  if (p19) {
    configureKpiPanel({
      panel: p19,
      title: 'Top 5 Servidores (Uso de Disco %)',
      group: '/(Windows_Server|Linux servers|AD|Backup_Server|Storage_Server|Virtual machines)/',
      item: '/FS \\[.*(:\\)|\\/$)\\].*Space: Used, in %/',
      topAgg: 'last',
      regex: '^(.*?):\\s*FS\\s*\\[(.*?)\\]:.*',
      renamePattern: '$1 [$2]',
      unit: 'percent',
      min: 0,
      max: 100,
      thresholds: [
        { color: '#73BF69', value: 0 },
        { color: '#FADE2A', value: 80 },
        { color: '#E02F44', value: 90 }
      ]
    });
  }

  // 4. Panel 14: UPS Load
  const p14 = dash.panels.find(p => p.id === 14);
  if (p14) {
    configureKpiPanel({
      panel: p14,
      title: 'Top 5 Datacenters (Carga Eléctrica UPS %)',
      group: 'UPS',
      host: '/.*/',
      item: '/^(UPS Load \\(%\\)|Output Load Estimated)$/',
      topAgg: 'last',
      regex: '(.*):.*',
      renamePattern: '$1',
      unit: 'percent',
      min: 0,
      max: 100,
      thresholds: [
        { color: '#73BF69', value: 0 },
        { color: '#FADE2A', value: 60 },
        { color: '#E02F44', value: 80 }
      ]
    });
  }

  // 5. Panel 20: Latencia WAN
  const p20 = dash.panels.find(p => p.id === 20 || p._customTag === 'wan-latency');
  if (p20) {
    configureKpiPanel({
      panel: p20,
      title: 'Top 5 Sedes WAN (Mayor Latencia Ping ms)',
      group: '/(FortiGate|ANTENAS P2P)/',
      item: 'ICMP response time',
      topAgg: 'last',
      regex: '^(?:FTG_|)(.*?)(?:_SNMP|):.*',
      renamePattern: '$1',
      unit: 's',
      decimals: 1,
      min: 0,
      thresholds: [
        { color: '#73BF69', value: 0 },
        { color: '#FADE2A', value: 0.05 },
        { color: '#E02F44', value: 0.10 }
      ]
    });
  }

  // 6. Panel 21: Ancho de banda WAN
  const p21 = dash.panels.find(p => p.id === 21 || p._customTag === 'wan-bandwidth');
  if (p21) {
    configureKpiPanel({
      panel: p21,
      title: 'Top 5 Enlaces WAN / Internet (Ancho de Banda)',
      group: 'FortiGate',
      item: '/Interface (port14|port15|wan|internet|claro|tasa|rosario|telecom).*: Bits received/',
      topAgg: 'last',
      regex: '^(?:FTG_)?(.*?)(?:_SNMP)?: Interface (.*?):.*',
      renamePattern: '$1 ($2)',
      unit: 'bps',
      min: 0,
      thresholds: [
        { color: '#73BF69', value: 0 },
        { color: '#FADE2A', value: 50000000 },
        { color: '#E02F44', value: 100000000 }
      ]
    });
  }

  // 7. Panel 22: Pérdida de paquetes WAN
  const p22 = dash.panels.find(p => p.id === 22 || p._customTag === 'wan-loss');
  if (p22) {
    configureKpiPanel({
      panel: p22,
      title: 'Top Sedes WAN (Pérdida de Paquetes ICMP %)',
      group: '/(FortiGate|ANTENAS P2P)/',
      item: 'ICMP loss',
      topAgg: 'last',
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
  }

  // 8. Panel 23: IOPS SAN
  const p23 = dash.panels.find(p => p.id === 23 || p._customTag === 'storage-iops');
  if (p23) {
    configureKpiPanel({
      panel: p23,
      title: 'Top 5 Storage SAN HPE MSA (Carga IOPS)',
      group: '/(Storage_Server|Storage)/',
      item: '/Disk group .*: IOPS, total rate/',
      topAgg: 'last',
      regex: '^(.*?): Disk group \\[(.*?)\\].*',
      renamePattern: '$1 [$2]',
      unit: 'iops',
      min: 0,
      thresholds: [
        { color: '#73BF69', value: 0 },
        { color: '#FADE2A', value: 100 },
        { color: '#E02F44', value: 300 }
      ]
    });
  }

  // Deploy to Grafana
  console.log('Sending updated dashboard to Grafana...');
  const updateRes = await api('/api/dashboards/db', 'POST', {
    dashboard: dash,
    overwrite: true,
    message: 'NOC Command Center: Optimización de filtrado Top 5 nativo Zabbix y renderizado de barras'
  });

  if (updateRes.status === 200) {
    console.log('Successfully deployed! Version:', updateRes.data.version);
    fs.writeFileSync('./dashboards/noc-zabbix-command-center.json', JSON.stringify(dash, null, 2));
    console.log('Updated dashboards/noc-zabbix-command-center.json');
  } else {
    console.error('Deployment error:', updateRes);
  }
}

run().catch(console.error);
