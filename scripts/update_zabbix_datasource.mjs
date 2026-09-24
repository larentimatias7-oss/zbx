import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function getDatasource() {
  return new Promise((resolve, reject) => {
    const req = http.request('http://172.27.210.154:3005/api/datasources/uid/efz4nzx8r30g0c', {
      headers: { 'Authorization': 'Bearer ' + token }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(b));
        } catch (e) {
          reject(new Error(`Failed to parse: ${b}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function updateDatasource(ds) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(ds);
    const req = http.request(`http://172.27.210.154:3005/api/datasources/uid/${ds.uid}`, {
      method: 'PUT',
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
          resolve(JSON.parse(b));
        } catch (e) {
          resolve(b);
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function testHealth() {
  return new Promise((resolve, reject) => {
    const req = http.request('http://172.27.210.154:3005/api/datasources/uid/efz4nzx8r30g0c/health', {
      headers: { 'Authorization': 'Bearer ' + token }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(b) });
        } catch (e) {
          resolve({ status: res.statusCode, body: b });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log("=== 1. OBTENIENDO CONFIGURACIÓN ACTUAL DEL DATASOURCE ===");
  const ds = await getDatasource();
  console.log("ID:", ds.id);
  console.log("UID:", ds.uid);
  console.log("Nombre:", ds.name);
  console.log("URL anterior:", ds.url);
  console.log("jsonData anterior:", ds.jsonData);

  console.log("\n=== 2. APLICANDO NUEVOS PARÁMETROS ===");
  ds.url = "https://zabbix.mlccnet.local:8443/api_jsonrpc.php";
  if (!ds.jsonData) ds.jsonData = {};
  ds.jsonData.tlsSkipVerify = true;

  console.log("Nueva URL:", ds.url);
  console.log("Nuevo jsonData:", ds.jsonData);

  const res = await updateDatasource(ds);
  console.log("Respuesta de actualización:", res);

  console.log("\n=== 3. PROBANDO SALUD / CONEXIÓN (HEALTH CHECK) ===");
  const health = await testHealth();
  console.log("Health Check:", health);
}

main().catch(console.error);
