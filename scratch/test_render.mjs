import http from 'http';
import { execSync } from 'child_process';
import fs from 'fs';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const req = http.get('http://172.27.210.154:3005/render/d-solo/test-triggers-panel/test-triggers-panel?panelId=1&width=1000&height=500', {
  headers: { Authorization: `Bearer ${token}` }
}, res => {
  console.log("Render status:", res.statusCode, res.headers['content-type']);
  if (res.statusCode === 200) {
    const file = fs.createWriteStream('scratch/test_panel.png');
    res.pipe(file);
    file.on('finish', () => console.log("Saved test_panel.png"));
  } else {
    let b = ''; res.on('data', c => b += c);
    res.on('end', () => console.log("Response body:", b.slice(0, 300)));
  }
});
req.on('error', console.error);
