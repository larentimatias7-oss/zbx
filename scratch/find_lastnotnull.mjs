import http from 'http';

http.get('http://172.27.210.154:3005/public/build/1481.35616baf69e7e44cf620.js', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    let idx = body.indexOf('lastNotNull');
    while (idx !== -1) {
      console.log('lastNotNull match:', body.slice(idx - 50, idx + 200));
      idx = body.indexOf('lastNotNull', idx + 1);
    }
  });
});
