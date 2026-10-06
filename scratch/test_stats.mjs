import http from 'http';

const token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
const dsUid = 'efz4nzx8r30g0c';

const dashboard = {
  uid: "test-stats-noc",
  title: "Test Stats NOC",
  timezone: "browser",
  schemaVersion: 40,
  refresh: "10s",
  time: { from: "now-15m", to: "now" },
  panels: [
    {
      id: 1,
      title: "Hosts Habilitados Zabbix",
      type: "stat",
      gridPos: { x: 0, y: 0, w: 8, h: 4 },
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: dsUid },
      options: {
        reduceOptions: { calcs: ["count"], values: false },
        textMode: "value",
        colorMode: "background",
        graphMode: "none"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "/.*/" },
          item: { filter: "/(ICMP ping|Zabbix agent ping|Hypervisor ping|System [uU]ptime|API availability status|Disponibilidad SNMP)/" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ],
      transformations: [
        {
          id: "reduce",
          options: {
            mode: "seriesToRows",
            reducers: ["lastNotNull"]
          }
        },
        {
          id: "reduce",
          options: {
            includeTimeField: false,
            mode: "seriesToRows",
            reducers: ["count"]
          }
        }
      ]
    },
    {
      id: 2,
      title: "Hosts OK",
      type: "stat",
      gridPos: { x: 8, y: 0, w: 8, h: 4 },
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: dsUid },
      options: {
        reduceOptions: { calcs: ["count"], values: false },
        textMode: "value",
        colorMode: "background",
        graphMode: "none"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "/.*/" },
          item: { filter: "/(ICMP ping|Zabbix agent ping|Hypervisor ping|System [uU]ptime|API availability status|Disponibilidad SNMP)/" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ],
      transformations: [
        {
          id: "filterByValue",
          options: {
            filters: [
              { config: { id: "greater", options: { value: 0 } }, fieldName: "Value" }
            ],
            type: "include", match: "all"
          }
        },
        {
          id: "reduce",
          options: {
            mode: "seriesToRows",
            reducers: ["lastNotNull"]
          }
        },
        {
          id: "reduce",
          options: {
            includeTimeField: false,
            mode: "seriesToRows",
            reducers: ["count"]
          }
        }
      ]
    },
    {
      id: 3,
      title: "Using CalculateField",
      type: "stat",
      gridPos: { x: 16, y: 0, w: 8, h: 4 },
      datasource: { type: "alexanderzobnin-zabbix-datasource", uid: dsUid },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        textMode: "value",
        colorMode: "background",
        graphMode: "none"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "/.*/" },
          item: { filter: "/(ICMP ping|Zabbix agent ping|Hypervisor ping|System [uU]ptime|API availability status|Disponibilidad SNMP)/" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ],
      transformations: [
        {
          id: "calculateField",
          options: {
            mode: "reduceRow",
            reduce: {
              reducer: "count"
            },
            replaceFields: true
          }
        }
      ]
    }
  ]
};

const req = http.request('http://172.27.210.154:3005/api/dashboards/db', {
  method: 'POST',
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  }
}, res => {
  let b = "";
  res.on("data", d => b += d);
  res.on("end", () => console.log(b));
});
req.write(JSON.stringify({ dashboard, overwrite: true, folderUid: "milicic-noc" }));
req.end();
