import http from 'http';
import { execSync } from 'child_process';

let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken) {
  grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function testQuery(name, target) {
  const payload = JSON.stringify({
    queries: [
      {
        refId: "A",
        datasource: { type: "alexanderzobnin-zabbix-datasource", uid: "efz4nzx8r30g0c" },
        queryType: target.queryType || "0",
        schema: 12,
        resultFormat: "time_series",
        ...target
      }
    ],
    from: "now-1h",
    to: "now"
  });

  return new Promise((resolve) => {
    const req = http.request('http://172.27.210.154:3005/api/ds/query', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + grafanaToken,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(b);
          const frames = json.results?.A?.frames || [];
          const seriesCount = frames.length;
          const firstValues = frames[0]?.data?.values?.[1] || [];
          const lastVal = firstValues[firstValues.length - 1];
          console.log(`[${name}] -> Frames: ${seriesCount}, Sample last value: ${lastVal} (${frames[0]?.schema?.name || 'N/A'})`);
          resolve({ ok: seriesCount > 0, seriesCount, lastVal });
        } catch (e) {
          console.error(`[${name}] Error parseando:`, b.slice(0, 100));
          resolve({ ok: false, error: e.message });
        }
      });
    });
    req.on('error', (err) => resolve({ ok: false, error: err.message }));
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('=== TESTEANDO NUEVOS KPIS CONTRA ZABBIX ===\n');

  // 1. Redes: Saturación WAN TASA (port14)
  await testQuery("Redes: WAN TASA Bits Received", {
    group: { filter: "/(FortiGate|FortiWorld)/" },
    host: { filter: "FTG_milicic_border1_SNMP" },
    item: { filter: "Interface port14(tasa): Bits received" }
  });

  await testQuery("Redes: WAN TASA Bits Sent", {
    group: { filter: "/(FortiGate|FortiWorld)/" },
    host: { filter: "FTG_milicic_border1_SNMP" },
    item: { filter: "Interface port14(tasa): Bits sent" }
  });

  // 2. Redes: Saturación WAN Claro (port15)
  await testQuery("Redes: WAN Claro Bits Received", {
    group: { filter: "/(FortiGate|FortiWorld)/" },
    host: { filter: "FTG_milicic_border1_SNMP" },
    item: { filter: "Interface port15(claro): Bits received" }
  });

  // 3. Redes: Tráfico Agregado Internet (Sum In / Out de enlaces WAN)
  await testQuery("Redes: Tráfico WAN Agregado Flota", {
    group: { filter: "/(FortiGate|FortiWorld)/" },
    host: { filter: "/FTG_.*_SNMP/" },
    item: { filter: "/Interface (port14|port15|wan1|wan2).*Bits (received|sent)/i" }
  });

  // 4. Redes: Descartes en troncales Core
  await testQuery("Redes: Troncales Discards CORE01", {
    group: { filter: "switch" },
    host: { filter: "SRO-E02-PB00-CORE01" },
    item: { filter: "/Interface (Te1/0/[5-8]|Po[1-3]).*Inbound packets discarded/" }
  });

  // 5. Cómputo: Disk Read/Write Queue Length
  await testQuery("Cómputo: Disk Read Queue Length", {
    group: { filter: "/.*/" },
    host: { filter: "/SRO-DCO01|SRO-DCO02/" },
    item: { filter: "/0 C:: Average disk read queue length/" }
  });

  await testQuery("Cómputo: Disk Write Queue Length", {
    group: { filter: "/.*/" },
    host: { filter: "/SRO-DCO01|SRO-DCO02/" },
    item: { filter: "/0 C:: Average disk write queue length/" }
  });

  // 6. Cómputo: Latencia de lectura/escritura (sec/Read, sec/Write)
  await testQuery("Cómputo: Latencia Lectura Disco", {
    group: { filter: "/.*/" },
    host: { filter: "/SRO-DCO01|SRO-DCO02/" },
    item: { filter: "/0 C:: Disk read request avg waiting time/" }
  });

  await testQuery("Cómputo: Latencia Escritura Disco", {
    group: { filter: "/.*/" },
    host: { filter: "/SRO-DCO01|SRO-DCO02/" },
    item: { filter: "/0 C:: Disk write request avg waiting time/" }
  });

  // 7. Cómputo: Context switches per second
  await testQuery("Cómputo: Context switches/sec", {
    group: { filter: "/.*/" },
    host: { filter: "/SRO-DCO01|SRO-DCO02/" },
    item: { filter: "Context switches per second" }
  });

  // 8. Facilities: Consumo de potencia Emerson
  await testQuery("Facilities: Potencia Emerson (W)", {
    group: { filter: "/.*/" },
    host: { filter: "UPS SRO CORE" },
    item: { filter: "UPS Power Consumption (W)" }
  });

  // 9. Facilities: Autonomía de baterías (min)
  await testQuery("Facilities: Autonomía Emerson (min)", {
    group: { filter: "/.*/" },
    host: { filter: "UPS SRO CORE" },
    item: { filter: "Battery Time Remaining" }
  });

  await testQuery("Facilities: Autonomía Liebert PB (min)", {
    group: { filter: "/.*/" },
    host: { filter: "UPS Edificio Gris PB" },
    item: { filter: "Battery Time Remaining" }
  });

  // 10. Backup: Throughput de red en ventana de resguardo
  await testQuery("Backup: Throughput SRO-BKP01", {
    group: { filter: "/(Backup_Server|Storage_Server)/" },
    host: { filter: "SRO-BKP01" },
    item: { filter: "/Interface.*Bits (received|sent)/i" }
  });

  // 11. Backup: Servicios Veeam
  await testQuery("Backup: Servicios Veeam SRO-BKP01", {
    group: { filter: "/(Backup_Server|Storage_Server)/" },
    host: { filter: "SRO-BKP01" },
    item: { filter: "/State of service \"(VeeamBackupSvc|VeeamBrokerSvc|VeeamTransportSvc)\"/" }
  });
}

run();
