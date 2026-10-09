import http from 'http';

http.get({
  hostname: '172.27.210.154',
  port: 3005,
  path: '/public/plugins/alexanderzobnin-zabbix-datasource/module.js'
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    console.log('Module size:', b.length);
    // Find queryType handling or problem query handling
    const matches = b.match(/queryType\s*===\s*['"]?[0-9]['"]?|showProblems/g) || [];
    console.log('Matches:', matches.slice(0, 10));

    // Search for "Problems" field creation or table frame creation
    const frameMatch = b.match(/toDataFrame|createDataFrame|DataFrame|name:\s*['"]Problems['"]/g) || [];
    console.log('DataFrame matches:', frameMatch);

    const pIdx = b.indexOf('name:"Problems"');
    if (pIdx !== -1) {
      console.log('Context around name:"Problems":');
      console.log(b.slice(Math.max(0, pIdx - 400), pIdx + 400));
    }
  });
});
