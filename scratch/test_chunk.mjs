import http from 'http';

const files = [
  '/public/build/6029.ced17922ce65e4fd1ef9.js',
  '/public/build/7014.2534c52dab111e9c5e2a.js'
];
for (const f of files) {
  http.get({ hostname: '172.27.210.154', port: 3005, path: f }, res => {
    let b = '';
    res.on('data', c => b += c);
    res.on('end', () => {
      const m = b.match(/.{0,80}unkonwn.{0,80}/gi);
      if (m) console.log('Found in', f, m);
    });
  });
}
