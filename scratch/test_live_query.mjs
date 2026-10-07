import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function testQuery(name, queries, timeFrom = "now-7d") {
  const payload = JSON.stringify({
    queries: queries.map(q => ({
      ...q,
      datasource: {
        type: "alexanderzobnin-zabbix-datasource",
        uid: "efz4nzx8r30g0c"
      }
    })),
    from: timeFrom,
    to: "now"
  });

  return new Promise((resolve) => {
    const req = http.request('http://172.27.210.154:3005/api/ds/query', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        console.log(`\n=== [${name}] Status: ${res.statusCode} ===`);
        if (res.statusCode !== 200) {
          console.log('Error Body:', b);
        }
        try {
          const data = JSON.parse(b);
          for (const [refId, resObj] of Object.entries(data.results || {})) {
            const frames = resObj.frames || [];
            console.log(`Ref ${refId}: ${frames.length} frame(s)`);
            frames.forEach((f, idx) => {
              console.log(`  Frame ${idx}: ${f.schema?.name || 'unnamed'}`);
              console.log('    Fields:', f.schema?.fields?.map(fl => fl.name));
              if (f.data?.values) {
                console.log('    Rows count:', f.data.values[0]?.length);
                const sampleRows = [];
                for (let r = 0; r < Math.min(3, f.data.values[0]?.length || 0); r++) {
                  sampleRows.push(f.schema.fields.map((fl, fIdx) => `${fl.name}: ${f.data.values[fIdx][r]}`).join(' | '));
                }
                console.log('    Sample rows:\n      ' + sampleRows.join('\n      '));
              }
            });
          }
        } catch(e) {
          console.error('Error parsing response:', e, b.slice(0, 300));
        }
        resolve();
      });
    });
    req.write(payload);
    req.end();
  });
}

async function main() {
  // Test Stats
  await testQuery('STATS', [
    {
      refId: "LOCKOUTS",
      queryType: "0",
      group: { filter: "AD" },
      host: { filter: "SRO-DCO01" },
      item: { filter: "Total Bloqueos de Cuenta (24h - Multi-DC)" },
      resultFormat: "time_series"
    },
    {
      refId: "FAILED_LOGONS",
      queryType: "0",
      group: { filter: "AD" },
      host: { filter: "SRO-DCO01" },
      item: { filter: "Total Intentos Fallidos (24h - Multi-DC)" },
      resultFormat: "time_series"
    }
  ], "now-24h");

  // Test Lockout Table
  await testQuery('TABLE_LOCKOUT', [
    {
      refId: "USER",
      queryType: "2",
      group: { filter: "AD" },
      host: { filter: "SRO-DCO01" },
      item: { filter: "User locked Name" },
      resultFormat: "table",
      options: { skipEmptyValues: false },
      table: { skipEmptyValues: false }
    },
    {
      refId: "PC",
      queryType: "2",
      group: { filter: "AD" },
      host: { filter: "SRO-DCO01" },
      item: { filter: "User Locked PC" },
      resultFormat: "table",
      options: { skipEmptyValues: false },
      table: { skipEmptyValues: false }
    }
  ]);

  // Test Groups Table
  await testQuery('TABLE_GROUPS', [
    {
      refId: "RAW",
      queryType: "2",
      group: { filter: "AD" },
      host: { filter: "SRO-DCO01" },
      item: { filter: "Eventlog: Modificación de Grupos Privilegiados (4728, 4732, 4756)" },
      resultFormat: "table",
      options: { skipEmptyValues: false },
      table: { skipEmptyValues: false }
    },
    {
      refId: "DEP_GRP",
      queryType: "2",
      group: { filter: "AD" },
      host: { filter: "SRO-DCO01" },
      item: { filter: "Nombre de Grupo Modificado" },
      resultFormat: "table",
      options: { skipEmptyValues: false },
      table: { skipEmptyValues: false }
    }
  ]);
}

main();
