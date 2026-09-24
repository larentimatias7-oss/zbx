import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken || grafanaToken.length < 10) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const req = http.request({
  hostname: '172.27.210.154',
  port: 3005,
  path: '/api/dashboards/uid/milicic-canvas-campus-sro',
  headers: { 'Authorization': 'Bearer ' + grafanaToken }
}, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    try {
      const d = JSON.parse(data);
      const canvasPanel = d.dashboard.panels.find(p => p.type === 'canvas');
      console.log('Panel title:', canvasPanel.title);
      console.log('Panel type:', canvasPanel.type);
      console.log('Keys of options:', Object.keys(canvasPanel.options || {}));
      console.log('Options root:', JSON.stringify(canvasPanel.options.root, null, 2));
    } catch (e) {
      console.error(e, data);
    }
  });
});
req.end();
