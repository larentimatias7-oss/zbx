import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

// 1. Obtener datasource actual
http.get('http://172.27.210.154:3005/api/datasources/uid/efz4nzx8r30g0c', {
  headers: { Authorization: 'Bearer ' + token }
}, res => {
  let b = '';
  res.on('data', d => b += d);
  res.on('end', () => {
    const ds = JSON.parse(b);
    
    // 2. Modificar jsonData
    ds.jsonData = {
      ...ds.jsonData,
      oauthPassThru: false,     // Elimina "No external session found for user"
      timeout: 90,              // Eleva timeout de 30s a 90s
      cacheTTL: "1m",           // Habilita cache de 1m para evitar saturar Zabbix
      trends: true,             // Habilita tendencias
      trendsFrom: "2d",         // A partir de 2 días usa tablas de tendencias en numéricos
      trendsRange: "4d"
    };

    const payload = JSON.stringify(ds);

    const updateReq = http.request('http://172.27.210.154:3005/api/datasources/uid/efz4nzx8r30g0c', {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, updateRes => {
      let updateBody = '';
      updateRes.on('data', c => updateBody += c);
      updateRes.on('end', () => {
        console.log('Update STATUS:', updateRes.statusCode);
        console.log('Update RESPONSE:', updateBody);
      });
    });

    updateReq.write(payload);
    updateReq.end();
  });
});
