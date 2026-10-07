import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const grafanaUrl = 'http://172.27.210.154:3005';
const dsUid = 'efz4nzx8r30g0c';
const DS = { type: 'alexanderzobnin-zabbix-datasource', uid: dsUid };

const testDash = {
  id: null,
  uid: 'test-kerberos-card',
  title: 'Test Kerberos Dynamic Card',
  schemaVersion: 40,
  timezone: 'browser',
  panels: [
    {
      id: 1,
      title: '🏛️ Diagnóstico Forense de Identidades & Alertas Activas',
      type: 'marcusolsson-dynamictext-panel',
      gridPos: { x: 0, y: 0, w: 24, h: 6 },
      datasource: DS,
      targets: [
        {
          refId: 'RATE',
          schema: 12,
          queryType: '0',
          group: { filter: 'AD' },
          host: { filter: 'SRO-DCO01' },
          item: { filter: 'Tasa Fallos Preauth Kerberos (1h)' },
          resultFormat: 'time_series'
        },
        {
          refId: 'USER',
          schema: 12,
          queryType: '2',
          group: { filter: 'AD' },
          host: { filter: 'SRO-DCO01' },
          item: { filter: 'Usuario Fallo Preauth Kerberos' },
          resultFormat: 'time_series'
        },
        {
          refId: 'IP',
          schema: 12,
          queryType: '2',
          group: { filter: 'AD' },
          host: { filter: 'SRO-DCO01' },
          item: { filter: 'IP Origen Fallo Preauth Kerberos' },
          resultFormat: 'time_series'
        },
        {
          refId: 'CODE',
          schema: 12,
          queryType: '2',
          group: { filter: 'AD' },
          host: { filter: 'SRO-DCO01' },
          item: { filter: 'Código Fallo Preauth Kerberos' },
          resultFormat: 'time_series'
        }
      ],
      transformations: [
        {
          id: 'joinByField',
          options: {
            byField: 'Time',
            mode: 'outer'
          }
        },
        {
          id: 'organize',
          options: {
            renameByName: {
              'Value #RATE': 'rate',
              'Value #USER': 'user',
              'Value #IP': 'ip',
              'Value #CODE': 'code'
            }
          }
        }
      ],
      options: {
        content: `
<div>
  <h3>Debug Raw Fields:</h3>
  <pre>{{json this}}</pre>
</div>
`,
        defaultContent: `<div>No data received</div>`
      }
    }
  ]
};

const payload = JSON.stringify({ dashboard: testDash, overwrite: true });

const req = http.request(`${grafanaUrl}/api/dashboards/db`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Content-Length': Buffer.byteLength(payload)
  }
}, res => {
  let b = '';
  res.on('data', d => b += d);
  res.on('end', () => console.log("Test deploy status:", res.statusCode, b));
});

req.on('error', console.error);
req.write(payload);
req.end();
