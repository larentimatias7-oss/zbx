import http from 'http';

function fetchFile(path) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: '172.27.210.154', port: 3005, path }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(b));
    }).on('error', reject);
  });
}

async function main() {
  const content = await fetchFile('/public/build/app.e91a84eaaa16c43f85f0.js');
  console.log('App size:', content.length);
  const match1 = content.match(/.{0,100}unkonwn.{0,100}/gi);
  console.log('Matches for unkonwn:', match1);
  const match2 = content.match(/.{0,100}extractFields.{0,100}/gi);
  console.log('Matches for extractFields:', match2?.slice(0, 5));
}

main().catch(console.error);
