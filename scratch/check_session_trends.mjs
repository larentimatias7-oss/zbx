import https from 'https';
import { execSync } from 'child_process';

const ps = 'Add-Type -AssemblyName System.Security; $cipher = [IO.File]::ReadAllBytes(\'C:\\\\ProgramData\\\\Milicic\\\\Zabbix\\\\codex_audit_token.bin\'); $plainBytes = [Security.Cryptography.ProtectedData]::Unprotect($cipher, [Text.Encoding]::UTF8.GetBytes(\'Milicic-Zabbix-Audit-v1\'), [Security.Cryptography.DataProtectionScope]::LocalMachine); [Text.Encoding]::UTF8.GetString($plainBytes)';
const token = execSync('powershell.exe -NoProfile -Command "' + ps + '"', { encoding: 'utf8' }).trim();

async function zabbixRequest(method, params) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 });
    const req = https.request({
      hostname: 'zabbix.mlccnet.local',
      port: 443,
      path: '/api_jsonrpc.php',
      method: 'POST',
      rejectUnauthorized: false,
      headers: {
        'Content-Type': 'application/json-rpc',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  const items = await zabbixRequest('item.get', {
    search: { key_: 'net.ipv4.sessions[fgSysSesCount.0]' },
    selectHosts: ['hostid', 'host', 'name'],
    output: ['itemid', 'name', 'key_', 'history', 'trends', 'value_type']
  });
  console.log(`Encontrados ${items.result.length} items:`);
  items.result.slice(0, 3).forEach(it => {
    console.log(`- Host: ${it.hosts[0].host} | ItemID: ${it.itemid} | History: ${it.history} | Trends: ${it.trends}`);
  });

  // Consultar trend.get para milicic_border1 para calcular promedio de 7 y 30 días
  const borderItem = items.result.find(x => x.hosts[0].host.includes('border1'));
  if (borderItem) {
    const now = Math.floor(Date.now() / 1000);
    const trends7d = await zabbixRequest('trend.get', {
      itemids: [borderItem.itemid],
      time_from: now - (7 * 86400),
      time_till: now,
      output: ['clock', 'num', 'value_min', 'value_avg', 'value_max']
    });
    console.log(`\nTrends de 7 días para ${borderItem.hosts[0].host}: ${trends7d.result.length} horas registradas.`);
    if (trends7d.result.length > 0) {
      let sumAvg = 0;
      let maxPeak = 0;
      trends7d.result.forEach(t => {
        sumAvg += parseFloat(t.value_avg);
        if (parseFloat(t.value_max) > maxPeak) maxPeak = parseFloat(t.value_max);
      });
      const globalAvg7d = Math.round(sumAvg / trends7d.result.length);
      console.log(`- Promedio 7 días: ${globalAvg7d} sesiones`);
      console.log(`- Pico máximo 7 días: ${Math.round(maxPeak)} sesiones`);
    }

    const trends30d = await zabbixRequest('trend.get', {
      itemids: [borderItem.itemid],
      time_from: now - (30 * 86400),
      time_till: now,
      output: ['clock', 'num', 'value_min', 'value_avg', 'value_max']
    });
    console.log(`\nTrends de 30 días para ${borderItem.hosts[0].host}: ${trends30d.result.length} horas registradas.`);
    if (trends30d.result.length > 0) {
      let sumAvg = 0;
      let maxPeak = 0;
      trends30d.result.forEach(t => {
        sumAvg += parseFloat(t.value_avg);
        if (parseFloat(t.value_max) > maxPeak) maxPeak = parseFloat(t.value_max);
      });
      const globalAvg30d = Math.round(sumAvg / trends30d.result.length);
      console.log(`- Promedio 30 días: ${globalAvg30d} sesiones`);
      console.log(`- Pico máximo 30 días: ${Math.round(maxPeak)} sesiones`);
    }
  }
}

main().catch(console.error);
