import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken || grafanaToken.length < 10) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const DATASOURCE_UID = "efz4nzx8r30g0c";
const DATASOURCE_TYPE = "alexanderzobnin-zabbix-datasource";

async function testMetrics() {
  const tests = [
    { name: "Galpón 01 RX", host: "SRO-E02-PB00-CORE01", item: "Interface Te1/0/8(Uplink_Galpones): Bits received" },
    { name: "Galpón 01 TX", host: "SRO-E02-PB00-CORE01", item: "Interface Te1/0/8(Uplink_Galpones): Bits sent" },
    { name: "Edificio Blanco RX", host: "SRO-E02-PB00-CORE01", item: "Interface Te1/0/5(Uplink_edificio_viejo): Bits received" },
    { name: "Edificio Blanco TX", host: "SRO-E02-PB00-CORE01", item: "Interface Te1/0/5(Uplink_edificio_viejo): Bits sent" },
    { name: "Edificio E03 TRK1 RX", host: "SRO-E03-P00-D03", item: "Interface TRK1(Core03 (dowlink)): Bits received" },
    { name: "Edificio E03 TRK1 TX", host: "SRO-E03-P00-D03", item: "Interface TRK1(Core03 (dowlink)): Bits sent" },
    { name: "Core01 -> Core03 Uplink RX", host: "SRO-E02-PB00-CORE01", item: "Interface Te1/0/6(UPLINK SW211): Bits received" },
    { name: "Core01 -> Core03 Uplink TX", host: "SRO-E02-PB00-CORE01", item: "Interface Te1/0/6(UPLINK SW211): Bits sent" },
    { name: "Inter-Core LAG 20G RX", host: "SRO-E02-PB00-CORE01", item: "Interface Te1/0/20(Uplink_SW_Dell): Bits received" },
    { name: "Inter-Core LAG 20G TX", host: "SRO-E02-PB00-CORE01", item: "Interface Te1/0/20(Uplink_SW_Dell): Bits sent" },
    { name: "UPS Power W", host: "UPS SRO CORE", item: "UPS Power Consumption (W)" },
    { name: "UPS Load %", host: "UPS SRO CORE", item: "UPS Load (%)" },
    { name: "UPS Minutes Remaining", host: "UPS SRO CORE", item: "Battery Time Remaining" }
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
      console.log(`[OK] ${t.name}: ${lastVal}`);
    } else {
      console.log(`[FAIL] ${t.name}: No data or error:`, resData?.error);
    }
  });
}

testMetrics();
