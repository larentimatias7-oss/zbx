import http from 'http';

http.get('http://172.27.210.154:3005/public/build/app.e91a84eaaa16c43f85f0.js', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    let idx = body.indexOf('groupingToMatrix');
    while (idx !== -1) {
      console.log('--- MATCH ---');
      console.log(body.slice(Math.max(0, idx - 100), Math.min(body.length, idx + 300)));
      idx = body.indexOf('groupingToMatrix', idx + 1);
    }
  });
});
