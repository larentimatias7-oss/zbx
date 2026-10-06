import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

// Check how many problems of each severity exist in Zabbix
async function checkZabbixProblems() {
  const payload = JSON.stringify({
    jsonrpc: "2.0",
    method: "problem.get",
    params: {
      output: ["eventid", "severity", "name", "clock"],
      acknowledged: false,
      suppressed: false
    },
    id: 1,
    auth: null
  });

  // Query via MCP initMAX local proxy if available, or direct check
}
