import http from 'http';
const token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
const req = http.request('http://172.27.210.154:3005/api/plugins', {
  headers: { "Authorization": `Bearer ${token}` }
}, res => {
  let b = "";
  res.on("data", d => b+=d);
  res.on("end", () => console.log(JSON.parse(b).filter(p => p.id.includes('polystat') || p.id.includes('stat')).map(p => p.id)));
});
req.end();
