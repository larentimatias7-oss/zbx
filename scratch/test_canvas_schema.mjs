import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken || grafanaToken.length < 10) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const testDash = {
  dashboard: {
    id: null,
    uid: "test-canvas-schema",
    title: "Test Canvas Schema",
    tags: ["test"],
    timezone: "browser",
    schemaVersion: 40,
    panels: [
      {
        id: 1,
        title: "Canvas Test Panel",
        type: "canvas",
        gridPos: { x: 0, y: 0, w: 24, h: 20 },
        options: {
          inlineEditing: true,
          panZoom: true,
          root: {
            elements: [
              {
                id: "rect1",
                name: "Edificio Gris",
                type: "shape",
                config: {
                  shape: "rectangle"
                },
                placement: {
                  top: 50,
                  left: 50,
                  width: 300,
                  height: 200
                },
                background: {
                  color: { fixed: "rgba(15, 23, 42, 0.85)" }
                },
                border: {
                  color: { fixed: "#0284C7" },
                  width: 2
                }
              },
              {
                id: "text1",
                name: "Title Text",
                type: "text",
                config: {
                  text: "DATACENTER CORE (Edificio Gris)"
                },
                placement: {
                  top: 70,
                  left: 70,
                  width: 260,
                  height: 30
                }
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
