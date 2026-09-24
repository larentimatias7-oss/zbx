# Inventario de Dashboards Grafana — Milicic S.A.

- **Plataforma:** Grafana v11.5.2 en Dokploy (`http://172.27.210.154:3005`)
- **Datasource Principal:** `alexanderzobnin-zabbix-datasource` (UID: `efz4nzx8r30g0c`)
- **Carpeta:** `Milicic Observabilidad` (UID: `milicic-observability`)
- **Última actualización:** 24 de Septiembre de 2026

---

## 1. Plugins Instalados

Configurados en `docker-compose.yml` vía `GF_INSTALL_PLUGINS`:

| Plugin | Tipo | Uso Principal |
| :--- | :--- | :--- |
| `alexanderzobnin-zabbix-app` | Datasource + App | Fuente de datos Zabbix para todos los dashboards |
| `yesoreyeram-infinity-datasource` | Datasource | JSON, CSV, XML, REST APIs externas |
| `marcusolsson-dynamictext-panel` | Panel | HTML/Markdown/Handlebars — tarjetas KPI y tablas formateadas |
| `volkovlabs-table-panel` | Panel | Tablas con sparklines, colores y acciones por celda |
| `grafana-polystat-panel` | Panel | Mosaico hexagonal/cuadrado de estado de hosts/servicios |
| `marcusolsson-treemap-panel` | Panel | Treemap jerárquico (requiere formato tabla con String+Number) |
| `marcusolsson-hourly-heatmap-panel` | Panel | Mapa de calor densidad horaria 24×7 |
| `nline-plotlyjs-panel` | Panel | Gráficos Plotly.js interactivos (scatter, 3D, etc.) |
| `knightss27-weathermap-plugin` | Panel | Mapas de red con links coloreados por utilización |
| `isaozler-paretochart-panel` | Panel | Gráfico Pareto (barras + línea acumulada %) |
| `marcusolsson-sankey-panel` | Panel | Diagrama Sankey (flujos y transferencias) |

---

## 2. Catálogo de Dashboards en Producción

### 🔐 Active Directory & Cyber SOC (V19)
- **UID:** `milicic-activedirectory-soc`
- **Script:** [`build_activedirectory_dashboard.mjs`](file:///c:/zabbix_anti/scripts/build_activedirectory_dashboard.mjs)
- **URL:** `http://172.27.210.154:3005/d/milicic-activedirectory-soc`
- **Hosts monitoreados:** SRO-DCO01 (10699, FSMO), SRO-DCO02 (10701, Secundario), SSJ-DCO01 (10715)
- **Variables Globales:**
  * `$dc`: Selector de controladores de dominio (Multi-select + All).
  * `$forensic_window`: Ventana de tiempo forense desacoplada (`24h`, `7d`, `15d`, `30d`, `60d`).
  * `$search`: Barra de búsqueda dinámica de texto/usuario/ID/host que filtra tablas en tiempo real vía Regex.
- **Paneles clave:**

| ID | Tipo | Título | Nota técnica |
| :- | :--- | :----- | :----------- |
| 1 | stat | Cuentas Bloqueadas (4740) | `queryType: "2"` (Text), `reduceOptions: { calcs: ["count"] }`, `timeFrom: $forensic_window`, `noValue: "0"` |
| 2 | stat | Fallos Pre-Auth Kerberos (4771) | `queryType: "2"` (Text), `reduceOptions: { calcs: ["count"] }`, `timeFrom: $forensic_window`, `noValue: "0"` |
| 3 | stat | Logons Fallidos NTLM (4625) | `queryType: "2"` (Text), `reduceOptions: { calcs: ["count"] }`, `timeFrom: $forensic_window`, `noValue: "0"` |
| 4 | stat | Cambios en Grupos Admin | `queryType: "2"` (Text), `reduceOptions: { calcs: ["count"] }`, `timeFrom: $forensic_window`, `noValue: "0"` |
| 5 | stat | Uptime Controladores | Item: `Uptime` |
| 6 | stat | Incidentes Activos AD DS | `queryType: "5"` (Problems) |
| 10 | **state-timeline** | Matriz Servicios Vitales | Migrado de `status-history` a `state-timeline` con `mergeValues: true` para erradicar el error *Too many points*. 6 targets exactos (NTDS/DNS/KDC/NETLOGON/DFSR/W32TIME). |
| 20 | timeseries | CPU Controladores | Item: `CPU utilization` |
| 21 | timeseries | RAM Controladores | Item: `Memory utilization` |
| 30 | timeseries | Cola de Procesador | Item: `CPU queue length` |
| 32 | timeseries | Context Switches/seg | Item: `Context switches per second` |
| 31 | timeseries | Throughput de Red | Item: `Interface.*Bits (received\|sent)` |
| 35 | timeseries | Colas I/O Disco | Items: `Average disk read/write queue length` |
| 36 | timeseries | Latencia Disco (ms) | Items: `Disk read/write request avg waiting time` |
| 38 | hourly-heatmap | Densidad Horaria Context Switches | 3 targets (uno por DC), `timeFrom: now-7d` |
| 41 | stat | Uso Disco C: por DC | `FS [(C:)]: Space: Used, in %` — `orientation: horizontal`, `colorMode: background` |
| 50 | **table** | Incidentes Activos AD DS | `queryType: "5"`, `extractFields` (JSON), `organize`, severidades coloreadas y Data Links a Zabbix. |
| 60 | **table** | Auditoría: Bloqueos de Cuenta (4740) | `queryType: "2"`, `timeFrom: $forensic_window`, inspect/filterable activo, regex search `.*${search:raw}.*`, Data Link a Zabbix History. |
| 61 | **table** | Auditoría: Grupos Privilegiados (4728/4732/4756) | `queryType: "2"`, `timeFrom: $forensic_window`, inspect/filterable activo, regex search `.*${search:raw}.*`, Data Link a Zabbix History. |
| 62 | **table** | Auditoría: Fallos Pre-Auth Kerberos (4771) | `queryType: "2"`, `timeFrom: $forensic_window`, inspect/filterable activo, regex search `.*${search:raw}.*`, Data Link a Zabbix History. |

---

### 💾 Backup & Continuidad (Veeam)
- **UID:** `milicic-backup-veeam` (o `milicic-backup-continuidad`)
- **Script:** [`build_backup_dashboard.mjs`](file:///c:/zabbix_anti/scripts/build_backup_dashboard.mjs)
- **URL:** `http://172.27.210.154:3005/d/milicic-backup-veeam`
- **Panel 40 (Incidentes Activos):** Estandarizado con `queryType: "5"`, transformación `extractFields` (JSON) y `organize`, mapeo de severidad por colores nativos y Data Links directos a Zabbix Problems.

---

### ⚡ Energía & Facilities (UPS)
- **UID:** `milicic-facilities-ups`
- **Script:** [`build_facilities_ups_dashboard.mjs`](file:///c:/zabbix_anti/scripts/build_facilities_ups_dashboard.mjs)
- **URL:** `http://172.27.210.154:3005/d/milicic-facilities-ups`
- **Hosts monitoreados:** UPS Edificio Gris PB, UPS GALPON 01, UPS E02 PA
- **Panel 40 (Incidentes Activos):** Estandarizado con `queryType: "5"`, transformación `extractFields` (JSON) y `organize`, mapeo de severidad por colores nativos y Data Links directos a Zabbix Problems.

---

### 🔥 FortiGate & SD-WAN
- **UID:** `milicic-fortigate-sdwan` (o `milicic-fortigate-wan`)
- **Script:** [`build_fortigate_dashboard.mjs`](file:///c:/zabbix_anti/scripts/build_fortigate_dashboard.mjs)
- **URL:** `http://172.27.210.154:3005/d/milicic-fortigate-sdwan`
- **Panel 50 (Incidentes Activos):** Estandarizado con `queryType: "5"`, transformación `extractFields` (JSON) y `organize`, mapeo de severidad por colores nativos y Data Links directos a Zabbix Problems.

---

### 🌐 Networking: Switches Core y Distribución
- **UID:** `milicic-switches-core`
- **Script:** [`build_switches_dashboard.mjs`](file:///c:/zabbix_anti/scripts/build_switches_dashboard.mjs)
- **URL:** `http://172.27.210.154:3005/d/milicic-switches-core`

---

### 🖥️ Virtualización y Storage: VMware & Datastores
- **UID:** `milicic-vmware-datastores`
- **Script:** [`build_vmware_dashboard.mjs`](file:///c:/zabbix_anti/scripts/build_vmware_dashboard.mjs)
- **URL:** `http://172.27.210.154:3005/d/milicic-vmware-datastores`

---

### 🛡️ Milicic SOC / NOC: Visión Ejecutiva Global
- **UID:** `milicic-soc-overview`
- **Script:** [`build_soc_dashboard.mjs`](file:///c:/zabbix_anti/scripts/build_soc_dashboard.mjs)
- **URL:** `http://172.27.210.154:3005/d/milicic-soc-overview`

---

### ⛰️ San Juan: Monitoreo Integral (SSJ)
- **UID:** `milicic-sanjuan-infra`
- **Script:** [`build_sanjuan_dashboard.mjs`](file:///c:/zabbix_anti/scripts/build_sanjuan_dashboard.mjs)
- **URL:** `http://172.27.210.154:3005/d/milicic-sanjuan-infra`

---

### 🖥️ Servidores & Plataforma
- **UID:** `milicic-servers-overview` (o `milicic-servers-plataforma`)
- **Script:** [`build_servers_dashboard.mjs`](file:///c:/zabbix_anti/scripts/build_servers_dashboard.mjs)
- **URL:** `http://172.27.210.154:3005/d/milicic-servers-overview`

---

### 📡 Aruba Wi-Fi & Switches Instant On
- **UID:** `milicic-aruba-wifi`
- **Script:** [`build_aruba_dashboard.mjs`](file:///c:/zabbix_anti/scripts/build_aruba_dashboard.mjs)
- **URL:** `http://172.27.210.154:3005/d/milicic-aruba-wifi`

---

### 🎨 Galería de Nuevos Plugins
- **UID:** `milicic-nuevos-plugins`
- **Script:** [`build_new_plugins_gallery.mjs`](file:///c:/zabbix_anti/scripts/build_new_plugins_gallery.mjs)
- **URL:** `http://172.27.210.154:3005/d/milicic-nuevos-plugins`

---

## 3. Lecciones y Estándares Críticos de Rendimiento y Renderizado (Grafana + Zabbix)

### 1. `status-history` vs `state-timeline`
- **Problema:** El panel `status-history` calcula celdas discretas de tiempo. Cuando el datasource devuelve más de ~1000 muestras, Grafana falla con el error `Too many points to visualize properly`.
- **Regla Mandatoria:** Para métricas de estado binario/enum (ej. servicios de Windows, estado de puertos), **usar siempre `type: "state-timeline"`** con la opción:
  ```json
  "options": {
    "mergeValues": true,
    "showValue": "never",
    "rowHeight": 0.85
  }
  ```

### 2. Tratamiento de Ítems de Log y Texto (`value_type: 2` y `4`)
- Los ítems de Windows Eventlog o texto libre en Zabbix devuelven 0 data frames si se consultan con `queryType: "0"` (Métricas).
- **Regla Mandatoria:** Configurar siempre:
  ```json
  {
    "queryType": "2",
    "resultFormat": "table"
  }
  ```
- Para tarjetas `stat` de eventos/bloqueos, usar `queryType: "2"` junto con:
  ```json
  "reduceOptions": { "calcs": ["count"], "values": false },
  "noValue": "0"
  ```

### 3. Pipeline Universal para Tablas de Problemas Zabbix (`queryType: "5"`)
- El plugin Zabbix entrega los problemas activos serializados en JSON en una única columna llamada `Problems`.
- **Pipeline de Transformaciones Obligatorio:**
  ```json
  "transformations": [
    {
      "id": "extractFields",
      "options": { "format": "json", "source": "Problems" }
    },
    {
      "id": "organize",
      "options": {
        "excludeByName": { "Problems": true, "Time": true, "Acknowledged": true },
        "renameByName": {
          "Severity": "Severidad",
          "Problem": "Incidente / Disparador",
          "Host": "Host Afectado",
          "Time_1": "Inicio"
        },
        "indexByName": {
          "Severity": 0,
          "Problem": 1,
          "Host": 2,
          "Time_1": 3
        }
      }
    }
  ]
  ```

### 4. Filtrado Dinámico por Regex en Grafana (`filterByValue`)
- El motor de transformaciones de Grafana evalúa las expresiones regulares en JavaScript (V8 en el navegador).
- **Prohibido:** Usar banderas PCRE como `(?i)` en el template variable o transformation. Produce el error fatal `Invalid regular expression: /(?i).*/: Invalid group`.
- **Correcto:** Usar sintaxis JavaScript limpia: `.*${search:raw}.*`.

---

## 4. Variables de Templating Estándar

| Variable | Dashboard | Tipo | Valores | Uso |
| :--- | :--- | :--- | :--- | :--- |
| `$dc` | Active Directory | Query (Host) | `(SRO-DCO01\|SRO-DCO02\|SSJ-DCO01)` / individual | Filtro de host en targets |
| `$forensic_window` | Active Directory | Custom | `24h, 7d, 15d, 30d, 60d` | Ventana temporal independiente para auditoría forense |
| `$search` | Active Directory | Text box | Texto libre | Búsqueda interactiva en tablas forenses |
| `$site` | San Juan, SOC | Custom | `SRO` / `SSJ` / `ALL` | Filtro por sede geográfica |
| `$host` | Servidores, VMware | Query (Host) | Todos los hosts del grupo | Selector dinámico |

---

*Documento actualizado y verificado en producción — 24/09/2026*
