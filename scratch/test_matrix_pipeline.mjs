import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function getRawFrames() {
  const now = Date.now();
  const payload = JSON.stringify({
    from: String(now - 900000),
    to: String(now),
    queries: [
      {
        refId: 'Ping',
        schema: 13,
        queryType: '0',
        group: { filter: 'FortiGate' },
        host: { filter: '/.*/' },
        item: { filter: 'ICMP ping' },
        resultFormat: 'time_series',
        datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
      },
      {
        refId: 'Latency',
        schema: 13,
        queryType: '0',
        group: { filter: 'FortiGate' },
        host: { filter: '/.*/' },
        item: { filter: 'ICMP response time' },
        resultFormat: 'time_series',
        datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
      },
      {
        refId: 'Loss',
        schema: 13,
        queryType: '0',
        group: { filter: 'FortiGate' },
        host: { filter: '/.*/' },
        item: { filter: 'ICMP loss' },
        resultFormat: 'time_series',
        datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
      },
      {
        refId: 'Sessions',
        schema: 13,
        queryType: '0',
        group: { filter: 'FortiGate' },
        host: { filter: '/.*/' },
        item: { filter: '/IPv4 Active sessions/' },
        resultFormat: 'time_series',
        datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
      }
    ]
  });

  return new Promise((resolve) => {
    const req = http.request({
      hostname: '172.27.210.154',
      port: 3005,
      path: '/api/ds/query',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(JSON.parse(b)));
    });
    req.write(payload);
    req.end();
  });
}

// Emulate reduce with labelsToFields: true
function reduceSeriesToRowsWithLabels(frames) {
  const rows = [];
  for (const f of frames) {
    const valField = f.schema.fields.find(x => x.name === 'Value');
    const vals = f.data.values[1];
    let last = null;
    for (let i = vals.length - 1; i >= 0; i--) {
      if (vals[i] !== null && vals[i] !== undefined) {
        last = vals[i];
        break;
      }
    }
    rows.push({
      Field: f.schema.name,
      host: valField.labels?.host,
      item: valField.labels?.item,
      'Last * (not null)': last
    });
  }
  return rows;
}

// Emulate groupingToMatrix
function groupingToMatrix(rows, rowField, colField, valField) {
  const uniqueRows = Array.from(new Set(rows.map(r => r[rowField])));
  const uniqueCols = Array.from(new Set(rows.map(r => r[colField])));

  const matrix = [];
  for (const rVal of uniqueRows) {
    const rowObj = { [rowField]: rVal };
    for (const cVal of uniqueCols) {
      const match = rows.find(x => x[rowField] === rVal && x[colField] === cVal);
      rowObj[cVal] = match ? match[valField] : null;
    }
    matrix.push(rowObj);
  }
  return { columns: [rowField, ...uniqueCols], matrix };
}

async function run() {
  const res = await getRawFrames();
  const rawList = [];
  for (const refId of ['Ping', 'Latency', 'Loss', 'Sessions']) {
    for (const f of res.results[refId]?.frames || []) {
      rawList.push(f);
    }
  }

  const reduced = reduceSeriesToRowsWithLabels(rawList);
  console.log('Sample reduced row with labels:', reduced[0]);

  const { columns, matrix } = groupingToMatrix(reduced, 'host', 'item', 'Last * (not null)');
  console.log('Matrix columns:', columns);
  console.table(matrix);
}

run().catch(console.error);
