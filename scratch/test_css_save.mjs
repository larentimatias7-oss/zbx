import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const htmlWithStyle = `
<style>
  footer, .footer, [aria-label*="footer"], .css-1q6p3o2-footer {
    display: none !important;
    visibility: hidden !important;
    height: 0 !important;
  }
</style>
<div id="test-text">Hello Style</div>
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
      type: 'text',
      gridPos: { x: 0, y: 0, w: 24, h: 3 },
      options: {
        mode: 'html',
        content: htmlWithStyle
      }
    }
  ]
};

const payload = JSON.stringify({ dashboard: testDash, overwrite: true });

const req = http.request('http://172.27.210.154:3005/api/dashboards/db', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Content-Length': Buffer.byteLength(payload)
  }
}, res => {
  let b = '';
  res.on('data', d => b += d);
  res.on('end', () => {
    console.log("Save status:", res.statusCode, b);
    // Fetch it back to see if <style> was stripped by API
    http.get('http://172.27.210.154:3005/api/dashboards/uid/test-css-hide-footer', {
      headers: { Authorization: `Bearer ${token}` }
    }, rres => {
      let rb = '';
      rres.on('data', c => rb += c);
      rres.on('end', () => {
        const djson = JSON.parse(rb);
        console.log("Saved content has style?", djson.dashboard?.panels?.[0]?.options?.content?.includes('<style>'));
      });
    });
  });
});

req.on('error', console.error);
req.write(payload);
req.end();
