import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

http.get('http://172.27.210.154:3005/api/plugins?type=panel', {
  headers: { 'Authorization': 'Bearer ' + token }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    const list = JSON.parse(b);
    console.log(`Found ${list.length} panel plugins:`);
    list.forEach(p => {
      if (p.id.includes('zabbix') || p.id.includes('trigger') || p.id.includes('problem')) {
        console.log(`-> MATCH: id="${p.id}", name="${p.name}", version="${p.info?.version}"`);
      }
    });
    console.log('\nAll IDs:');
    console.log(list.map(p => p.id).join(', '));
  });
});
