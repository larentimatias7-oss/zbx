import fs from 'fs';

const code = fs.readFileSync('C:\\Users\\matias.larenti\\.gemini\\antigravity-ide\\brain\\ff3e7185-fd1a-48f1-9211-372c4af219cc\\scratch\\zabbix_plugin_module.js', 'utf8');

let pos = code.indexOf('function zt(');
console.log(code.substring(pos, pos + 300));
