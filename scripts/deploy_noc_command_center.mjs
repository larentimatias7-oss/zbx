import http from 'http';
import fs from 'fs';
import path from 'path';

const token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
const grafanaUrl = 'http://172.27.210.154:3005';
const dsUid = 'efz4nzx8r30g0c';

const dashboard = {
  id: null,
  uid: "noc-zabbix-command-center",
  title: "NOC - Zabbix Command Center",
  tags: ["noc", "zabbix", "milicic", "command-center"],
  timezone: "browser",
  schemaVersion: 40,
  version: 1,
  refresh: "30s",
  time: {
    from: "now-15m",
    to: "now"
  },
  timepicker: {
    refresh_intervals: ["10s", "30s", "1m", "5m", "15m", "30m", "1h"],
    time_options: ["5m", "15m", "1h", "6h", "12h", "24h", "2d", "7d"]
  },
  templating: {
    list: [
      {
        name: "datasource",
        type: "datasource",
        query: "alexanderzobnin-zabbix-datasource",
        current: {
          selected: true,
          text: "alexanderzobnin-zabbix-datasource",
          value: dsUid
        },
        hide: 2,
        label: "Datasource"
      },
      {
        name: "hostgroup",
        label: "Grupo de Hosts",
        type: "query",
        datasource: {
          type: "alexanderzobnin-zabbix-datasource",
          uid: dsUid
        },
        definition: "*",
        query: "*",
        regex: "",
        current: {
          selected: true,
          text: "All",
          value: "$__all"
        },
        includeAll: true,
        allValue: "/.*/",
        multi: true,
        refresh: 1,
        sort: 1
      },
      {
        name: "host",
        label: "Host",
        type: "query",
        datasource: {
          type: "alexanderzobnin-zabbix-datasource",
          uid: dsUid
        },
        definition: "$hostgroup.*",
        query: "$hostgroup.*",
        regex: "",
        current: {
          selected: true,
          text: "All",
          value: "$__all"
        },
        includeAll: true,
        allValue: "/.*/",
        multi: true,
        refresh: 1,
        sort: 1
      }
    ]
  },
  panels: [
    // -------------------------------------------------------------------------
    // FILA 0: BANNER DE CABECERA Y HEARTBEAT DE FRESCURA (y: 0, h: 3)
    // -------------------------------------------------------------------------
    {
      id: 1,
      title: "",
      type: "text",
      gridPos: { x: 0, y: 0, w: 18, h: 3 },
      options: {
        mode: "html",
        content: `
<div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%); border-left: 6px solid #EA580C; padding: 10px 16px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
  <div>
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="background: #EA580C; color: white; padding: 2px 7px; border-radius: 4px; font-weight: 800; font-size: 11px; letter-spacing: 0.5px;">MILICIC S.A.</span>
      <h2 style="margin: 0; color: #FFFFFF; font-size: 17px; font-weight: 700;">NOC COMMAND CENTER &bull; Zabbix 7.0 LTS</h2>
    </div>
    <p style="margin: 3px 0 0 0; color: #94A3B8; font-size: 11px;">Monitoreo Global de Disponibilidad en Tiempo Real &bull; Matriz de Salud de Infraestructura &bull; Modo Pared / Kiosk</p>
  </div>
  <div style="display: flex; gap: 8px; align-items: center;">
    <span style="background: rgba(22, 163, 74, 0.15); border: 1px solid #16A34A; color: #4ADE80; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700;">
      AUTO-ESCALABLE &bull; LIVE 30s
    </span>
  </div>
</div>
        `
      }
    },
    {
      id: 2,
      title: "Frescura Telemetría (Heartbeat)",
      type: "stat",
      gridPos: { x: 18, y: 0, w: 6, h: 3 },
      datasource: {
        type: "alexanderzobnin-zabbix-datasource",
        uid: dsUid
      },
      fieldConfig: {
        defaults: {
          unit: "s",
          color: {
            mode: "thresholds"
          },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#73BF69", value: null },
              { color: "#FFC859", value: 60 },
              { color: "#E45959", value: 120 }
            ]
          }
        }
      },
      options: {
        reduceOptions: {
          values: false,
          calcs: ["lastNotNull"],
          fields: ""
        },
        orientation: "auto",
        textMode: "value_and_name",
        colorMode: "background",
        graphMode: "none",
        justifyMode: "center"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "Zabbix servers" },
          host: { filter: "Zabbix server" },
          item: { filter: "Zabbix agent ping" },
          resultFormat: "time_series"
        }
      ],
      transformations: [
        {
          id: "calculateField",
          options: {
            mode: "reduceRow",
            reduce: {
              reducer: "last"
            }
          }
        }
      ]
    },

    // -------------------------------------------------------------------------
    // FILA 1: KPIS GLOBALES (y: 3, h: 4)
    // -------------------------------------------------------------------------
    {
      id: 3,
      title: "Hosts Habilitados Zabbix",
      type: "stat",
      gridPos: { x: 0, y: 3, w: 5, h: 4 },
      datasource: {
        type: "alexanderzobnin-zabbix-datasource",
        uid: dsUid
      },
      fieldConfig: {
        defaults: {
          color: { mode: "fixed", fixedColor: "#38BDF8" },
          mappings: []
        }
      },
      options: {
        reduceOptions: {
          calcs: ["lastNotNull"],
          values: false
        },
        orientation: "auto",
        textMode: "value",
        colorMode: "background",
        graphMode: "none",
        justifyMode: "center"
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
    },
    {
      id: 4,
      title: "Hosts OK (Disponibles)",
      type: "stat",
      gridPos: { x: 5, y: 3, w: 5, h: 4 },
      datasource: {
        type: "alexanderzobnin-zabbix-datasource",
        uid: dsUid
      },
      fieldConfig: {
        defaults: {
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#E45959", value: null },
              { color: "#73BF69", value: 1 }
            ]
          }
        }
      },
      options: {
        reduceOptions: {
          calcs: ["lastNotNull"],
          values: false
        },
        orientation: "auto",
        textMode: "value",
        colorMode: "background",
        graphMode: "none",
        justifyMode: "center"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "/.*/" },
          item: { filter: "/(ICMP ping|Zabbix agent ping|Hypervisor ping)/" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ],
      transformations: [
        {
          id: "filterByValue",
          options: {
            filters: [
              {
                config: { id: "greater", options: { value: 0 } },
                fieldName: "Value"
              }
            ],
            type: "include",
            match: "all"
          }
        },
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
    },
    {
      id: 5,
      title: "Hosts DOWN / Caídos",
      type: "stat",
      gridPos: { x: 10, y: 3, w: 4, h: 4 },
      datasource: {
        type: "alexanderzobnin-zabbix-datasource",
        uid: dsUid
      },
      fieldConfig: {
        defaults: {
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#73BF69", value: null },
              { color: "#E45959", value: 1 }
            ]
          }
        }
      },
      options: {
        reduceOptions: {
          calcs: ["lastNotNull"],
          values: false
        },
        orientation: "auto",
        textMode: "value",
        colorMode: "background",
        graphMode: "none",
        justifyMode: "center"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "/.*/" },
          item: { filter: "/(ICMP ping|Zabbix agent ping|Hypervisor ping)/" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ],
      transformations: [
        {
          id: "filterByValue",
          options: {
            filters: [
              {
                config: { id: "equal", options: { value: 0 } },
                fieldName: "Value"
              }
            ],
            type: "include",
            match: "all"
          }
        },
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
    },
    {
      id: 6,
      title: "Severidad Máxima Activa",
      type: "stat",
      gridPos: { x: 14, y: 3, w: 5, h: 4 },
      datasource: {
        type: "alexanderzobnin-zabbix-datasource",
        uid: dsUid
      },
      fieldConfig: {
        defaults: {
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#73BF69", value: null },
              { color: "#FFC859", value: 2 },
              { color: "#FFA059", value: 3 },
              { color: "#E97659", value: 4 },
              { color: "#E45959", value: 5 }
            ]
          },
          mappings: [
            {
              type: "value",
              options: {
                "0": { text: "NORMAL / OK", color: "#73BF69" },
                "1": { text: "INFO", color: "#5794F2" },
                "2": { text: "WARNING", color: "#FFC859" },
                "3": { text: "AVERAGE", color: "#FFA059" },
                "4": { text: "HIGH (P1)", color: "#E97659" },
                "5": { text: "DISASTER (P1)", color: "#E45959" }
              }
            }
          ]
        }
      },
      options: {
        reduceOptions: {
          calcs: ["max"],
          values: false
        },
        orientation: "auto",
        textMode: "value_and_name",
        colorMode: "background",
        graphMode: "none",
        justifyMode: "center"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "4",
          mode: 4,
          group: { filter: "/.*/" },
          host: { filter: "/.*/" },
          showProblems: "problems",
          options: {
            acknowledged: 2,
            minSeverity: 2,
            hostsInMaintenance: false
          }
        }
      ],
      transformations: [
        {
          id: "calculateField",
          options: {
            mode: "reduceRow",
            reduce: {
              reducer: "max"
            }
          }
        }
      ]
    },
    {
      id: 7,
      title: "Health Score Global",
      type: "gauge",
      gridPos: { x: 19, y: 3, w: 5, h: 4 },
      datasource: {
        type: "alexanderzobnin-zabbix-datasource",
        uid: dsUid
      },
      fieldConfig: {
        defaults: {
          min: 0,
          max: 1,
          unit: "percentunit",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#E45959", value: null },
              { color: "#FFA059", value: 0.85 },
              { color: "#FFC859", value: 0.92 },
              { color: "#73BF69", value: 0.96 }
            ]
          }
        }
      },
      options: {
        showThresholdLabels: false,
        showThresholdMarkers: true,
        reduceOptions: {
          calcs: ["lastNotNull"],
          values: false
        }
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "/.*/" },
          item: { filter: "/(ICMP ping|Zabbix agent ping|Hypervisor ping)/" },
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
              reducer: "mean"
            },
            replaceFields: true
          }
        }
      ]
    },

    // -------------------------------------------------------------------------
    // FILA 2: MAPA DE ESTADO POLYSTAT (NÚCLEO DEL DASHBOARD) (y: 7, h: 10)
    // -------------------------------------------------------------------------
    {
      id: 8,
      title: "Mapa de Estado de Disponibilidad de la Flota (Status Grid)",
      type: "stat",
      gridPos: { x: 0, y: 7, w: 24, h: 10 },
      datasource: {
        type: "alexanderzobnin-zabbix-datasource",
        uid: dsUid
      },
      options: {
        reduceOptions: {
          calcs: ["lastNotNull"],
          values: false
        },
        orientation: "horizontal",
        textMode: "name",
        colorMode: "background",
        graphMode: "none",
        justifyMode: "center",
        text: {
          titleSize: 12,
          valueSize: 12
        }
      },
      fieldConfig: {
        defaults: {
          noValue: "SIN TELEMETRÍA",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#555555", value: null },
              { color: "#E45959", value: 0 },
              { color: "#73BF69", value: 1 }
            ]
          },
          mappings: [
            {
              type: "value",
              options: {
                "0": { text: "DOWN", color: "#E45959" },
                "1": { text: "UP", color: "#73BF69" }
              }
            }
          ]
        }
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/$hostgroup/" },
          host: { filter: "/$host/" },
          item: { filter: "/(ICMP ping|Zabbix agent ping|Hypervisor ping|System [uU]ptime|API availability status|Disponibilidad SNMP)/" },
          resultFormat: "time_series",
          options: { showDisabledItems: false },
          functions: [
            {
              def: { name: "setAlias", category: "Alias" },
              params: ["$__zbx_host"]
            }
          ]
        }
      ]
    },

    // -------------------------------------------------------------------------
    // FILA 3: INCIDENTES ACTIVOS (ZABBIX PROBLEMS) (y: 17, h: 7)
    // -------------------------------------------------------------------------
    {
      id: 9,
      title: "Incidentes Activos en Tiempo Real (Severidad >= High / Disaster)",
      type: "table",
      gridPos: { x: 0, y: 17, w: 24, h: 7 },
      datasource: {
        type: "alexanderzobnin-zabbix-datasource",
        uid: dsUid
      },
      options: {
        showHeader: true,
        sortBy: [
          {
            displayName: "Severity",
            desc: true
          }
        ]
      },
      fieldConfig: {
        defaults: {
          custom: {
            align: "auto",
            cellOptions: {
              type: "auto"
            },
            inspect: false
          }
        },
        overrides: [
          {
            matcher: { id: "byName", options: "Severity" },
            properties: [
              {
                id: "custom.cellOptions",
                value: {
                  type: "color-background",
                  mode: "gradient"
                }
              }
            ]
          }
        ]
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "4",
          mode: 4,
          group: { filter: "/$hostgroup/" },
          host: { filter: "/$host/" },
          showProblems: "problems",
          options: {
            acknowledged: 2,
            minSeverity: 4,
            hostsInMaintenance: false
          }
        }
      ]
    },

    // -------------------------------------------------------------------------
    // FILA 4 (COLAPSABLE): TENDENCIAS HISTÓRICAS DE DISPONIBILIDAD (24 HORAS)
    // -------------------------------------------------------------------------
    {
      id: 10,
      title: "Tendencia de Disponibilidad Últimas 24 Horas (State Timeline)",
      type: "row",
      collapsed: true,
      gridPos: { x: 0, y: 24, w: 24, h: 1 },
      panels: [
        {
          id: 11,
          title: "Línea de Tiempo de Estado Operativo (Últimas 24h)",
          type: "state-timeline",
          gridPos: { x: 0, y: 25, w: 24, h: 8 },
          datasource: {
            type: "alexanderzobnin-zabbix-datasource",
            uid: dsUid
          },
          timeFrom: "24h",
          fieldConfig: {
            defaults: {
              color: { mode: "thresholds" },
              thresholds: {
                mode: "absolute",
                steps: [
                  { color: "#555555", value: null },
                  { color: "#E45959", value: 0 },
                  { color: "#73BF69", value: 1 }
                ]
              },
              mappings: [
                {
                  type: "value",
                  options: {
                    "0": { text: "DOWN", color: "#E45959" },
                    "1": { text: "UP", color: "#73BF69" }
                  }
                }
              ]
            }
          },
          options: {
            mergeValues: true,
            showValue: "never",
            alignValue: "left",
            rowHeight: 0.8
          },
          targets: [
            {
              refId: "A",
              schema: 12,
              queryType: "0",
              group: { filter: "/$hostgroup/" },
              host: { filter: "/$host/" },
              item: { filter: "/(ICMP ping|Zabbix agent ping|Hypervisor ping)/" },
              resultFormat: "time_series",
              options: { showDisabledItems: false }
            }
          ]
        }
      ]
    }
  ]
};

async function deploy() {
  console.log("=== DESPLEGANDO DASHBOARD EN GRAFANA ===");
  const payload = JSON.stringify({
    dashboard,
    folderUid: "milicic-noc",
    overwrite: true
  });

  return new Promise((resolve, reject) => {
    const req = http.request(`${grafanaUrl}/api/dashboards/db`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Content-Length": Buffer.byteLength(payload)
      }
    }, res => {
      let b = "";
      res.on("data", d => b += d);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(b);
          console.log(`Status: ${res.statusCode}`);
          console.log("Response:", parsed);
          resolve(parsed);
        } catch (e) {
          console.error("Raw response:", b);
          reject(e);
        }
      });
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  const res = await deploy();
  if (res.status === "success") {
    console.log("\nDashboard desplegado exitosamente!");
    console.log(`URL: ${grafanaUrl}${res.url}`);
    console.log(`URL Kiosk: ${grafanaUrl}${res.url}?kiosk`);

    // Save local copy to both dashboards directories
    const targetDir1 = path.resolve('dashboards');
    const targetDir2 = path.resolve('.zabbix_context/dashboards');
    if (!fs.existsSync(targetDir1)) fs.mkdirSync(targetDir1, { recursive: true });
    if (!fs.existsSync(targetDir2)) fs.mkdirSync(targetDir2, { recursive: true });

    fs.writeFileSync(path.join(targetDir1, 'noc-zabbix-command-center.json'), JSON.stringify(dashboard, null, 2));
    fs.writeFileSync(path.join(targetDir2, 'noc-zabbix-command-center.json'), JSON.stringify(dashboard, null, 2));
    console.log(`Archivo versionado guardado en:
 - dashboards/noc-zabbix-command-center.json
 - .zabbix_context/dashboards/noc-zabbix-command-center.json`);
  }
}

main().catch(console.error);
