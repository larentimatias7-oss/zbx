import http from 'http';

function testBasicAuth(user, pass) {
  const auth = Buffer.from(`${user}:${pass}`).toString('base64');
  return new Promise(resolve => {
    const req = http.request('http://172.27.210.154:3005/api/plugins/yesoreyeram-infinity-datasource/install', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({ user, pass, status: res.statusCode, body: b }));
    });
    req.on('error', err => resolve({ user, pass, status: 0, error: err.message }));
    req.end();
  });
}

async function run() {
  console.log('Testing admin:admin...');
  console.log(await testBasicAuth('admin', 'admin'));
}

run();
