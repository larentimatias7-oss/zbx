import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken || grafanaToken.length < 10) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const DATASOURCE_UID = "efz4nzx8r30g0c";
const DATASOURCE_TYPE = "alexanderzobnin-zabbix-datasource";

const hosts = [
  "FTG_ar-ssj-predio_SNMP",
  "SSJ-CORE01",
  "SSJ-SWADM",
  "SSJ-HPV01",
  "SSJ-DCO01",
  "SSJ-FIL01",
  "SSJ-SVC01",
  "SSJ-BKP01",
  "SSJ-NAS01"
];

async function inspectHostItems() {
  const tests = [
    { host: "FTG_ar-ssj-predio_SNMP", item: "ICMP response time" },
    { host: "FTG_ar-ssj-predio_SNMP", item: "CPU utilization" },
    { host: "FTG_ar-ssj-predio_SNMP", item: "IPv4 Active sessions" },
    { host: "SSJ-CORE01", item: "ICMP ping" },
    { host: "SSJ-CORE01", item: "ICMP response time" },
    { host: "SSJ-SWADM", item: "ICMP ping" },
    { host: "SSJ-SWADM", item: "ICMP response time" },
    { host: "SSJ-HPV01", item: "ICMP ping" },
    { host: "SSJ-HPV01", item: "CPU utilization" },
    { host: "SSJ-DCO01", item: "CPU utilization" },
    { host: "SSJ-DCO01", item: "Used swap space in %" },
    { host: "SSJ-FIL01", item: "CPU utilization" },
    { host: "SSJ-BKP01", item: "CPU utilization" },
    { host: "SSJ-NAS01", item: "ICMP ping" },
    { host: "SSJ-NAS01", item: "ICMP response time" }
  ];

  const queries = tests.map((t, idx) => ({
    refId: "Q" + idx,
    datasource: { uid: DATASOURCE_UID, type: DATASOURCE_TYPE },
    schema: 12,
    queryType: "0",
    group: { filter: "/.*/" },
    host: { filter: t.host },
    item: { filter: t.item },
    resultFormat: "time_series",
    options: { showDisabledItems: false }
  }));

  const payload = {
    from: "now-1h",
    to: "now",
    queries: queries
  };

  const res = await new Promise(resolve => {
    const req = http.request({
      hostname: '172.27.210.154',
      port: 3005,
      path: '/api/ds/query',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + grafanaToken,
        'Content-Type': 'application/json'
      }
    }, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => resolve(JSON.parse(d)));
    });
    req.write(JSON.stringify(payload));
    req.end();
  });

  tests.forEach((t, idx) => {
    const key = "Q" + idx;
    const resData = res.results ? res.results[key] : null;
    if (resData && resData.frames && resData.frames.length > 0) {
      const frame = resData.frames[0];
      const vals = frame.data.values[1];
      const lastVal = vals[vals.length - 1];
      console.log(`[OK] ${t.host} -> ${t.item}: ${lastVal}`);
    } else {
      console.log(`[FAIL] ${t.host} -> ${t.item}: No data or error:`, resData?.error);
    }
  });
}

inspectHostItems();
