import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken || grafanaToken.length < 10) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function createPlaylist() {
  // 1. Check existing playlists
  const existing = await new Promise(resolve => {
    http.get({
      hostname: '172.27.210.154',
      port: 3005,
      path: '/api/playlists',
      headers: { 'Authorization': 'Bearer ' + grafanaToken }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch(e) { resolve([]); }
      });
    });
  });

  console.log('Existing playlists:', existing);

  // If already exists with name "Milicic NOC 24/7 Rotativo", delete it first to update
  if (Array.isArray(existing)) {
    for (const pl of existing) {
      if (pl.name === "Milicic NOC 24/7 Rotativo" || pl.uid === "milicic-noc-playlist") {
        console.log(`Deleting existing playlist ${pl.uid || pl.id}...`);
        await new Promise(resolve => {
          const req = http.request({
            hostname: '172.27.210.154',
            port: 3005,
            path: `/api/playlists/${pl.uid || pl.id}`,
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + grafanaToken }
          }, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => resolve(d));
          });
          req.end();
        });
      }
    }
  }

  // 2. Create Playlist
  const payload = JSON.stringify({
    name: "Milicic NOC 24/7 Rotativo",
    interval: "45s",
    items: [
      { type: "dashboard_by_uid", value: "milicic-noc-wallboard", title: "NOC Command Wallboard" },
      { type: "dashboard_by_uid", value: "milicic-canvas-campus-sro", title: "Weathermap Campus Central SRO" },
      { type: "dashboard_by_uid", value: "milicic-noc-latency-matrix", title: "Matriz de Latencia SD-WAN" },
      { type: "dashboard_by_uid", value: "milicic-geomap-wan-sdwan", title: "Mapa Satelital de Sedes & Minería" },
      { type: "dashboard_by_uid", value: "milicic-network-topology", title: "Topología Global e Incidentes" },
      { type: "dashboard_by_uid", value: "milicic-noc-sre-cockpit", title: "SRE Golden Signals Cockpit" }
    ]
  });

  const createRes = await new Promise(resolve => {
    const req = http.request({
      hostname: '172.27.210.154',
      port: 3005,
      path: '/api/playlists',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + grafanaToken,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch(e) { resolve(d); }
      });
    });
    req.write(payload);
    req.end();
  });

  console.log('\nPlaylist Create Result:', createRes);
}

createPlaylist();
