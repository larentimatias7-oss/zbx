import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

http.get('http://172.27.210.154:3005/api/datasources/uid/efz4nzx8r30g0c', {
  headers: { Authorization: 'Bearer ' + token }
}, res => {
  let b = '';
  res.on('data', d => b += d);
  res.on('end', () => {
    try {
      const ds = JSON.parse(b);
      console.log('Datasource Config:');
      console.log(' - Name:', ds.name);
      console.log(' - URL:', ds.url);
      console.log(' - JsonData:', JSON.stringify(ds.jsonData, null, 2));
      console.log(' - BasicAuth:', ds.basicAuth);
      console.log(' - WithCredentials:', ds.withCredentials);
      console.log(' - oauthPassThru:', ds.jsonData?.oauthPassThru);
    } catch(e) { console.error(b); }
  });
});
