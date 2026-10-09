import net from 'net';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logFile = path.join(__dirname, '../scratch/zabbix_proxy.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.appendFileSync(logFile, line, 'utf8');
  } catch (e) {}
}

const LISTEN_HOST = '0.0.0.0';
const LISTEN_PORT = 8443;
const TARGET_HOST = '172.30.20.61';
const TARGET_PORT = 443;

const server = net.createServer(clientSocket => {
  const clientAddr = `${clientSocket.remoteAddress}:${clientSocket.remotePort}`;

  const targetSocket = net.connect(TARGET_PORT, TARGET_HOST, () => {
    clientSocket.pipe(targetSocket);
    targetSocket.pipe(clientSocket);
  });

  clientSocket.on('error', err => {
    targetSocket.destroy();
  });

  targetSocket.on('error', err => {
    log(`[Target Error] ${err.message} (${TARGET_HOST}:${TARGET_PORT})`);
    clientSocket.destroy();
  });

  clientSocket.on('close', () => targetSocket.destroy());
  targetSocket.on('close', () => clientSocket.destroy());
});

server.on('error', err => {
  log(`[Server Error] ${err.message}`);
  // Si el puerto estuviera ocupado, intentar re-abrir en 5s
  if (err.code === 'EADDRINUSE') {
    log('[Server Error] Puerto 8443 en uso. Reintentando en 5 segundos...');
    setTimeout(() => {
      server.close();
      server.listen(LISTEN_PORT, LISTEN_HOST);
    }, 5000);
  }
});

process.on('uncaughtException', err => {
  log(`[Uncaught Exception]: ${err.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`[Unhandled Rejection]: ${reason}`);
});

server.listen(LISTEN_PORT, LISTEN_HOST, () => {
  const msg = `[Zabbix Proxy Active] Escuchando en ${LISTEN_HOST}:${LISTEN_PORT} -> ${TARGET_HOST}:${TARGET_PORT}`;
  console.log(msg);
  log(msg);
});
