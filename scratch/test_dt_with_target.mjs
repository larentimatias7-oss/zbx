import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const grafanaUrl = 'http://172.27.210.154:3005';
const dsUid = 'efz4nzx8r30g0c';
const DS = { type: 'alexanderzobnin-zabbix-datasource', uid: dsUid };

const cssHideFooter = `
  footer,
  .footer,
  [aria-label="Grafana footer"],
  [aria-label*="footer"],
  div[class*="footer"],
  div[data-testid*="footer"],
  .css-1q6p3o2-footer {
    display: none !important;
    visibility: hidden !important;
    height: 0 !important;
    min-height: 0 !important;
    max-height: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    opacity: 0 !important;
    pointer-events: none !important;
    position: absolute !important;
    bottom: -9999px !important;
    z-index: -9999 !important;
  }
  .react-grid-layout {
    margin-bottom: 32px !important;
  }
`;

const bannerContent = `
<div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%); border-left: 6px solid #EA580C; padding: 10px 16px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; height: 100%; box-sizing: border-box;">
  <div>
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="background: #EA580C; color: white; padding: 2px 7px; border-radius: 4px; font-weight: 800; font-size: 11px; letter-spacing: 0.5px;">MILICIC S.A.</span>
      <h2 style="margin: 0; color: #FFFFFF; font-size: 18px; font-weight: 700;">NOC COMMAND CENTER &bull; Zabbix 7.0 LTS</h2>
    </div>
    <p style="margin: 3px 0 0 0; color: #94A3B8; font-size: 11px;">Monitoreo Global de Disponibilidad &bull; Matriz de Salud de Infraestructura &bull; Telemetr&iacute;a Cr&iacute;tica en Vivo</p>
  </div>
  <div style="display: flex; gap: 14px; font-size: 11px; color: #E2E8F0; align-items: center;">
    <span><b style="display: inline-block; width: 10px; height: 10px; background: #73BF69; border-radius: 2px; margin-right: 4px;"></b>ONLINE (UP)</span>
    <span><b style="display: inline-block; width: 10px; height: 10px; background: #E02F44; border-radius: 2px; margin-right: 4px;"></b>CA&Iacute;DO (DOWN)</span>
    <span><b style="display: inline-block; width: 10px; height: 10px; background: #6B7280; border-radius: 2px; margin-right: 4px;"></b>SIN DATOS</span>
  </div>
</div>
`;

const testDash = {
  id: null,
  uid: 'test-css-hide-footer',
  title: 'Test CSS Hide Footer',
  schemaVersion: 40,
  timezone: 'browser',
  panels: [
    {
      id: 1,
      title: '',
      type: 'marcusolsson-dynamictext-panel',
      gridPos: { x: 0, y: 0, w: 24, h: 3 },
      datasource: DS,
      targets: [
        {
          refId: 'A',
          schema: 12,
          queryType: '0',
          group: { filter: 'Zabbix servers' },
          host: { filter: 'Zabbix server' },
          item: { filter: 'Zabbix agent ping' },
          resultFormat: 'time_series'
        }
      ],
      options: {
        content: bannerContent,
        defaultContent: bannerContent,
        styles: cssHideFooter
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
