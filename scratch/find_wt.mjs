import fs from 'fs';

const code = fs.readFileSync('C:\\Users\\matias.larenti\\.gemini\\antigravity-ide\\brain\\ff3e7185-fd1a-48f1-9211-372c4af219cc\\scratch\\zabbix_plugin_module.js', 'utf8');

let pos = 0;
while ((pos = code.indexOf('function Wt', pos)) !== -1) {
  console.log('Pos:', pos);
  console.log(code.substring(pos, pos + 500));
  pos += 10;
}
