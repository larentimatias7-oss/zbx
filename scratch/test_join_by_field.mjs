import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

console.log('Testing joinByField configuration structure...');

const samplePanel = {
  id: 156,
  title: "🔒 Auditoría Forense de Bloqueos de Cuenta (Event 4740) — Últimos 7 Días",
  type: "table",
  gridPos: { x: 0, y: 67, w: 12, h: 8 },
  datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
  timeFrom: "7d",
  targets: [
    {
      refId: "USER",
      schema: 12,
      queryType: "2",
      group: { filter: "AD" },
      host: { filter: "SRO-DCO01" },
      application: { filter: "" },
      item: { filter: "User locked Name" },
      functions: [],
      resultFormat: "time_series",
      options: { showDisabledItems: false }
    },
    {
      refId: "PC",
      schema: 12,
      queryType: "2",
      group: { filter: "AD" },
      host: { filter: "SRO-DCO01" },
      application: { filter: "" },
      item: { filter: "User Locked PC" },
      functions: [],
      resultFormat: "time_series",
      options: { showDisabledItems: false }
    }
  ],
  transformations: [
    {
      id: "joinByField",
      options: {
        byField: "Time",
        mode": "outer"
      }
    },
    {
      id: "organize",
      options: {
        renameByName: {
          "Time": "Fecha / Hora",
          "Value #USER": "Usuario Bloqueado",
          "Value #PC": "Equipo Origen"
        }
      }
    }
  ]
};

console.log('Sample panel structure created.');
