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

async function run() {
  console.log('Fetching live dashboard from Grafana...');
  const res = await api('/api/dashboards/uid/noc-zabbix-command-center');
  if (res.status !== 200) {
    console.error('Failed to fetch dashboard:', res);
    return;
  }

  const dash = res.data.dashboard;
  console.log(`Current version: ${dash.version}, Panels: ${dash.panels.length}`);

  let maxId = 0;
  dash.panels.forEach(p => {
    if (p.id > maxId) maxId = p.id;
  });

  // 1. Split Panel 17 into Voltage (h: 5) and Battery Autonomy (h: 4)
  const p17 = dash.panels.find(p => p.id === 17);
  if (p17) {
    p17.gridPos = { h: 5, w: 3, x: 13, y: 12 };
  }

  let pBattery = dash.panels.find(p => p._customTag === 'ups-battery-autonomy');
  if (!pBattery) {
    pBattery = {
      id: ++maxId,
      _customTag: 'ups-battery-autonomy',
      title: 'Autonomía Baterías UPS (Min)',
      type: 'stat',
      gridPos: { h: 4, w: 3, x: 13, y: 17 },
      datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
      targets: [
        {
          refId: 'A',
          schema: 13,
          queryType: '0',
          group: { filter: 'UPS' },
          host: { filter: '/.*/' },
          item: { filter: 'Battery Time Remaining' },
          resultFormat: 'time_series',
          datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
          options: { showDisabledItems: false }
        }
      ],
      transformations: [
        {
          id: 'renameByRegex',
          options: { regex: '(.*):.*', renamePattern: '$1' }
        }
      ],
      fieldConfig: {
        defaults: {
          color: { mode: 'thresholds' },
          thresholds: {
            mode: 'absolute',
            steps: [
              { color: '#E02F44', value: 0 },
              { color: '#FADE2A', value: 30 },
              { color: '#73BF69', value: 60 }
            ]
          },
          unit: 'm'
        }
      },
      options: {
        colorMode: 'background',
        graphMode: 'none',
        justifyMode: 'center',
        orientation: 'vertical',
        reduceOptions: { calcs: ['lastNotNull'], fields: '', values: false },
        textMode: 'value_and_name'
      }
    };
    dash.panels.push(pBattery);
  } else {
    pBattery.gridPos = { h: 4, w: 3, x: 13, y: 17 };
  }

  // Deploy to Grafana
  console.log(`Sending updated dashboard (version ${dash.version + 1}) to Grafana...`);
  const updateRes = await api('/api/dashboards/db', 'POST', {
    dashboard: dash,
    overwrite: true,
    message: 'NOC Command Center: Integración de indicador de autonomía de baterías en datacenters'
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
