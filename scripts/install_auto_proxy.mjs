import fs from 'fs';
import path from 'path';

const startupDir = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
const destFile = path.join(startupDir, 'ZabbixDokployTunnel.vbs');

const vbsContent = `Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "node.exe C:\\zabbix_anti\\scripts\\zabbix_proxy_daemon.mjs", 0, False
`;

fs.writeFileSync(destFile, vbsContent, 'utf8');
console.log('Automated startup installed successfully at:', destFile);
