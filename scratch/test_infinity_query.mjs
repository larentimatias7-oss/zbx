import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const payload = JSON.stringify({
  from: "now-1h",
  to: "now",
  queries: [
    {
      refId: "A",
      datasource: { type: "yesoreyeram-infinity-datasource", uid: "efz6f246whou8b" },
      type: "json",
      source: "inline",
      data: JSON.stringify([
        { site: "Central Rosario (SRO)", latitude: -32.95, longitude: -60.66, rtt: 1.2, status: 1 },
        { site: "Sede San Juan (SSJ)", latitude: -31.53, longitude: -68.53, rtt: 18.5, status: 1 },
        { site: "Mina Veladero", latitude: -29.35, longitude: -69.95, rtt: 45.2, status: 1 }
      ]),
      format: "table"
    }
  ]
});

const req = http.request('http://172.27.210.154:3005/api/ds/query', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    try {
      const p = JSON.parse(b);
      console.log('Status:', res.statusCode);
      const frames = p.results.A.frames;
      console.log('Frames count:', frames.length);
      console.log('Fields:', frames[0].schema.fields.map(f => f.name));
      console.log('Rows count:', frames[0].data.values[0].length);
    } catch (e) {
      console.error(e, b);
    }
  });
});
req.write(payload);
req.end();
