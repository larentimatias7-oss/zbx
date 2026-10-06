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

  // Panel 29: Tráfico de Borde ISP: Telecom TASA vs Claro (x: 0, y: 44, w: 12, h: 8)
  let pIsp = dash.panels.find(p => p._customTag === 'isp-traffic-panel');
  if (!pIsp) {
    pIsp = {
      id: ++maxId,
      _customTag: 'isp-traffic-panel',
      title: 'Borde Central: Balanceo ISP (Telecom TASA vs Claro) - In/Out',
      type: 'timeseries',
      gridPos: { h: 8, w: 12, x: 0, y: 44 },
      datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
      targets: [
        {
          refId: 'A',
          schema: 13,
          queryType: '0',
          group: { filter: 'FortiGate' },
          host: { filter: '/milicic_border1/' },
          item: { filter: '/Interface port1[45].*: Bits received/' },
          resultFormat: 'time_series',
          datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
          options: { showDisabledItems: false }
        },
        {
          refId: 'B',
          schema: 13,
          queryType: '0',
          group: { filter: 'FortiGate' },
          host: { filter: '/milicic_border1/' },
          item: { filter: '/Interface port1[45].*: Bits sent/' },
          resultFormat: 'time_series',
          datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
          options: { showDisabledItems: false }
        }
      ],
      transformations: [
        {
          id: 'renameByRegex',
          options: {
            regex: '^(?:FTG_)?(?:.*)?: Interface port1[45]\\((.*?)\\): Bits (received|sent).*',
            renamePattern: '$1 - $2'
          }
        }
      ],
      fieldConfig: {
        defaults: {
          custom: {
            drawStyle: 'line',
            lineInterpolation: 'smooth',
            lineWidth: 2,
            fillOpacity: 12,
            gradientMode: 'opacity',
            showPoints: 'never',
            spanNulls: true
          },
          unit: 'bps'
        },
        overrides: [
          {
            matcher: { id: 'byRegexp', options: '.*tasa.*' },
            properties: [{ id: 'color', value: { mode: 'fixed', fixedColor: '#5794F2' } }]
          },
          {
            matcher: { id: 'byRegexp', options: '.*claro.*' },
            properties: [{ id: 'color', value: { mode: 'fixed', fixedColor: '#FF9830' } }]
          }
        ]
      },
      options: {
        legend: {
          calcs: ['mean', 'max', 'lastNotNull'],
          displayMode: 'table',
          placement: 'bottom',
          showLegend: true
        },
        tooltip: { mode: 'multi', sort: 'desc' }
      }
    };
    dash.panels.push(pIsp);
  } else {
    pIsp.gridPos = { h: 8, w: 12, x: 0, y: 44 };
  }

  // Panel 30: Malla de Túneles IPsec Core (Rosario - San Juan - SAP) (x: 12, y: 44, w: 12, h: 8)
  let pTunnels = dash.panels.find(p => p._customTag === 'ipsec-tunnels-panel');
  if (!pTunnels) {
    pTunnels = {
      id: ++maxId,
      _customTag: 'ipsec-tunnels-panel',
      title: 'Malla de Túneles IPsec Core (Interconexión Rosario ➔ San Juan & SAP Cloud)',
      type: 'stat',
      gridPos: { h: 8, w: 12, x: 12, y: 44 },
      datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
      targets: [
        {
          refId: 'A',
          schema: 13,
          queryType: '0',
          group: { filter: 'FortiGate' },
          host: { filter: '/milicic_border1/' },
          item: { filter: '/VPN (sap-pri|ros1sj1|ros1sj2|ros2sj1|ros2sj2|sap-bkp).*: Tunnel Status/' },
          resultFormat: 'time_series',
          datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
          options: { showDisabledItems: false }
        }
      ],
      transformations: [
        {
          id: 'renameByRegex',
          options: {
            regex: '.*VPN (.*?):.*',
            renamePattern: '$1'
          }
        }
      ],
      fieldConfig: {
        defaults: {
          color: { mode: 'thresholds' },
          mappings: [
            {
              type: 'value',
              options: {
                '2': { text: 'UP (Activo)', color: '#73BF69', index: 0 },
                '1': { text: 'STANDBY', color: '#5794F2', index: 1 },
                '0': { text: 'DOWN', color: '#E02F44', index: 2 }
              }
            }
          ],
          thresholds: {
            mode: 'absolute',
            steps: [
              { color: '#E02F44', value: 0 },
              { color: '#5794F2', value: 1 },
              { color: '#73BF69', value: 2 }
            ]
          },
          unit: 'none'
        }
      },
      options: {
        colorMode: 'background',
        graphMode: 'none',
        justifyMode: 'center',
        orientation: 'horizontal',
        reduceOptions: { calcs: ['lastNotNull'], fields: '', values: false },
        textMode: 'value_and_name'
      }
    };
    dash.panels.push(pTunnels);
  } else {
    pTunnels.gridPos = { h: 8, w: 12, x: 12, y: 44 };
  }

  // Shift Wan Trend down to y: 52 (h: 8)
  const pWanTrend = dash.panels.find(p => p._customTag === 'wan-trend-timeseries');
  if (pWanTrend) {
    pWanTrend.gridPos = { h: 8, w: 24, x: 0, y: 52 };
  }

  // Shift Panel 12 (Triggers Feed) down to y: 60 (h: 10)
  const p12 = dash.panels.find(p => p.id === 12);
  if (p12) {
    p12.gridPos = { h: 10, w: 24, x: 0, y: 60 };
  }

  // Deploy to Grafana
  console.log(`Sending updated dashboard (version ${dash.version + 1}) to Grafana...`);
  const updateRes = await api('/api/dashboards/db', 'POST', {
    dashboard: dash,
    overwrite: true,
    message: 'NOC Command Center: Integración de telemetría especializada Fortinet (ISP Claro/Tasa y Túneles IPsec)'
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
