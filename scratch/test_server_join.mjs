import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

async function getServerFrames() {
  const now = Date.now();
  const payload = JSON.stringify({
    from: String(now - 900000),
    to: String(now),
    queries: [
      {
        refId: 'A',
        schema: 13,
        queryType: '0',
        group: { filter: '/(Windows_Server|Linux servers|AD|Backup_Server|Storage_Server|Virtual machines)/' },
        host: { filter: '/.*/' },
        item: { filter: 'ICMP ping' },
        resultFormat: 'time_series',
        datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
      },
      {
        refId: 'B',
        schema: 13,
        queryType: '0',
        group: { filter: '/(Windows_Server|Linux servers|AD|Backup_Server|Storage_Server|Virtual machines)/' },
        host: { filter: '/.*/' },
        item: { filter: '/^CPU utilization$/' },
        resultFormat: 'time_series',
        datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
      },
      {
        refId: 'C',
        schema: 13,
        queryType: '0',
        group: { filter: '/(Windows_Server|Linux servers|AD|Backup_Server|Storage_Server|Virtual machines)/' },
        host: { filter: '/.*/' },
        item: { filter: 'Memory utilization' },
        resultFormat: 'time_series',
        datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: 'efz4nzx8r30g0c' }
      },
      {
        refId: 'D',
        schema: 13,
        queryType: '0',
        group: { filter: '/(Windows_Server|Linux servers|AD|Backup_Server|Storage_Server|Virtual machines)/' },
        host: { filter: '/.*/' },
        item: { filter: '/FS \\[.*(\\(C:\\)|\\/$)\\].*Space: Used, in %/' },
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

function reduceFields(frames) {
  return frames.map(f => {
    const valField = f.schema.fields.find(x => x.name === 'Value');
    const vals = f.data.values[1];
    let lastVal = null;
    for (let i = vals.length - 1; i >= 0; i--) {
      if (vals[i] !== null && vals[i] !== undefined) {
        lastVal = vals[i];
        break;
      }
    }
    // Normalize item name for disk so it's a single clean column
    let itemLabel = valField.labels.item;
    if (itemLabel.includes('Space: Used, in %')) {
      itemLabel = 'Disk Used %';
    }
    const cleanLabels = { ...valField.labels, item: itemLabel };

    return {
      name: f.schema.name,
      refId: f.schema.refId,
      fields: [
        {
          name: 'Value',
          type: 'number',
          labels: cleanLabels,
          values: [lastVal]
        }
      ],
      length: 1
    };
  });
}

function joinByLabels(options, frames) {
  const valueLabel = options.value;
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
  const res = await getServerFrames();
  const rawList = [];
  for (const refId of ['A', 'B', 'C', 'D']) {
    for (const f of res.results[refId]?.frames || []) {
      rawList.push(f);
    }
  }

  const reduced = reduceFields(rawList);
  const result = joinByLabels({ value: 'item', join: ['host'] }, reduced);

  console.log('Columns:', result.columns);
  console.log('Total Rows:', result.rows.length);
  console.table(result.rows.slice(0, 15));
}

run().catch(console.error);
