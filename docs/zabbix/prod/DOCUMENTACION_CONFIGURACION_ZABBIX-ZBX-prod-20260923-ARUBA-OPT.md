# Documentación de Configuración y Auditoría: Zabbix 7.0 LTS & Grafana

- **Identificador de Cambio:** `ZBX-prod-20260923-ARUBA-OPT`
- **Entorno:** Producción (`prod` - `https://zabbix.mlccnet.local/`)
- **Versión de Zabbix Server:** 7.0.22 LTS
- **Servidor MCP Zabbix:** initMAX Zabbix MCP Server (`http://127.0.0.1:8080/mcp`)
- **Endpoint Web Grafana:** `http://172.27.210.154:3005` (Dokploy en `172.27.210.154`)
- **Token de Acceso MCP / Grafana:** `***REDACTED***`
- **Fecha de Ejecución:** 23 de Septiembre de 2026
- **Zona Horaria:** `America/Argentina/Buenos_Aires` (ART UTC-3)
- **Rol:** Especialista en Observabilidad Zabbix & Grafana (Antigravity SRE)
- **Estado Global:** **APLICADO Y VALIDADO EN PRODUCCIÓN**

---

## 1. Resumen Ejecutivo de la Operación

La infraestructura inalámbrica (14 Puntos de Acceso) y de acceso switching (2 Switches Aruba Instant On 1930) de Milicic presentaba degradación de monitoreo, 42+ ítems no soportados y alertas recurrentes de enlace caído en el NOC debido a la asociación histórica de una plantilla no apta (`HP Enterprise Switch by SNMP` - ID `10250`, diseñada para chasis modulares ProCurve).

### Fases Implementadas:

1. **Fase 1: Saneamiento de Plantillas y Erradicación de Falsas Alarmas**
   - Desvinculación con purga (`templates_clear`) de la plantilla `10250` en los 16 dispositivos.
   - Creación y asignación de la plantilla nativa `Aruba Instant AP by SNMP` (ID `10818`) sobre los 14 APs.
   - Desactivación del prototype trigger `Interface {#IFNAME}: Link down` (ID `36393`, `status: 1`) para silenciar falsas alarmas del puerto auxiliar `eth1` (desconectado por diseño).
   - Asignación de la plantilla `Aruba Instant On 1930 Switch by SNMP` (ID `10826`) con telemetría de CPU (`1.3.6.1.4.1.11.2.1.8.0`) y consumo PoE (`1.3.6.1.2.1.105.1.3.1.1.2.1`) en los switches `10724` (`CORE03`) y `10726` (`D03`).

2. **Fase 2: Ajuste de Preprocesamiento Regex para Hardware y Firmware**
   - Se ajustó el preprocesamiento de los ítems dependientes `Hardware model name` (`98380`) y `Firmware version` (`98381`) en la plantilla `10818` para soportar simultáneamente la sintaxis de los APs AOS-8 y de los switches Instant On 1930.
   - **Modelo:** `(?:\\bMODEL:\\s*|\\b)(JL\\w+|\\d{3})\\b` $\rightarrow$ Captura `515`, `635`, `JL681A` y `JL686A`.
   - **Firmware:** `(?:\\bVersion\\s*|\\bInstantOn_1930_)([^\\$,\\n]+)` $\rightarrow$ Captura `8.13.3.0-8.13.3.0 LSR`, `1.0.1.0 (116)` y `3.3.2.0 (5)`.
   - Se forzó la actualización mediante tareas de diagnóstico de Zabbix Server (`task_create`, tipo 6), logrando **0 ítems no soportados** en estos componentes.

3. **Fase 3: Construcción y Despliegue de Dashboard en Grafana Dokploy**
   - Se diseñó el tablero oficial [`aruba-wifi-switching-overview.json`](file:///c:/zabbix_anti/.zabbix_context/dashboards/aruba-wifi-switching-overview.json) bajo el estándar `grafana-milicic-standards`.
   - Se desplegó mediante API REST en Grafana (`http://172.27.210.154:3005`), alojado en la carpeta `Milicic Observabilidad` (UID: `milicic-observability`).
   - UID del Dashboard: `milicic-aruba-wifi-switches`.

---

## 2. Inventario de Objetos Afectados y Modificados

### A. Plantillas Zabbix
| Template ID | Nombre del Template | Modificaciones Realizadas | Estado |
| :---: | :--- | :--- | :---: |
| `10818` | **Aruba Instant AP by SNMP** | Regex unificado en `system.hw.model` y `system.hw.firmware`. Trigger prototype link-down deshabilitado. | **Activo / OK** |
| `10826` | **Aruba Instant On 1930 Switch by SNMP** | Hereda de 10818. Incorpora CPU switch y consumo total PoE con trigger >90% 5m. | **Activo / OK** |

### B. Switches Aruba Instant On 1930
| Host ID | Nombre Host | Modelo | IP Gestión | Firmware Detectado | Estado Ítems |
| :---: | :--- | :---: | :---: | :---: | :---: |
| `10724` | **SRO-E02-PB00-CORE03** | `JL686A` (48G PoE) | `192.168.0.211` | `1.0.1.0 (116)` | **100% Soportados** |
| `10726` | **SRO-E03-P00-D03** | `JL681A` (8G PoE) | `192.168.0.190` | `3.3.2.0 (5)` | **100% Soportados** |

### C. Puntos de Acceso Wi-Fi (Host Group: `ARUBA APs`, Group ID: `45`)
| Host ID | Nombre en Zabbix | IP Gestión | Modelo Detectado | Firmware Detectado | Ping ICMP | SNMP |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| `10804` | **AP Of. SAP** (Master VC) | `172.30.70.21` | `515` | `8.13.3.0-8.13.3.0 LSR` | OK (1) | OK (1) |
| `10805` | **AP Of. CAS** | `172.30.70.23` | `515` | `8.13.3.0-8.13.3.0 LSR` | OK (1) | OK (1) |
| `10806` | **AP Ger. Compras** | `172.30.70.22` | `515` | `8.13.3.0-8.13.3.0 LSR` | OK (1) | OK (1) |
| `10807` | **AP COMEDOR EG** | `172.30.70.25` | `515` | `8.13.3.0-8.13.3.0 LSR` | OK (1) | OK (1) |
| `10808` | **AP AIMI** | `172.30.70.28` | `515` | `8.13.3.0-8.13.3.0 LSR` | OK (1) | OK (1) |
| `10809` | **AP Of. Licitaciones** | `172.30.70.26` | `515` | `8.13.3.0-8.13.3.0 LSR` | OK (1) | OK (1) |
| `10810` | **AP Of Licitaciones Puerta** | `172.30.70.27` | `515` | `8.13.3.0-8.13.3.0 LSR` | OK (1) | OK (1) |
| `10811` | **AP Administración** | `172.30.71.13` | - | - | OK (1) | *Timeout* |
| `10812` | **AP RECEPCION** | `172.30.71.14` | `635` | `8.13.1.1-8.13.1.1 LSR` | OK (1) | OK (1) |
| `10813` | **AP DIRECTORIO** | `172.30.71.11` | - | - | OK (1) | *Timeout* |
| `10814` | **AP GERENCIAS** | `172.30.71.12` | - | - | OK (1) | *Timeout* |
| `10815` | **AP ABASTECIMIENTO** | `172.30.70.29` | `515` | `8.13.3.0-8.13.3.0 LSR` | OK (1) | OK (1) |
| `10816` | **AP PAÑOL** | `172.30.70.30` | `515` | `8.13.3.0-8.13.3.0 LSR` | OK (1) | OK (1) |
| `10817` | **AP RRHH** | `172.30.70.31` | `515` | `8.13.3.0-8.13.3.0 LSR` | OK (1) | OK (1) |

> [!NOTE]
> Los APs `10811`, `10813` y `10814` responden al 100% de los pings ICMP pero reportan timeout SNMP local. El AP `10812` en la misma subred (`172.30.71.14`) responde SNMP correctamente, confirmando que no existe bloqueo de red perimetral o firewall hacia la VLAN 71.

---

## 3. Arquitectura del Dashboard Grafana

- **Nombre:** `Networking: Infraestructura Wi-Fi Aruba Instant & Switches 1930`
- **UID:** `milicic-aruba-wifi-switches`
- **Carpeta:** `Milicic Observabilidad` (`milicic-observability`)
- **URL Directa:** [`http://172.27.210.154:3005/d/milicic-aruba-wifi-switches/2b0aa38`](http://172.27.210.154:3005/d/milicic-aruba-wifi-switches/2b0aa38)
- **Datasource:** `alexanderzobnin-zabbix-datasource` (UID: `efz4nzx8r30g0c`)
- **Variable de Templating:**
  * `$AP`: Query dinámico que lista los 14 APs del grupo `ARUBA APs`, con opción *All* (`.*`).

### Distribución de Paneles (Grid 24 col):

```
+---------------------------------------------------------------------------------------------------+
| Panel 1: Matriz de Salud y Conectividad ICMP - 14 Puntos de Acceso (Stat Panel - w:24, h:4)       |
+-------------------------------------------------+-------------------------------------------------+
| Panel 2: Tráfico Uplink Ethernet eth0 ($AP)     | Panel 3: Distribución RF 5 GHz vs 2.4 GHz ($AP) |
| (Time Series - w:12, h:8)                       | (Stacked Time Series - w:12, h:8)               |
+------------------------+------------------------+-------------------------------------------------+
| Panel 4: Consumo PoE   | Panel 5: CPU Switches  | Panel 6: Uptime Switches 1930                   |
| (Gauge - w:8, h:6)     | (Time Series - w:8, h:6)| (Stat - w:8, h:6)                              |
+------------------------+------------------------+-------------------------------------------------+
| Panel 7: Inventario Consolidado APs (Modelo, Firmware, Uptime) (Table Panel - w:24, h:8)           |
+---------------------------------------------------------------------------------------------------+
```

---

## 4. Procedimiento de Rollback (Reversión)

Si fuese necesario restablecer los valores previos de preprocesamiento en el template `10818`:
1. Ejecutar actualización en Zabbix API:
   - `itemid: 98380` $\rightarrow$ `params: "MODEL: ([^,\\)]+)\n\\1"`
   - `itemid: 98381` $\rightarrow$ `params: "Version (.*)\n\\1"`
2. El dashboard en Grafana puede eliminarse o actualizarse mediante `scripts/deploy_aruba_dashboard.mjs`.
