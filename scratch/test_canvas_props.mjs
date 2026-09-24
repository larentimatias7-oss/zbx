import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken || grafanaToken.length < 10) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const testDash = {
  dashboard: {
    id: null,
    uid: "test-canvas-props",
    title: "Test Canvas Props",
    panels: [
      {
        id: 1,
        title: "Canvas Props",
        type: "canvas",
        gridPos: { x: 0, y: 0, w: 24, h: 20 },
        options: {
          inlineEditing: true,
          panZoom: true,
          root: {
            elements: [
              {
                id: "rect1",
                name: "Zone Core",
                type: "shape",
                config: { shape: "rectangle" },
                placement: { top: 30, left: 30, width: 440, height: 350 },
                background: { color: { fixed: "rgba(15, 23, 42, 0.85)" } },
                border: { color: { fixed: "#0284C7" }, width: 2 }
              },
              {
                id: "text1",
                name: "Title Core",
                type: "text",
                config: {
                  text: "🏢 DATACENTER CORE & WAN (Ed. Gris PB)",
                  color: { fixed: "#38BDF8" },
                  size: 16
                },
                placement: { top: 45, left: 50, width: 380, height: 30 }
              },
              {
                id: "server1",
                name: "Server Core01",
                type: "server",
                placement: { top: 120, left: 60, width: 80, height: 80 }
              },
              {
                id: "icon1",
                name: "Firewall Icon",
                type: "icon",
                config: {
                  icon: "shield"
                },
                placement: { top: 120, left: 180, width: 80, height: 80 }
              }
            ]
          }
        }
      }
    ]
  },
  overwrite: true
};

const req = http.request({
  hostname: '172.27.210.154',
  port: 3005,
  path: '/api/dashboards/db',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + grafanaToken,
    'Content-Type': 'application/json'
  }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Result:', d);
  });
});
req.write(JSON.stringify(testDash));
req.end();
