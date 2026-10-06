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

// Emulate Grafana's reduce (reduceFields mode, lastNotNull)
function reduceFields(frames) {
  return frames.map(f => {
    const valField = f.schema.fields.find(x => x.name === 'Value');
    const timeField = f.schema.fields.find(x => x.name === 'Time');
    const vals = f.data.values[1]; // values
    let lastVal = null;
    for (let i = vals.length - 1; i >= 0; i--) {
      if (vals[i] !== null && vals[i] !== undefined) {
        lastVal = vals[i];
        break;
      }
    }
    return {
      name: f.schema.name,
      refId: f.schema.refId,
      fields: [
        {
          name: 'Value',
          type: 'number',
          labels: valField.labels,
          values: [lastVal]
        }
      ],
      length: 1
    };
  });
}

// Exact implementation of joinByLabels from Grafana chunk 9383:
function joinByLabels(options, frames) {
  const valueLabel = options.value;
  // find all label keys
  const allLabelKeys = new Set();
  for (const f of frames) {
    for (const field of f.fields) {
      if (field.labels) {
        for (const k of Object.keys(field.labels)) allLabelKeys.add(k);
      }
    }
  }

  let joinLabels = options.join || Array.from(allLabelKeys);
  joinLabels = joinLabels.filter(e => e !== valueLabel);

  const columnNames = new Set();
  const rowsMap = new Map();

  for (const f of frames) {
    for (const field of f.fields) {
      if (field.labels) {
        const rowKey = joinLabels.map(k => field.labels[k]).join(',');
        let rowObj = rowsMap.get(rowKey);
        if (!rowObj) {
          rowObj = { keys: joinLabels.map(k => field.labels[k]), values: {} };
          rowsMap.set(rowKey, rowObj);
        }
        const colName = field.labels[valueLabel];
        rowObj.values[colName] = field.values[0];
        columnNames.add(colName);
      }
    }
  }

  const cols = Array.from(columnNames);
  const table = [];
  for (const [k, rowObj] of rowsMap.entries()) {
    const row = { host: rowObj.keys[0] };
    for (const col of cols) {
      row[col] = rowObj.values[col];
    }
    table.push(row);
  }
  return { columns: ['host', ...cols], rows: table };
}

async function run() {
  const res = await getRawFrames();
  const rawList = [];
  for (const refId of ['Ping', 'Latency', 'Loss', 'Sessions']) {
    for (const f of res.results[refId]?.frames || []) {
      rawList.push(f);
    }
  }

  const reduced = reduceFields(rawList);
  const result = joinByLabels({ value: 'item', join: ['host'] }, reduced);

  console.log('Columns:', result.columns);
  console.log('Total Rows:', result.rows.length);
  console.table(result.rows);
}

run().catch(console.error);
