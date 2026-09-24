import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const queryPayload = JSON.stringify({
  from: "now-1h",
  to: "now",
  queries: [
    {
      refId: "HEADER_CHECK",
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      schema: 12,
      queryType: "0",
      group: { filter: "switch" },
      host: { filter: "SRO-E02-PB00-CORE01" },
      item: { filter: "Dell N-Series: CPU usage 1m" }
    },
    {
      refId: "WAN_TASA",
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      schema: 12,
      queryType: "0",
      group: { filter: "/(FortiGate|FortiWorld)/" },
      host: { filter: "FTG_milicic_border1_SNMP" },
      item: { filter: "Interface port14(tasa): Bits received" }
    },
    {
      refId: "WAN_CLARO",
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      schema: 12,
      queryType: "0",
      group: { filter: "/(FortiGate|FortiWorld)/" },
      host: { filter: "FTG_milicic_border1_SNMP" },
      item: { filter: "Interface port15(claro): Bits received" }
    },
    {
      refId: "LAG_CORE",
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      schema: 12,
      queryType: "0",
      group: { filter: "switch" },
      host: { filter: "SRO-E02-PB00-CORE01" },
      item: { filter: "Interface Te1/0/20(Uplink_SW_Dell): Bits received" }
    },
    {
      refId: "CORE01_CPU",
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      schema: 12,
      queryType: "0",
      group: { filter: "switch" },
      host: { filter: "SRO-E02-PB00-CORE01" },
      item: { filter: "Dell N-Series: CPU usage 1m" }
    },
    {
      refId: "CORE02_CPU",
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      schema: 12,
      queryType: "0",
      group: { filter: "switch" },
      host: { filter: "SRO-E02-PB00-CORE02" },
      item: { filter: "Dell N-Series: CPU usage 1m" }
    },
    {
      refId: "UPS_LOAD",
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
      schema: 12,
      queryType: "0",
      group: { filter: "/.*/" },
      host: { filter: "UPS SRO CORE" },
      item: { filter: "UPS Load (%)" }
    }
  ]
});

const req = http.request('http://172.27.210.154:3005/api/ds/query', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(queryPayload)
  }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(b);
      console.log('Overall Query status:', res.statusCode);
      for (const [k, v] of Object.entries(parsed.results || {})) {
        const frames = v.frames || [];
        if (frames.length > 0) {
          const vals = frames[0].data.values[1] || [];
          console.log(`✅ ${k}: OK (frames: ${frames.length}, latest: ${vals[vals.length - 1]})`);
        } else {
          console.log(`❌ ${k}: NO DATA`);
        }
      }
    } catch (e) {
      console.error('Error:', e, b);
    }
  });
});
req.write(queryPayload);
req.end();
