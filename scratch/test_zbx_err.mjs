import http from 'http';

const plugins = [
  '/public/plugins/alexanderzobnin-zabbix-datasource/module.js',
  '/public/plugins/alexanderzobnin-zabbix-triggers-panel/module.js'
];
for (const p of plugins) {
  http.get({ hostname: '172.27.210.154', port: 3005, path: p }, res => {
    let b = '';
    res.on('data', c => b += c);
    res.on('end', () => {
      console.log('Checked', p, 'size:', b.length);
      const m = b.match(/.{0,80}unkonwn.{0,80}/gi);
      if (m) console.log('FOUND in', p, m);
    });
  });
}
