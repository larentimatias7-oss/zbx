import http from 'http';

function fetchFile(path) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: '172.27.210.154', port: 3005, path }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(b));
    }).on('error', reject);
  });
}

import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  try {
    token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
  } catch (e) {}
}

function fetchWithAuth(path) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: '172.27.210.154', port: 3005, path, headers: { 'Authorization': 'Bearer ' + token } }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(b));
    }).on('error', reject);
  });
}

async function main() {
  const html = await fetchWithAuth('/d/zabbix-matrixmax-overview/5492aab');
  const scripts = [...html.matchAll(/src="([^"]+\.js)"/g)].map(m => '/' + m[1]);
  console.log('Dashboard scripts count:', scripts.length);
  for (const s of scripts) {
    const content = await fetchWithAuth(s);
    if (content.includes('unkonwn extractor') || content.includes('unknown extractor')) {
      console.log('FOUND ERROR STRING in', s);
      const idx = content.indexOf('extractor');
      console.log(content.slice(Math.max(0, idx - 200), idx + 200));
    }
  }
}

main().catch(console.error);
