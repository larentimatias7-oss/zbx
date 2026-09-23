---
name: zabbix-dashboard-architect
description: >-
  Estándar de diseño, construcción y despliegue de Dashboards en Zabbix 7.0 LTS para Milicic S.A.
  Define el grid de 24 columnas, tipos de widgets preferidos, métricas core por servicio, paleta de colores
  por severidad y el checklist pre-flight obligatorio vía MCP para evitar tableros rotos.
version: 2.0.0
type: visualization-expert
---

# Zabbix Dashboard Architect - Estándar Milicic (Zabbix 7.0 LTS)

Esta skill establece las directivas técnicas, convenciones corporativas y procedimientos de validación previa requeridos para diseñar y desplegar Dashboards en el entorno de producción de **Milicic S.A.** vía initMAX Zabbix MCP Server (`http://127.0.0.1:8080/mcp`).

---

## 1. Convenciones de Nombres y Estándares Milicic

Al crear tableros agrupados por servicio o sede, utilizar siempre las convenciones aprobadas:

### A. Nomenclatura de Hosts
- **Formato:** `<SEDE>-<TIPO>-<IDENTIFICADOR>`
  - Sedes: `SRO` (Rosario), `SSJ` (San Juan), `SER` (Sede Entre Ríos), `AR-###` (Campamentos/Obras).
  - Ejemplos: `SRO-E02-PB00-CORE01`, `SRO-G01-P100-DIS01`, `SRO-SQL01`, `SSJ-HPV01`, `FTG_milicic_border1_HTTP`.

### B. Grupos de Hosts Canónicos (*Host Groups*)
- **Networking:** `Core_Switches`, `Distribution_Switches`, `Access_Switches`, `Firewall`.
- **Plataforma:** `Windows_Server`, `Linux_Server`, `Virtualization`, `Bases_de_Datos`, `UPS`.
- **Geográficos:** `Rosario`, `San Juan`, `Sucursales`.

### C. Plantillas Oficiales Asociadas
- Switches: `Dell N-Series by SNMP` (10721), `HP Comware HH3C by SNMP` (10227).
- Firewalls: `FortiGate by SNMP` (10604), `FortiGate by HTTP` (10603).
- Servidores: `Windows by Zabbix agent 2`, `Linux by Zabbix agent`.
- Energía: `Template Network Generic Device by SNMP` / Plantillas fabricante UPS.

### D. Filtrado por Tags Operacionales (*Tag-Driven Dashboards*)
Evitar asociar widgets a IDs estáticos salvo que sea indispensable. Usar los tags corporativos:
- `team`: `redes` | `plataforma` | `dba`
- `tier`: `core` | `access` | `perimeter` | `service` | `virtualization` | `facilities`
- `component`: `switch` | `server` | `firewall` | `ups` | `database`
- `scope`: `capacity` | `notice` | `performance` | `availability`

---

## 2. Tipos de Widget Preferidos y Layout Estándar (Grid 24 Columnas)

El grid de Zabbix 7.0 tiene un ancho fijo de **24 columnas** (`x`: 0 a 23).

### Widgets Preferidos en Producción:
1. **`problems` (Lista / Contador de Problemas):** Para resumen de incidentes.
   - Parámetros clave: `show_suppressed = 0` (ocultar incidentes en mantenimiento), severidades >= `Average` (3).
2. **`svggraph` (Gráficos Vectoriales de Telemetría):** Para métricas temporales (CPU, RAM, tráfico).
   - Rango por defecto: `now-1h` o `now-3h` para monitoreo en vivo; `now-24h` para vistas ejecutivas.
3. **`item` (Single Item Value):** Para KPIs numéricos y estados binarios con formato destacado y color condicional.
4. **`svghst` / `map` (Mapa de Red SVG):** Para topología física (ej. Mapa 11 `NOC Infraestructura` o submapas).
5. **`honeycomb` / `hostnavigator` (Salud Global):** Para visualización rápida de grandes parques de hosts o interfaces.

### Arquitectura de Layout Estándar (Página Típica):
```
Fila 0 (y=0, h=4):   [ KPI 1 (w=4) ] [ KPI 2 (w=4) ] [ KPI 3 (w=4) ] [ KPI 4 (w=4) ] [ Problems Count (w=8) ]
Fila 1 (y=4, h=8):   [ Topología / Mapa / Problems List (w=10) ]   [ SVG Graph Core 1 (w=7) ] [ SVG Graph Core 2 (w=7) ]
Fila 2 (y=12, h=6):  [ SVG Graph Detalle A (w=8) ] [ SVG Graph Detalle B (w=8) ] [ SVG Graph Detalle C (w=8) ]
```
> [!IMPORTANT]
> La suma de los anchos (`width`) de los widgets en una misma fila no debe superar 24 columnas, y no debe haber superposición de coordenadas `x`, `y`.

---

## 3. Mapeo de Severidades → Color y Prioridad

Al configurar widgets de problemas o umbrales en gráficos/valores:

| Nivel | Severidad Zabbix | Color Hex | Prioridad Operativa | Comportamiento en Dashboard |
| :---: | :--- | :---: | :--- | :--- |
| **5** | **Disaster** | `#E45959` | Crítico P1 Inmediato | Destacado en rojo fuerte; requiere atención inmediata. |
| **4** | **High** | `#E97659` | Grave P1 Inmediato | Alarma de alta prioridad; enlaces caídos o servicios caídos. |
| **3** | **Average** | `#FFA059` | Operativo P2 (10 min) | Naranja estándar; saturaciones, degradación o redundancias. |
| **2** | **Warning** | `#FFC859` | Preventivo P3 (30 min) | Amarillo; advertencias de capacidad (>80%), drift de NTP. |
| **1** | **Information** | `#7499FF` | Notificación | Azul; notas informativas o cambios planificados. |
| **0** | **Not classified** | `#97AAB3` | Sin clasificar | Gris neutro. |

---

## 4. Métricas "Core" por Tipo de Servicio y Rango Temporal

### Rango Temporal por Defecto:
- **Monitoreo NOC / Operativo:** `now-1h` o `now-3h` (resolución por minutos).
- **Tablero Ejecutivo / Capacidad:** `now-24h` o `now-7d`.

### Métricas Core Obligatorias:
- **Switches y Core de Red:**
  * Tráfico de interfaces troncales: `net.if.in[ifHCInOctets.*]` y `net.if.out[ifHCOutOctets.*]` (unidades bps).
  * Estado operativo de enlace: `net.if.status[ifOperStatus.*]` (1=up, 2=down).
  * Descartes y errores: `net.if.in.discards[*]`, `net.if.out.errors[*]`.
  * Salud del equipo: `system.cpu.util[*]`, temperatura `MODULE LEVEL1`.
- **Servidores Windows:**
  * CPU: `system.cpu.util`.
  * Memoria: `vm.memory.util`.
  * Espacio en disco: `vfs.fs.dependent.size[*,pused]`.
  * Servicios críticos: AD, DNS, SQL Server.
- **Servidores Linux / Docker:**
  * CPU: `system.cpu.util`.
  * Memoria disponible: `vm.memory.size[pavailable]`.
  * Almacenamiento: Uso de partición raíz `/` y `/var/lib/docker`.
- **Firewalls FortiGate:**
  * Sesiones concurrentes activas y CPU/memoria del appliance.
  * Estado y latencia de túneles IPsec VPN hacia sucursales (San Juan, campamentos).
  * Enlaces SD-WAN: Jitter, packet loss y latencia por ISP underlay.
- **UPS y Energía:**
  * Tensión de entrada y salida, carga % (`upsOutputPercentLoad`).
  * Autonomía estimada de batería (`upsBatteryEstimatedMinutesRemaining`).
  * Disponibilidad de recolección SNMP (`zabbix[host,snmp,available]`).
- **Virtualización (VMware Cluster-HA):**
  * Uso de CPU y memoria de ESXi hosts (`172.30.70.131`, `172.30.70.132`).
  * Capacidad y porcentaje libre de datastores (`Datastore_R5_HDD`, `Datastore_R5_SSD`).

---

## 5. Checklist de Verificación Pre-Flight (MANDATORIO)

Para evitar dashboards rotos o widgets vacíos con IDs huérfanos:

```markdown
### Pre-Flight Dashboard Verification Checklist
- [ ] 1. Identificar hosts objetivo con `host_get` (confirmar `hostid`, `name`, `status=0`).
- [ ] 2. Validar que cada ítem referenciado exista realmente usando `item_get` (confirmar `itemid`, `key_`, `status=0`, `state=0`).
- [ ] 3. Si se referencia un mapa SVG, verificar su existencia con `map_get` (ej. confirmar `sysmapid`).
- [ ] 4. Comprobar que los tags usados en filtros existen en disparadores o hosts mediante `trigger_get` o `host_get`.
- [ ] 5. Si se actualiza un dashboard existente, volcar un backup completo en `.zabbix_context/dashboards/backup_<id>.json`.
- [ ] 6. Verificar que la suma de anchos por fila no exceda 24 y que no haya colisiones de coordenadas `x`, `y`.
- [ ] 7. Ejecutar `dashboard_create` o `dashboard_update` a través del MCP y verificar el `dashboardid` devuelto.
```
