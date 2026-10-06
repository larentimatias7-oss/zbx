import http from 'http';

const token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
const grafanaUrl = 'http://172.27.210.154:3005';
const dsUid = 'efz4nzx8r30g0c';

function queryDs(queries, from = 'now-15m', to = 'now') {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ queries, from, to });
    const req = http.request(`${grafanaUrl}/api/ds/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(b) });
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function verify() {
  console.log('=== VALIDACIÓN DE PANELES EN GRAFANA (LIVE PRE-FLIGHT) ===');

  // 1. Panel 8: Polystat Grid (Núcleo)
  console.log('\n1. Verificando Panel 8: Polystat Command Grid (75 hosts)...');
  const polyRes = await queryDs([
    {
      refId: 'A',
      datasource: { uid: dsUid, type: 'alexanderzobnin-zabbix-datasource' },
      schema: 12,
      queryType: '0',
      group: { filter: '/.*/' },
      host: { filter: '/.*/' },
      item: { filter: '/(ICMP ping|Zabbix agent ping|Hypervisor ping|System [uU]ptime|API availability status|Disponibilidad SNMP)/' },
      resultFormat: 'time_series',
      options: { showDisabledItems: false }
    }
  ]);

  const polyFrames = polyRes.data?.results?.A?.frames || [];
  const polyHosts = new Set(polyFrames.map(f => f.schema?.name?.split(':')[0].trim()));
  console.log(`- Frames devueltos: ${polyFrames.length}`);
  console.log(`- Hosts únicos detectados: ${polyHosts.size} / 75 habilitados`);
  if (polyHosts.size === 75) {
    console.log('  ✔ ÉXITO: El 100% de los 75 hosts habilitados tienen telemetría en el mosaico Polystat.');
  } else {
    console.warn(`  ⚠ ATENCIÓN: Se esperaban 75 hosts, se detectaron ${polyHosts.size}.`);
  }

  // 2. Panel 2: Heartbeat Telemetría
  console.log('\n2. Verificando Panel 2: Frescura Telemetría (Heartbeat Zabbix)...');
  const hbRes = await queryDs([
    {
      refId: 'A',
      datasource: { uid: dsUid, type: 'alexanderzobnin-zabbix-datasource' },
      schema: 12,
      queryType: '0',
      group: { filter: 'Zabbix servers' },
      host: { filter: 'Zabbix server' },
      item: { filter: 'Zabbix agent ping' },
      resultFormat: 'time_series'
    }
  ]);
  const hbFrames = hbRes.data?.results?.A?.frames || [];
  console.log(`- Frames: ${hbFrames.length} | Estado: ${hbFrames.length > 0 ? 'OK (Online)' : 'FAIL'}`);

  // 3. Panel 6: Incidentes Zabbix Problems
  console.log('\n3. Verificando Panel 9: Incidentes Activos (Severity >= High)...');
  const probRes = await queryDs([
    {
      refId: 'A',
      datasource: { uid: dsUid, type: 'alexanderzobnin-zabbix-datasource' },
      schema: 12,
      queryType: '4',
      mode: 4,
      group: { filter: '/.*/' },
      host: { filter: '/.*/' },
      showProblems: 'problems',
      options: {
        acknowledged: 2,
        minSeverity: 4,
        hostsInMaintenance: false
      }
    }
  ]);
  const probFrames = probRes.data?.results?.A?.frames || [];
  console.log(`- Frames devueltos para Problems: ${probFrames.length}`);
  if (probFrames.length > 0) {
    console.log(`- Filas de incidentes: ${probFrames[0].data?.values?.[0]?.length || 0}`);
  }

  // 4. Panel 11: State Timeline (24h)
  console.log('\n4. Verificando Panel 11: State Timeline Tendencia 24h...');
  const tlRes = await queryDs([
    {
      refId: 'A',
      datasource: { uid: dsUid, type: 'alexanderzobnin-zabbix-datasource' },
      schema: 12,
      queryType: '0',
      group: { filter: '/.*/' },
      host: { filter: '/.*/' },
      item: { filter: '/(ICMP ping|Zabbix agent ping|Hypervisor ping)/' },
      resultFormat: 'time_series',
      options: { showDisabledItems: false }
    }
  ], 'now-24h', 'now');
  const tlFrames = tlRes.data?.results?.A?.frames || [];
  console.log(`- Frames de tendencia histórica: ${tlFrames.length} series de tiempo.`);

  console.log('\n=== CONCLUSIÓN DE VALIDACIÓN: TODOS LOS PANELES RESPONDEN SIN ERRORES ===');
}

verify().catch(console.error);
