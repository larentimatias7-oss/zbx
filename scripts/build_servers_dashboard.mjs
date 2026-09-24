import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATASOURCE_UID = "efz4nzx8r30g0c";
const DATASOURCE_TYPE = "alexanderzobnin-zabbix-datasource";

const dashboard = {
  title: "Servidores: Monitoreo Integral & Métricas de Cómputo",
  uid: "milicic-servers-overview",
  tags: ["milicic", "servers", "windows", "linux", "infraestructura", "computo", "ad", "sql"],
  timezone: "browser",
  schemaVersion: 40,
  time: { from: "now-3h", to: "now" },
  refresh: "30s",
  templating: {
    list: [
      {
        name: "sede",
        label: "Sede / Ubicación",
        type: "custom",
        query: "Todas : .*, Rosario : SRO.*, San Juan : SSJ.*, Central y Linux : (Zabbix.*|JumpServer)",
        current: {
          text: "Todas",
          value: ".*"
        },
        options: [
          { text: "Todas", value: ".*", selected: true },
          { text: "Rosario", value: "SRO.*", selected: false },
          { text: "San Juan", value: "SSJ.*", selected: false },
          { text: "Central y Linux", value: "(Zabbix.*|JumpServer)", selected: false }
        ],
        includeAll: false,
        hide: 0
      },
      {
        name: "role",
        label: "Rol Operativo",
        type: "custom",
        query: "Todos : .*, Controladores de Dominio (AD) : .*DCO.*, Bases de Datos (SQL Server) : .*SQL.*, Servidores de Aplicación : (.*APP.*|.*SVC.*|.*MDS.*), Archivos y Almacenamiento : (.*FIL.*|.*STO.*|.*NAS.*), Respaldos (Backup/Veeam) : .*BKP.*, Core Linux : (Zabbix.*|JumpServer)",
        current: {
          text: "Todos",
          value: ".*"
        },
        options: [
          { text: "Todos", value: ".*", selected: true },
          { text: "Controladores de Dominio (AD)", value: ".*DCO.*", selected: false },
          { text: "Bases de Datos (SQL Server)", value: ".*SQL.*", selected: false },
          { text: "Servidores de Aplicación", value: "(.*APP.*|.*SVC.*|.*MDS.*)", selected: false },
          { text: "Archivos y Almacenamiento", value: "(.*FIL.*|.*STO.*|.*NAS.*)", selected: false },
          { text: "Respaldos (Backup/Veeam)", value: ".*BKP.*", selected: false },
          { text: "Core Linux", value: "(Zabbix.*|JumpServer)", selected: false }
        ],
        includeAll: false,
        hide: 0
      },
      {
        name: "server",
        label: "Servidor Específico",
        type: "query",
        datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
        query: {
          queryType: "2",
          group: "/(Windows_Server|Linux servers|AD|Applications|File_server|Backup_Server)/",
          host: "/(?!FTG_)${sede:raw}/"
        },
        current: {
          text: "All",
          value: "$__all"
        },
        includeAll: true,
        allValue: ".*",
        multi: true,
        refresh: 1,
        hide: 0
      }
    ]
  },
  panels: [
    // -------------------------------------------------------------
    // ROW 0: HEADER & RESUMEN DE LA FLOTA (y: 0, h: 4)
    // -------------------------------------------------------------
    {
      id: 1,
      title: "Servidores Monitoreados",
      type: "stat",
      gridPos: { x: 0, y: 0, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "fixed", fixedColor: "#5794F2" },
          unit: "none"
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "value",
        graphMode: "none",
        textMode: "value"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "/${server:regex}/" },
          item: { filter: "ICMP ping" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 2,
      title: "Disponibilidad Agentes Zabbix",
      type: "stat",
      gridPos: { x: 4, y: 0, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "percentunit",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#E45959", value: null },
              { color: "#FFC859", value: 0.8 },
              { color: "#73BF69", value: 1.0 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["mean"], values: false },
        colorMode: "background",
        graphMode: "none"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "/${server:regex}/" },
          item: { filter: "/(Zabbix agent ping|agent.ping)/" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 3,
      title: "Carga Media CPU Flota (%)",
      type: "stat",
      gridPos: { x: 8, y: 0, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "percent",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#73BF69", value: null },
              { color: "#FFC859", value: 70 },
              { color: "#E45959", value: 85 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["mean"], values: false },
        colorMode: "value",
        graphMode: "area"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/(Windows_Server|Linux servers|AD|Applications|File_server|Backup_Server)/" },
          host: { filter: "/^(?!FTG_).*${server:regex}.*/" },
          item: { filter: "CPU utilization" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 4,
      title: "Uso Medio Memoria RAM Flota (%)",
      type: "stat",
      gridPos: { x: 12, y: 0, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "percent",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#73BF69", value: null },
              { color: "#FFC859", value: 80 },
              { color: "#E45959", value: 90 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["mean"], values: false },
        colorMode: "value",
        graphMode: "area"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/(Windows_Server|Linux servers|AD|Applications|File_server|Backup_Server)/" },
          host: { filter: "/^(?!FTG_).*${server:regex}.*/" },
          item: { filter: "Memory utilization" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 5,
      title: "Latencia Media Ping RTT (ms)",
      type: "stat",
      gridPos: { x: 16, y: 0, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "s",
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#73BF69", value: null },
              { color: "#FFC859", value: 0.03 },
              { color: "#E45959", value: 0.08 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["mean"], values: false },
        colorMode: "value",
        graphMode: "none"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "/${server:regex}/" },
          item: { filter: "ICMP response time" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 6,
      title: "Alarmas Activas en Servidores",
      type: "stat",
      gridPos: { x: 20, y: 0, w: 4, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#73BF69", value: null },
              { color: "#FFC859", value: 1 },
              { color: "#E45959", value: 3 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "background",
        graphMode: "none"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "4",
          mode: 4,
          group: { filter: "/.*/" },
          host: { filter: "/${server:regex}/" },
          showProblems: "problems",
          options: {
            minSeverity: 2,
            acknowledged: 2,
            hostsInMaintenance: false
          }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 1: MOSAICO HEXAGONAL DE SERVIDORES (y: 4, h: 6)
    // -------------------------------------------------------------
    {
      id: 100,
      title: "Mosaico Hexagonal de Servidores: Disponibilidad y Salud del Parque (Polystat)",
      type: "grafana-polystat-panel",
      gridPos: { x: 0, y: 4, w: 24, h: 6 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      options: {
        polystat: {
          shape: "hexagon",
          displayMode: "all",
          columns: 9,
          rows: 3,
          fontSize: 11,
          fontColor: "#FFFFFF"
        },
        thresholds: [
          { color: "#E45959", state: 0, value: 0 },
          { color: "#16A34A", state: 1, value: 1 }
        ]
      },
      fieldConfig: {
        defaults: {
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#E45959", value: null },
              { color: "#16A34A", value: 1 }
            ]
          }
        }
      },
      targets: [
        {
          refId: "Ping",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "/^(?!FTG_).*${server:regex}.*/" },
          item: { filter: "/(Zabbix agent ping|ICMP ping)/" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 1.5: CONTROLADORES DE DOMINIO - ESTADO EJECUTIVO (y: 10, h: 4)
    // -------------------------------------------------------------
    {
      id: 7,
      title: "DC Primario Rosario: SRO-DCO01 (FSMO)",
      type: "stat",
      gridPos: { x: 0, y: 10, w: 8, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#73BF69", value: null },
              { color: "#FFC859", value: 75 },
              { color: "#E45959", value: 90 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "value",
        graphMode: "area",
        orientation: "horizontal"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "AD" },
          host: { filter: "SRO-DCO01" },
          item: { filter: "/(CPU utilization|Memory utilization)/" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 8,
      title: "DC Secundario Rosario: SRO-DCO02",
      type: "stat",
      gridPos: { x: 8, y: 10, w: 8, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#73BF69", value: null },
              { color: "#FFC859", value: 75 },
              { color: "#E45959", value: 90 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "value",
        graphMode: "area",
        orientation: "horizontal"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "AD" },
          host: { filter: "SRO-DCO02" },
          item: { filter: "/(CPU utilization|Memory utilization)/" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 9,
      title: "DC Sucursal San Juan: SSJ-DCO01",
      type: "stat",
      gridPos: { x: 16, y: 10, w: 8, h: 4 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          color: { mode: "thresholds" },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#73BF69", value: null },
              { color: "#FFC859", value: 75 },
              { color: "#E45959", value: 90 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "value",
        graphMode: "area",
        orientation: "horizontal"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "AD" },
          host: { filter: "SSJ-DCO01" },
          item: { filter: "/(CPU utilization|Memory utilization)/" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 2: COMPUTO (CPU Y RAM) - METODO USE (y: 14, h: 8)
    // -------------------------------------------------------------
    {
      id: 10,
      title: "Cómputo: Utilización de CPU (%) por Servidor",
      type: "timeseries",
      gridPos: { x: 0, y: 14, w: 12, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "percent",
          min: 0,
          max: 100,
          custom: {
            drawStyle: "line",
            lineInterpolation: "smooth",
            lineWidth: 2,
            fillOpacity: 10,
            gradientMode: "opacity",
            thresholdsStyle: { mode: "line" }
          },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#73BF69", value: null },
              { color: "#FFC859", value: 75 },
              { color: "#E45959", value: 90 }
            ]
          }
        }
      },
      options: {
        tooltip: { mode: "multi", sort: "desc" },
        legend: {
          displayMode: "table",
          placement: "bottom",
          calcs: ["lastNotNull", "max", "mean"]
        }
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/(Windows_Server|Linux servers|AD|Applications|File_server|Backup_Server)/" },
          host: { filter: "/^(?!FTG_).*${server:regex}.*/" },
          item: { filter: "CPU utilization" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 11,
      title: "Memoria: Utilización de Memoria RAM (%) por Servidor",
      type: "timeseries",
      gridPos: { x: 12, y: 14, w: 12, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "percent",
          min: 0,
          max: 100,
          custom: {
            drawStyle: "line",
            lineInterpolation: "smooth",
            lineWidth: 2,
            fillOpacity: 10,
            gradientMode: "opacity",
            thresholdsStyle: { mode: "line" }
          },
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#73BF69", value: null },
              { color: "#FFC859", value: 80 },
              { color: "#E45959", value: 90 }
            ]
          }
        }
      },
      options: {
        tooltip: { mode: "multi", sort: "desc" },
        legend: {
          displayMode: "table",
          placement: "bottom",
          calcs: ["lastNotNull", "max", "mean"]
        }
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/(Windows_Server|Linux servers|AD|Applications|File_server|Backup_Server)/" },
          host: { filter: "/^(?!FTG_).*${server:regex}.*/" },
          item: { filter: "Memory utilization" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 3: ALMACENAMIENTO - TREEMAP Y BAR GAUGE (y: 22, h: 8)
    // -------------------------------------------------------------
    {
      id: 120,
      title: "Almacenamiento: Capacidad y Distribución de Volúmenes por Servidor (Treemap)",
      type: "marcusolsson-treemap-panel",
      gridPos: { x: 0, y: 22, w: 12, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      options: {
        tilingAlgorithm: "squarify"
      },
      fieldConfig: {
        defaults: {
          unit: "percent",
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#73BF69", value: null },
              { color: "#FFC859", value: 75 },
              { color: "#FFA059", value: 85 },
              { color: "#E45959", value: 92 }
            ]
          }
        }
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/(Windows_Server|Linux servers|AD|Applications|File_server|Backup_Server)/" },
          host: { filter: "/^(?!FTG_).*${server:regex}.*/" },
          item: { filter: "/FS \\[(\\(?[A-Z]:\\)?|\\/|\\/var|\\/home|\\/opt|\\/data)\\]: Space: Used, in %/" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 12,
      title: "Almacenamiento: Espacio Ocupado en Volúmenes de Sistema (C: / Root) (%)",
      type: "bargauge",
      gridPos: { x: 12, y: 22, w: 12, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "percent",
          min: 0,
          max: 100,
          thresholds: {
            mode: "absolute",
            steps: [
              { color: "#73BF69", value: null },
              { color: "#FFC859", value: 75 },
              { color: "#FFA059", value: 85 },
              { color: "#E45959", value: 92 }
            ]
          }
        }
      },
      options: {
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        orientation: "horizontal",
        displayMode: "gradient",
        showUnfilled: true
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/(Windows_Server|Linux servers|AD|Applications|File_server|Backup_Server)/" },
          host: { filter: "/^(?!FTG_).*${server:regex}.*/" },
          item: { filter: "/FS \\[(\\(?[A-Z]:\\)?|\\/|\\/var|\\/home|\\/opt|\\/data)\\]: Space: Used, in %/" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 4: RED Y RENDIMIENTO DE DISCO (y: 30, h: 7)
    // -------------------------------------------------------------
    {
      id: 13,
      title: "Throughput de Red: Tráfico en Placas Principales (Bits In / Out bps)",
      type: "timeseries",
      gridPos: { x: 0, y: 30, w: 12, h: 7 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "bps",
          custom: {
            drawStyle: "line",
            lineInterpolation: "smooth",
            lineWidth: 2,
            fillOpacity: 10
          }
        }
      },
      options: {
        tooltip: { mode: "multi", sort: "desc" },
        legend: {
          displayMode: "table",
          placement: "bottom",
          calcs: ["lastNotNull", "max"]
        }
      },
      targets: [
        {
          refId: "In",
          schema: 12,
          queryType: "0",
          group: { filter: "/(Windows_Server|Linux servers|AD|Applications|File_server|Backup_Server)/" },
          host: { filter: "/^(?!FTG_).*${server:regex}.*/" },
          item: { filter: "/Interface.*(Ethernet0|eth0|ens[0-9]+|Red principal).*Bits received/i" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        },
        {
          refId: "Out",
          schema: 12,
          queryType: "0",
          group: { filter: "/(Windows_Server|Linux servers|AD|Applications|File_server|Backup_Server)/" },
          host: { filter: "/^(?!FTG_).*${server:regex}.*/" },
          item: { filter: "/Interface.*(Ethernet0|eth0|ens[0-9]+|Red principal).*Bits sent/i" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },
    {
      id: 16,
      title: "Longitud de Colas de E/S de Disco (Avg Disk Read & Write Queue Length)",
      type: "timeseries",
      gridPos: { x: 12, y: 30, w: 12, h: 7 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "short",
          custom: {
            drawStyle: "line",
            lineInterpolation: "smooth",
            lineWidth: 2,
            fillOpacity: 10
          }
        }
      },
      options: {
        legend: { displayMode: "table", placement: "bottom", calcs: ["lastNotNull", "max"] }
      },
      targets: [
        {
          refId: "ReadQueue",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "/^(?!FTG_).*${server:regex}.*/" },
          item: { filter: "/0 C:: Average disk read queue length/" },
          resultFormat: "time_series"
        },
        {
          refId: "WriteQueue",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "/^(?!FTG_).*${server:regex}.*/" },
          item: { filter: "/0 C:: Average disk write queue length/" },
          resultFormat: "time_series"
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 5: LATENCIA Y SERVICIOS CRITICOS (y: 37, h: 7)
    // -------------------------------------------------------------
    {
      id: 17,
      title: "Latencia de E/S de Disco (Avg sec/Read & sec/Write en ms)",
      type: "timeseries",
      gridPos: { x: 0, y: 37, w: 12, h: 7 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          unit: "s",
          custom: {
            drawStyle: "line",
            lineInterpolation: "smooth",
            lineWidth: 2,
            fillOpacity: 10
          }
        }
      },
      options: {
        legend: { displayMode: "table", placement: "bottom", calcs: ["lastNotNull", "max"] }
      },
      targets: [
        {
          refId: "ReadLatency",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "/^(?!FTG_).*${server:regex}.*/" },
          item: { filter: "/0 C:: Disk read request avg waiting time/" },
          resultFormat: "time_series"
        },
        {
          refId: "WriteLatency",
          schema: 12,
          queryType: "0",
          group: { filter: "/.*/" },
          host: { filter: "/^(?!FTG_).*${server:regex}.*/" },
          item: { filter: "/0 C:: Disk write request avg waiting time/" },
          resultFormat: "time_series"
        }
      ]
    },
    {
      id: 14,
      title: "Salud de Servicios Críticos (NTDS, DNS, KDC, Netlogon, DFSR, W32Time, SQL)",
      type: "stat",
      gridPos: { x: 12, y: 37, w: 12, h: 7 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      fieldConfig: {
        defaults: {
          mappings: [
            {
              type: "value",
              options: {
                "0": { text: "RUNNING", color: "#73BF69" },
                "1": { text: "PAUSED", color: "#FFC859" },
                "6": { text: "STOPPED", color: "#E45959" }
              }
            }
          ],
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
        reduceOptions: { calcs: ["lastNotNull"], values: false },
        colorMode: "background",
        graphMode: "none",
        orientation: "auto",
        textMode: "value_and_name"
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "0",
          group: { filter: "/(Windows_Server|Linux servers|AD|Applications|File_server|Backup_Server)/" },
          host: { filter: "/^(?!FTG_).*${server:regex}.*/" },
          item: { filter: "/State of service .*(\"NTDS\"|\"DNS\"|\"Kdc\"|\"Netlogon\"|\"DFSR\"|\"W32Time\"|\"MSSQLSERVER\").*/" },
          resultFormat: "time_series",
          options: { showDisabledItems: false }
        }
      ]
    },

    // -------------------------------------------------------------
    // ROW 6: INCIDENT COMMAND CENTER (y: 44, h: 8)
    // -------------------------------------------------------------
    {
      id: 15,
      title: "Incident Command Center: Alarmas e Incidentes Activos en Servidores (Zabbix Triggers)",
      type: "table",
      gridPos: { x: 0, y: 44, w: 24, h: 8 },
      datasource: { type: DATASOURCE_TYPE, uid: DATASOURCE_UID },
      options: {
        showHeader: true
      },
      targets: [
        {
          refId: "A",
          schema: 12,
          queryType: "4",
          mode: 4,
          group: { filter: "/.*/" },
          host: { filter: "/${server:regex}/" },
          showProblems: "problems",
          options: {
            acknowledged: 2,
            minSeverity: 2,
            hostsInMaintenance: false
          }
        }
      ]
    }
  ]
};

// 1. Guardar copia local de respaldo y versionado
const outputPath = path.resolve(__dirname, '../.zabbix_context/dashboards/milicic-servers-overview.json');
fs.writeFileSync(outputPath, JSON.stringify(dashboard, null, 2), 'utf8');
console.log(`Copia local guardada en ${outputPath}`);
console.log(`Paneles configurados: ${dashboard.panels.length}`);

// 2. Obtener Token de Grafana
let grafanaToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!grafanaToken) {
  try {
    grafanaToken = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
  } catch (e) {
    console.error('Error al obtener token de variable de entorno:', e.message);
  }
}

if (!grafanaToken) {
  console.error('ERROR: No se encontró GRAFANA_SERVICE_ACCOUNT_TOKEN en el entorno.');
  process.exit(1);
}

// 3. Desplegar mediante la API de Grafana
const payload = JSON.stringify({
  dashboard,
  folderUid: "milicic-observability",
  overwrite: true
});

console.log(`Desplegando en Grafana (http://172.27.210.154:3005) en carpeta "Milicic Observabilidad"...`);

const req = http.request('http://172.27.210.154:3005/api/dashboards/db', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${grafanaToken}`,
    'Content-Length': Buffer.byteLength(payload)
  }
}, res => {
  let b = '';
  res.on('data', d => b += d);
  res.on('end', () => {
    console.log('HTTP Status:', res.statusCode);
    try {
      const parsed = JSON.parse(b);
      console.log('Respuesta de Grafana API:', JSON.stringify(parsed, null, 2));
      if (parsed.status === 'success') {
        console.log(`\n¡DASHBOARD DESPLEGADO CON ÉXITO!`);
        console.log(`URL: http://172.27.210.154:3005${parsed.url}`);
        console.log(`UID: ${parsed.uid}`);
      } else {
        console.error('Fallo en el despliegue:', b);
        process.exit(1);
      }
    } catch (e) {
      console.log('Respuesta cruda:', b);
    }
  });
});

req.on('error', err => {
  console.error('Error de red al conectar con Grafana:', err);
  process.exit(1);
});

req.write(payload);
req.end();
