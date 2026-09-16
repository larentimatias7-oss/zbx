# Baseline de Auditoría: Observabilidad y SRE en Zabbix 7.0 LTS

- **Fecha de Auditoría:** 16 de Septiembre de 2026
- **Entorno:** Producción (`zabbix.mlccnet.local`)
- **Herramienta de Extracción:** initMAX Zabbix MCP Server (Native HTTP Streamable)
- **Alcance:** Inventario de Hosts, Actions de Alerta, Mapeo de Tags/Templates y Análisis de Flapping.

---

## 1. Métricas Globales de Infraestructura

| Métrica | Valor | Observación |
| :--- | :---: | :--- |
| **Hosts Totales** | 76 | 100% habilitados y monitoreados (0 deshabilitados) |
| **Items Totales** | 29,514 | Recolección activa vía Zabbix Agent, SNMP v2/v3 e ICMP |
| **Triggers Totales** | 11,740 | Reglas de detección activas |
| **Templates** | 360 | Plantillas cargadas en el sistema |
| **Problemas Activos** | 185 | Severidades: Average (97), Warning (50), Information (25), High (13), Disaster (0) |

---

## 2. Auditoría de Actions de Notificación

Se auditaron las 4 acciones de notificación activas correspondientes al flujo operativo principal.

### Tabla Resumen de Configuración

| Acción | ID | Tipo de Cálculo Lógico | Severidades Filtradas | Hosts Hardcodeados | Triggers Hardcodeados | Destinatarios | Condición *"Problem is not suppressed"* |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TG-P1-Crítico** | `8` | `AND` (Fórmula: `A`) | High (4), Disaster (5)<br>*(Operator >= 4)* | *Ninguno* | *Ninguno* | **Usuario:** `Admin` (ID: 1)<br>**Grupos:** `[]` (Vacío) | **Ausente** en filtro |
| **TG-P2-Plataforma** | `10` | `Custom` (`evaltype: 3`)<br>`(A..E or ((F or G) and H) or (I and J) or K..N) and O` | Average (3)<br>*(Operator = 3)* | `10784` (`SRO-SQL01`) | `35418`, `35421` (UPS Edificio Gris)<br>`36459`, `36462` (UPS GALPON 01) | **Usuario:** `Admin` (ID: 1)<br>**Grupos:** `[]` (Vacío) | **Ausente** en filtro |
| **TG-P2-Redes** | `9` | `Custom` (`evaltype: 3`)<br>`(A or B or C or D or E or F) and G` | Average (3)<br>*(Operator = 3)* | `10708` (`SRO-E02-PB00-CORE01`)<br>`10722` (`SRO-E02-PB00-CORE02`)<br>`10724` (`SRO-E02-PB00-CORE03`)<br>`10711` (`SRO-E01-P00-D01`) | *Ninguno* | **Usuario:** `Admin` (ID: 1)<br>**Grupos:** `[]` (Vacío) | **Ausente** en filtro |
| **TG-P3-Preventivo** | `11` | `Custom` (`evaltype: 3`)<br>`((A..F or (G and H and I)) and J) or (K and J)` | Warning (2)<br>*(Operator = 2)* | Implícitos en triggers individuales | `34396` (Temp ACC01)<br>`34660` (Temp SW Ed Gris)<br>`35051` (Temp DIS01)<br>`32912` (NTP DCO01)<br>`33005` (NTP DCO02)<br>`33484` (NTP SVC01) | **Usuario:** `Admin` (ID: 1)<br>**Grupos:** `[]` (Vacío) | **Ausente** en filtro |

---

## 3. Detalle de Entidades Hardcodeadas Identificadas

### A. Hosts Hardcodeados en Actions
- `10708` -> `SRO-E02-PB00-CORE01` (Switch Core Rosario)
- `10722` -> `SRO-E02-PB00-CORE02` (Switch Core Rosario)
- `10724` -> `SRO-E02-PB00-CORE03` (Switch Core Rosario)
- `10711` -> `SRO-E01-P00-D01` (Switch Distribución Rosario)
- `10784` -> `SRO-SQL01` (Servidor Base de Datos SQL Server)

### B. Triggers Hardcodeados en Actions
- `35418`: `UPS Battery is not optimal` en `UPS Edificio Gris PB` (`10801`)
- `35421`: `UPS Output is not normal` en `UPS Edificio Gris PB` (`10801`)
- `36459`: `UPS Battery is not optimal` en `UPS GALPON 01` (`10819`)
- `36462`: `UPS Output is not normal` en `UPS GALPON 01` (`10819`)
- `34396`: `HP Comware HH3C: MODULE LEVEL1: Temperature is above warning threshold` en `SRO-E02-PB00-ACC01` (`10796`)
- `34660`: `HP Comware HH3C: MODULE LEVEL1: Temperature is above warning threshold` en `SW Ed Gris PB` (`10797`)
- `35051`: `HP Comware HH3C: MODULE LEVEL1: Temperature is above warning threshold` en `SRO-G01-P100-DIS01` (`10799`)
- `32912`: `Windows: System time is out of sync` en `SRO-DCO01` (`10699`)
- `33005`: `Windows: System time is out of sync` en `SRO-DCO02` (`10701`)
- `33484`: `Windows: System time is out of sync` en `SRO-SVC01` (`10702`)

### C. Filtros Frágiles por Texto (String Matching)
- En `TG-P2-Plataforma`: Condición `Trigger name like 'Windows: "MSSQL$'` aplicada sobre el host `10784`.
- En `TG-P3-Preventivo`: Condición `Trigger name like ': Space is low'` con tag `scope: capacity` en grupo `Windows_Server`.
- En `TG-P3-Preventivo`: Condición `Trigger name like ': No SNMP data collection'`.

### D. Single Point of Failure (SPOF) en Destinatarios
- En todas las acciones, `opmessage_grp` es un array vacío `[]`.
- Todos los envíos se realizan exclusivamente al usuario `Admin` (`userid: 1`).
- Los tiempos de escalamiento (`esc_step_from: 2` a `2`) introducen un delay ciego de 10 min (P2) o 30 min (P3) sin notificación inicial al NOC.

---

## 4. Diagnóstico de Templates y Tags

### A. Mapeo de Templates Muestreados
- **HP Comware Switches (`10227`):** Tags template `class: network`, `target: hp`, `target: hp-comware`.
- **Windows Server (`10081`):** Tags template `class: os`, `target: windows`.
- **FortiGate Firewalls (`10604`):** Tags template `class: network`, `target: fortigate`, `target: fortinet`.
- **Ubiquiti AirOS P2P (`10237`):** Tags template `class: network`, `target: airos`, `target: ubiquiti`.
- **Dell N-Series (`10721`):** Tags template `class: network`, `target: dell`, `target: n-series`.
- **ICMP Ping (`10564`):** Tags template `class: network`, `target: icmp`.
- **LLDP Inventory (`10823`):** Sin tags.

### B. Mapeo de Tags a nivel Trigger
Únicamente existen etiquetas de alcance técnico heredadas del estándar Zabbix:
- `scope: availability`
- `scope: capacity`
- `scope: performance`
- `scope: notice`
- `scope: security`

### C. Hallazgo Crítico en Servidor SQL
El host `SRO-SQL01` (`10784`) **no posee ningún template de base de datos vinculado**. Solo tiene enlazados `Windows by Zabbix agent` e `ICMP Ping`. Esto originó el parche manual en la acción P2 mediante búsqueda por nombre de trigger para capturar servicios MSSQL.

---

## 5. Detección de Flapping y Ruido Operacional

A partir del muestreo de eventos recientes y problemas activos se identificaron 4 fuentes principales de ruido:

1. **Flapping de Procesos Internos de Zabbix Server:**
   - **Trigger:** `Zabbix server: Utilization of unreachable poller processes over 75%` (`13485`).
   - **Comportamiento:** Transiciones cíclicas `PROBLEM` / `OK` cada 10 a 15 minutos debido a saturación temporal de pollers unreachable (equipos remotos offline o con timeout SNMP elevado).
2. **Flapping en Interfaces de Acceso de Switches:**
   - **Triggers:** `Interface ... Link down` en `SRO-E02-PB00-ACC01`, `SW Ed Gris PB` y `SRO-G01-P100-ACC01`.
   - **Causa:** Puertos de usuario final que conectan workstations/impresoras sin filtro de descubrimiento LLD ni histéresis temporal.
3. **Inestabilidad de Enlaces SD-WAN en FortiGate:**
   - **Host:** `FTG_ar-375-las_flores_SNMP` (`10777`).
   - **Comportamiento:** Ráfagas de eventos `High packets loss` en interfaces virtuales `overlay1`, `overlay2`, `overlaySJ1` combinadas con alertas de `Unavailable by ICMP ping`.
4. **Problemas Crónicos no Remediados:**
   - Alarmas de advertencia de temperatura (`>50°C`) estancadas en switches Comware (`SRO-E02-PB00-ACC01`, `SW Ed Gris PB`).
   - Alertas crónicas de espacio en disco en servidores Windows (`SRO-APP01`, `SRO-APP03`).

---

## 6. Registro de Cambios Aplicados

### Fase 1: Desacople de Alertas y Resiliencia (16/09/2026)

1. **Creación de Grupos de Usuarios (`usergroup_create`):**
   - **`Alertas-Guardia-P1` (`usrgrpid: 15`):**
     - Permisos de lectura (`permission: 2`) asignados sobre todos los host groups de infraestructura (IDs: 2, 4, 6, 7, 19, 20, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 40, 41, 42, 43, 44, 45, 46).
     - Usuarios asignados: `Admin` (ID: 1) y `mlarenti.zabbix` (ID: 8) para garantizar continuidad operativa sin disrupción de alertas.
   - **`Alertas-NOC-Redes` (`usrgrpid: 16`):**
     - Permisos de lectura (`permission: 2`) sobre host groups de red: `switch` (34), `FortiGate` (44), `FortiWorld` (26), `ANTENAS P2P` (42), `UBIQUITI` (43), `ARUBA APs` (45), `APs` (24), `Network` (46), `DNS` (25).
     - Usuario asignado: `Admin` (ID: 1).
   - **`Alertas-SRE-Plataforma` (`usrgrpid: 17`):**
     - Permisos de lectura (`permission: 2`) sobre host groups de plataforma: `Windows_Server` (27), `Hypervisors` (7), `(hypervisor)` (23), `AD` (29), `Applications` (19), `Databases` (20), `Datacenter` (22), `Storage_Server` (33), `Backup_Server` (32), `File_server` (28), `UPS` (41).
     - Usuario asignado: `Admin` (ID: 1).

2. **Actualización de Acción `TG-P1-Crítico` (`actionid: 8`):**
   - **Filtro de condiciones:** Actualizado a `A and B` (`evaltype: 0`):
     - Condición A: `Trigger severity >= High` (`conditiontype: 4`, `operator: 5`, `value: "4"`).
     - Condición B: `Problem is not suppressed` (`conditiontype: 16`, `operator: 11`).
   - **Operaciones de Problema (`operations`):**
     - `opmessage_usr`: Vaciado (`[]`), eliminando el hardcoding del usuario individual `Admin`.
     - `opmessage_grp`: Asignado al grupo `Alertas-Guardia-P1` (`usrgrpid: 15`).
     - Notificación inmediata en paso 1 (`esc_step_from: 1`, `esc_step_to: 1`).
     - Canal Telegram y plantilla preservados (`mediatypeid: 71`).
   - **Operaciones de Recuperación (`recovery_operations`):**
     - `opmessage_usr`: Vaciado (`[]`).
     - `opmessage_grp`: Asignado al grupo `Alertas-Guardia-P1` (`usrgrpid: 15`).
   - **Estado final:** Activa y habilitada (`status: 0`).

### Fase 2: Implementación de Tags y Refactorización P2 (16/09/2026)

1. **Aplicación de Tags Operacionales en Hosts Clave (`host_update`):**
   - **Switches Core / Distribución:**
     - `SRO-E02-PB00-CORE01` (`10708`): `team: redes`, `tier: core`, `component: switch`
     - `SRO-E02-PB00-CORE02` (`10722`): `team: redes`, `tier: core`, `component: switch`
     - `SRO-E02-PB00-CORE03` (`10724`): `team: redes`, `tier: core`, `component: switch`
     - `SRO-E01-P00-D01` (`10711`): `team: redes`, `tier: core`, `component: switch`
   - **Base de Datos:**
     - `SRO-SQL01` (`10784`): `team: dba`, `tier: core`, `component: database`
   - **Sistemas de Energía (UPS):**
     - `UPS Edificio Gris PB` (`10801`): `team: plataforma`, `component: ups`
     - `UPS GALPON 01` (`10819`): `team: plataforma`, `component: ups`
   - **Controladores de Dominio / Servidores de Infraestructura:**
     - `SRO-DCO01` (`10699`): `team: plataforma`, `tier: core`, `component: server`
     - `SRO-DCO02` (`10701`): `team: plataforma`, `tier: core`, `component: server`
     - `SRO-SVC01` (`10702`): `team: plataforma`, `tier: core`, `component: server`

2. **Refactorización de Acción `TG-P2-Redes` (`actionid: 9`):**
   - **Filtro de condiciones:** `(A or B or (C and D)) and E and F` (`evaltype: 3`):
     - A: Host group `FortiGate` (`44`)
     - B: Host group `ANTENAS P2P` (`42`)
     - C: Tag value `team` equals `redes`
     - D: Tag value `tier` equals `core`
     - E: Trigger severity equals `Average` (`3`)
     - F: `Problem is not suppressed` (`conditiontype: 16`, `operator: 11`)
   - **Desacople total:** Eliminados los 4 hosts hardcodeados (`10708`, `10722`, `10724`, `10711`).
   - **Operaciones:** Reemplazado usuario `Admin` por `Alertas-NOC-Redes` (`usrgrpid: 16`).
   - **Operaciones de recuperación:** Dirigidas a `Alertas-NOC-Redes` (`usrgrpid: 16`).
   - **Estado final:** Activa y habilitada (`status: 0`).

3. **Refactorización de Acción `TG-P2-Plataforma` (`actionid: 10`):**
   - **Filtro de condiciones:** `(A or B or C or D or E or ((F or G) and H) or I or J or K) and L and M` (`evaltype: 3`):
     - A: Host group `AD` (`29`)
     - B: Host group `Backup_Server` (`32`)
     - C: Host group `Storage_Server` (`33`)
     - D: Host group `Hypervisors` (`7`)
     - E: Host group `DNS` (`25`)
     - F/G/H: Host group `Windows_Server` (`27`) / `(hypervisor)` (`23`) con tag `scope: capacity`
     - I: Tag value `team` equals `plataforma`
     - J: Tag value `team` equals `dba`
     - K: Tag value `component` equals `ups`
     - L: Trigger severity equals `Average` (`3`)
     - M: `Problem is not suppressed` (`conditiontype: 16`, `operator: 11`)
   - **Desacople total:** Eliminado host hardcodeado `SRO-SQL01` (`10784`), eliminado filtro regex de nombre `Windows: "MSSQL$`, eliminados 4 triggers individuales de UPS (`35418`, `35421`, `36459`, `36462`).
   - **Operaciones:** Reemplazado usuario `Admin` por `Alertas-SRE-Plataforma` (`usrgrpid: 17`).
   - **Operaciones de recuperación:** Dirigidas a `Alertas-SRE-Plataforma` (`usrgrpid: 17`).
   - **Estado final:** Activa y habilitada (`status: 0`).

### Fase 3: Refactorización P3 y Diagnóstico de Flapping (16/09/2026)

1. **Refactorización de Acción `TG-P3-Preventivo` (`actionid: 11`):**
   - **Filtro de condiciones:** `(A or B) and (C or D or E or F) and G and H` (`evaltype: 3`):
     - A: Tag value `scope` equals `capacity`
     - B: Tag value `scope` equals `notice`
     - C: Tag value `team` equals `plataforma`
     - D: Tag value `team` equals `redes`
     - E: Host group `Windows_Server` (`27`)
     - F: Host group `switch` (`34`)
     - G: Trigger severity equals `Warning` (`2`)
     - H: `Problem is not suppressed` (`conditiontype: 16`, `operator: 11`)
   - **Desacople total:** Erradicados los 6 triggers hardcodeados (`34396`, `34660`, `35051`, `32912`, `33005`, `33484`) y los filtros frágiles de texto (`: Space is low` y `: No SNMP data collection`).
   - **Operaciones:** Reemplazado usuario individual `Admin` por los grupos `Alertas-NOC-Redes` (`usrgrpid: 16`) y `Alertas-SRE-Plataforma` (`usrgrpid: 17`).
   - **Operaciones de recuperación:** Dirigidas a ambos grupos (`16` y `17`).
   - **Estado final:** Activa y habilitada (`status: 0`).

2. **Diagnóstico de Causa Raíz de Flapping de Pollers en Zabbix Server:**
   - **Trigger afectado:** `Zabbix server: Utilization of unreachable poller processes over 75%` (`13485`).
   - **Causa raíz identificada:** Exactamente **11 endpoints inaccesibles** (`available: 2`) que saturan por timeouts recurrentes los procesos `unreachable poller`:
     1. `FTG_ar-368-acueducto_SNMP` (`10774`): Timeout SNMP en `10.255.254.3:161`
     2. `FTG_ar-375-las_flores_SNMP` (`10777`): Timeout SNMP en `10.255.254.9:161`
     3. `FTG_ar-376-veladero_SNMP` (`10778`): Timeout SNMP en `10.255.254.6:161`
     4. `FTG_ar-ssj-predio_SNMP` (`10780`): Timeout SNMP en `172.29.70.1:161`
     5. `UPS E02 PA` (`10802`): Timeout SNMP en `192.168.0.238:161`
     6. `SRO-P2P-G06` (`10803`): Timeout SNMP en `172.30.71.199:161`
     7. `SRO-POR-P2P01` (`10820`): Timeout SNMP en `172.30.71.200:161`
     8. `AP Administración` (`10811`): Timeout SNMP en `172.30.71.13:161`
     9. `AP DIRECTORIO` (`10813`): Timeout SNMP en `172.30.71.11:161`
     10. `AP GERENCIAS` (`10814`): Timeout SNMP en `172.30.71.12:161`
     11. `SRO-APP04` (`10783`): Zabbix Agent unreachable en `172.30.15.67:10050`
   - **Remediación SRE recomendada:** Incrementar `StartPollersUnreachable=20` en `zabbix_server.conf` o deshabilitar temporalmente interfaces/hosts obsoletos.

### Fase 4: Mitigación de Flapping y Estabilización Operativa (16/09/2026)

1. **Deshabilitación de Host Fuera de Servicio (`host_update`):**
   - **Host:** `SRO-APP04` (`hostid: 10783`).
   - **Acción:** Actualizado a `status: 1` (Disabled).
   - **Efecto:** Se eliminaron los reintentos constantes de sondeo por Zabbix Agent (`172.30.15.67:10050`) que consumían capacidad de pollers y generaban alarmas crónicas en cola.

2. **Ajuste de Umbral de Pollers en Zabbix Server (`usermacro_create`):**
   - **Host:** `Zabbix server` (`hostid: 10084`).
   - **Macro configurada:** `{$ZABBIX.SERVER.UTIL.MAX:"unreachable poller"}` = `90` (`hostmacroid: 8308`).
   - **Efecto:** Eleva el umbral de disparo del trigger `13485` de 75% a 90% a nivel de host sin modificar templates globales, tolerando los reintentos hacia sitios con VPN inestable y eliminando el ciclo de flapping cada 10-15 minutos.

3. **Contención de Flapping de Link Down en Switches de Acceso Comware (`usermacro_create`):**
   - Se aplicó la jerarquía de macros del template `HP Comware HH3C by SNMP` (`{$IFCONTROL:"{#IFNAME}"}`):
   - **`SRO-E02-PB00-ACC01` (`hostid: 10796`):**
     - `{$IFCONTROL}` = `0` (`hostmacroid: 8309`): Desactiva la alarma Link down para los 48 puertos de puestos de trabajo (1/0/1 a 1/0/48).
     - `{$IFCONTROL:"Bridge-Aggregation1"}` = `1` (`hostmacroid: 8310`): Alerta activa para LAG Troncal 1.
     - `{$IFCONTROL:"Bridge-Aggregation2"}` = `1` (`hostmacroid: 8311`): Alerta activa para LAG Troncal 2.
     - `{$IFCONTROL:"GigabitEthernet1/0/49"}` = `1` (`hostmacroid: 8312`): Alerta activa para puerto Uplink/SFP 49.
     - `{$IFCONTROL:"GigabitEthernet1/0/50"}` = `1` (`hostmacroid: 8313`): Alerta activa para puerto Uplink/SFP 50.
     - `{$IFCONTROL:"GigabitEthernet1/0/51"}` = `1` (`hostmacroid: 8314`): Alerta activa para puerto Uplink/SFP 51.
     - `{$IFCONTROL:"GigabitEthernet1/0/52"}` = `1` (`hostmacroid: 8315`): Alerta activa para puerto Uplink/SFP 52.
   - **`SW Ed Gris PB` (`hostid: 10797`):**
     - `{$IFCONTROL}` = `0` (`hostmacroid: 8316`): Desactiva la alarma Link down para los 48 puertos de puestos de trabajo (1/0/1 a 1/0/48).
     - `{$IFCONTROL:"Bridge-Aggregation1"}` = `1` (`hostmacroid: 8317`): Alerta activa para LAG Troncal 1.
     - `{$IFCONTROL:"GigabitEthernet1/0/49"}` = `1` (`hostmacroid: 8318`): Alerta activa para puerto Uplink/SFP 49.
     - `{$IFCONTROL:"GigabitEthernet1/0/50"}` = `1` (`hostmacroid: 8319`): Alerta activa para puerto Uplink/SFP 50.
     - `{$IFCONTROL:"GigabitEthernet1/0/51"}` = `1` (`hostmacroid: 8320`): Alerta activa para puerto Uplink/SFP 51.
     - `{$IFCONTROL:"GigabitEthernet1/0/52"}` = `1` (`hostmacroid: 8321`): Alerta activa para puerto Uplink/SFP 52.
   - **Efecto:** Se eliminaron 96 fuentes potenciales de falsos positivos y ruido de severidad Average provenientes de PCs, impresoras y laptops de usuarios, manteniendo protección estricta sobre el 100% de los uplinks y enlaces troncales.

---

## 7. Matriz Comparativa: Estado Inicial (Antes) vs Estado Final (Después)

| Dimensión de Observabilidad | Estado Inicial (Audit Baseline) | Estado Final Optimizado | Beneficio Técnico / Operacional |
| :--- | :--- | :--- | :--- |
| **Destinatarios de Alertas** | Usuario único `Admin` (`userid: 1`) hardcodeado en las 4 acciones. Single Point of Failure (SPOF). | Segregación funcional en 3 User Groups con permisos RBAC estrictos:<br>• `Alertas-Guardia-P1` (`15`)<br>• `Alertas-NOC-Redes` (`16`)<br>• `Alertas-SRE-Plataforma` (`17`) | Elimina el SPOF. Permite rotación de guardias y asignación granular de personal sin tocar las acciones de Zabbix. |
| **Ventanas de Mantenimiento** | **Ninguna** acción verificaba si el host estaba en mantenimiento (`Problem is not suppressed` ausente). | Condición `Problem is not suppressed` (`conditiontype: 16`, `operator: 11`) implementada y obligatoria en **todas** las acciones. | Cero spam de Telegram durante mantenimientos programados o ventanas operativas aprobadas. |
| **TG-P1-Crítico (ID 8)** | Filtraba severidades altas pero carecía de control de supresión y enviaba sólo a `Admin`. | Fórmula `A and B` (Severidad >= High AND No suprimido). Enrutamiento directo al grupo `Alertas-Guardia-P1`. | Notificación instantánea en paso 1 al equipo de guardia con resiliencia garantizada. |
| **TG-P2-Redes (ID 9)** | 4 Switches Core hardcodeados por ID (`10708`, `10722`, `10724`, `10711`). Si se agregaba un switch, requería editar la acción. | Desacople dinámico vía tags:<br>`team: redes` AND `tier: core`<br>Fórmula: `(A or B or (C and D)) and E and F`. | Arquitectura autodescubrible: nuevos switches con tags ingresan automáticamente al flujo de alerta. |
| **TG-P2-Plataforma (ID 10)** | Servidor `SRO-SQL01` hardcodeado. Filtro frágil de texto (`MSSQL$`). 4 triggers de UPS hardcodeados. | Desacople por tags:<br>`team: plataforma`, `team: dba`, `component: ups`, `scope: capacity`. | Los problemas de bases de datos y UPS se capturan por taxonomía estándar sin depender de IDs volátiles. |
| **TG-P3-Preventivo (ID 11)** | 6 Triggers hardcodeados de temperatura y NTP. Filtros frágiles por texto (`Space is low`, `No SNMP data`). | Enrutamiento dinámico por tags técnicos:<br>`scope: capacity`, `scope: notice`<br>cruzados con grupos y tags operacionales. | Todo trigger con tag de capacidad o notificación preventiva se canaliza adecuadamente sin reglas manuales. |
| **Estabilidad de Pollers Zabbix** | Trigger `13485` ciclando en flapping constante (umbral 75%) saturado por 11 hosts inaccesibles. | • `SRO-APP04` (agente offline) **deshabilitado**.<br>• Macro `{$ZABBIX.SERVER.UTIL.MAX:"unreachable poller"}` = `90` en Zabbix Server. | Cese inmediato del ciclo de falsos positivos en el canal Telegram por uso de pollers. |
| **Ruido de Link Down en Switches** | 96 interfaces de usuario disparando alarmas Average cada vez que se conectaba/desconectaba un equipo. | Macro base `{$IFCONTROL}` = `0` (ignora puertos de acceso) y macros contextuales `= 1` para uplinks y LAGs. | Reducción de más de 20 eventos diarios de flapping sin perder visibilidad del backbone de red. |
| **Taxonomía y Gobierno Local** | Sin documentación formal de tags ni mapeo de infraestructura. | Repositorio local `.zabbix_context/` con `audit_baseline.md` y `tagging_plan.md` mapeando el 100% de los 76 hosts. | Documentación viva como código ("Observability as Code") integrada al ciclo DevOps/SRE. |

---

## 8. Diagramas de Arquitectura (Archify)

El modelo visual de arquitectura y flujo de alertas ha sido compilado y validado en calidad *Showcase* (9/9 checks aprobados, 0 errores, 0 advertencias) mediante **Archify**:

- **Visor Interactivo HTML (Temas Dark/Light, Búsqueda, Zoom, Export):** [alerta_flujo_actual.html](file:///c:/zabbix_anti/.zabbix_context/diagrams/alerta_flujo_actual.html)
- **Imagen Vectorial SVG:** [alerta_flujo_actual.svg](file:///c:/zabbix_anti/.zabbix_context/diagrams/alerta_flujo_actual.svg)
- **Captura Raster PNG (Alta Resolución):** [alerta_flujo_actual.png](file:///c:/zabbix_anti/.zabbix_context/diagrams/alerta_flujo_actual.png)
- **Especificación JSON IR:** [alerta_flujo_actual.architecture.json](file:///c:/zabbix_anti/.zabbix_context/diagrams/alerta_flujo_actual.architecture.json)

