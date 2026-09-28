import { execSync } from 'child_process';

const token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();

async function testQuery(hostFilter, itemFilter) {
  const payload = {
    queries: [
      {
        refId: 'A',
        datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' },
        schema: 12,
        queryType: '2',
        group: { filter: 'AD' },
        host: { filter: hostFilter },
        item: { filter: itemFilter },
        resultFormat: 'time_series',
        options: { disableDataAlignment: false, showDisabledItems: false, skipEmptyValues: false, useZabbixValueMapping: false },
        table: { skipEmptyValues: false }
      }
    ],
    from: 'now-30d',
    to: 'now'
  };

  const res = await fetch('http://172.27.210.154:3005/api/ds/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  const frames = data.results?.A?.frames || [];
  console.log(`Query host: ${hostFilter}, item: ${itemFilter} -> Frames: ${frames.length}`);
  frames.forEach((f, i) => {
    const fields = f.schema.fields.map(x => `${x.name} (${x.type})`).join(', ');
    const rowCount = f.data.values[0]?.length || 0;
    console.log(`  Frame [${i}] name: "${f.schema.name}", rows: ${rowCount}, fields: ${fields}`);
  });
}

async function main() {
  await testQuery('/SRO-DCO01/', '/.*User locked.*/');
  await testQuery('/(SRO-DCO01|SRO-DCO02|SSJ-DCO01)/', '/.*User locked.*/');
  await testQuery('/(SRO-DCO01|SRO-DCO02|SSJ-DCO01)/', '/.*4625.*/');
}

main();
