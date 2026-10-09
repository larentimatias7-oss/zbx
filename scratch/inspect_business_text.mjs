import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  try {
    token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
  } catch (e) {}
}

const req = http.request({
  hostname: '172.27.210.154',
  port: 3005,
  path: '/public/plugins/marcusolsson-dynamictext-panel/module.js',
  headers: { 'Authorization': 'Bearer ' + token }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    console.log('module.js length:', b.length);
    // Search for afterRender or externalJavascript or helpers or render
    const keywords = ['afterRender', 'externalJavascript', 'helpers', 'beforeRender', 'code', 'content', 'defaultContent'];
    for (const kw of keywords) {
      const idx = b.indexOf(kw);
      console.log(kw, 'found at:', idx);
    }
  });
});
req.end();
