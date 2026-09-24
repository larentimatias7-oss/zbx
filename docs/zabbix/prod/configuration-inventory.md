# Inventario Consolidado de Configuración: Zabbix 7.0 LTS

- **Change ID:** `ZBX-prod-20260916-ALERT-OPT`
- **Entorno:** Producción (`prod`)
- **Total Hosts Monitoreados:** 76 (75 habilitados, 1 deshabilitado por decommissioning)
- **Total User Groups Creados:** 3
- **Total Actions Auditadas y Refactorizadas:** 4

---

## 1. Inventario Consolidado de Hosts y Taxonomía Operacional

Clasificación de los 76 hosts de producción según el estándar de 4 dimensiones (`team`, `tier`, `component`, `env`):

| ID | Nombre en Zabbix | Host Técnico | Host Groups | team | tier | component | Estado |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| `10084` | **Zabbix server** | `Zabbix server` | Zabbix servers | `observabilidad` | `monitoring` | `zabbix-server` | Habilitado |
| `10680` | **vCenter** | `vCenter` | Hypervisors | `plataforma` | `virtualization` | `hypervisor` | Habilitado |
| `10683` | **172.30.70.132** | `4c4c4544-0034-5810-8042-cac04f5a3234` | Applications, Datacenter, (hypervisor) | `plataforma` | `virtualization` | `hypervisor` | Habilitado |
| `10684` | **172.30.70.131** | `4c4c4544-0034-5810-8042-c8c04f5a3234` | Applications, Datacenter, (hypervisor) | `plataforma` | `virtualization` | `hypervisor` | Habilitado |
| `10695` | **DNS Google 8.8.8.8** | `DNS Google 8.8.8.8` | DNS | `redes` | `core-service` | `dns` | Habilitado |
| `10697` | **FTG_milicic_border1_SNMP** | `FTG_milicic_border1_SNMP` | FortiWorld, FortiGate | `redes` | `perimeter` | `firewall` | Habilitado |
| `10698` | **SRO-FIL01** | `SRO-FIL01` | Windows_Server, File_server | `plataforma` | `service` | `file-server` | Habilitado |
| `10699` | **SRO-DCO01** | `SRO-DCO01` | Windows_Server, AD | `plataforma` | `core` | `server` | Habilitado |
| `10701` | **SRO-DCO02** | `SRO-DCO02` | Windows_Server, AD | `plataforma` | `core` | `server` | Habilitado |
| `10702` | **SRO-SVC01** | `SRO-SVC01` | Rosario, print | `plataforma` | `core` | `server` | Habilitado |
| `10703` | **SRO-BKP01** | `SRO-BKP01` | Windows_Server, Backup_Server | `plataforma` | `backup` | `backup` | Habilitado |
| `10704` | **SRO-ESX01** | `SRO-ESX01` | Hypervisors, Rosario | `plataforma` | `virtualization` | `hypervisor` | Habilitado |
| `10705` | **SRO-ESX02** | `SRO-ESX02` | Hypervisors, Rosario | `plataforma` | `virtualization` | `hypervisor` | Habilitado |
| `10706` | **SRO-STO01** | `SRO-STO01` | Rosario, Storage_Server | `plataforma` | `storage` | `storage` | Habilitado |
| `10708` | **SRO-E02-PB00-CORE01** | `SRO-E02-PB00-CORE01` | Rosario, switch | `redes` | `core` | `switch` | Habilitado |
| `10711` | **SRO-E01-P00-D01** | `SRO-E01-P00-D01` | Rosario, switch | `redes` | `core` | `switch` | Habilitado |
| `10713` | **SRO-G01-P01-D04** | `SRO-G01-P01-D04` | Rosario, switch | `redes` | `access` | `switch` | Habilitado |
| `10714` | **SSJ-HPV01** | `SSJ-HPV01` | Hypervisors, sanJuan | `plataforma` | `virtualization` | `hypervisor` | Habilitado |
| `10715` | **SSJ-DCO01** | `SSJ-DCO01` | AD, sanJuan | `plataforma` | `identity` | `domain-controller` | Habilitado |
| `10716` | **SSJ-FIL01** | `SSJ-FIL01` | Storage_Server, sanJuan | `plataforma` | `storage` | `storage` | Habilitado |
| `10717` | **SSJ-SVC01** | `SSJ-SVC01` | Windows_Server, sanJuan | `plataforma` | `service` | `print-server` | Habilitado |
| `10718` | **SSJ-BKP01** | `SSJ-BKP01` | Backup_Server, sanJuan | `plataforma` | `backup` | `backup` | Habilitado |
| `10719` | **SSJ-CORE01** | `SSJ-CORE01` | switch, sanJuan | `redes` | `core` | `switch` | Habilitado |
| `10722` | **SRO-E02-PB00-CORE02** | `SRO-E02-PB00-CORE02` | Rosario, switch | `redes` | `core` | `switch` | Habilitado |
| `10724` | **SRO-E02-PB00-CORE03** | `SRO-E02-PB00-CORE03` | Rosario, switch | `redes` | `core` | `switch` | Habilitado |
| `10725` | **FTG_milicic_border1_HTTP** | `FTG_milicic_border1_HTTP` | FortiWorld | `redes` | `perimeter` | `firewall` | Habilitado |
| `10726` | **SRO-E03-P00-D03** | `SRO-E03-P00-D03` | Rosario, switch | `redes` | `access` | `switch` | Habilitado |
| `10727` | **SRO-STO02** | `SRO-STO02` | Rosario, Storage_Server | `plataforma` | `storage` | `storage` | Habilitado |
| `10771` | **FTG_ar-223-rio_tinto_SNMP** | `FTG_ar-223-rio_tinto_SNMP` | FortiWorld, FortiGate | `redes` | `perimeter` | `firewall` | Habilitado |
| `10772` | **FTG_ar-341-san_luis_SNMP** | `FTG_ar-341-san_luis_SNMP` | FortiWorld, FortiGate | `redes` | `perimeter` | `firewall` | Habilitado |
| `10773` | **FTG_ar-341-santa_fe_SNMP** | `FTG_ar-341-santa_fe_SNMP` | FortiWorld, FortiGate | `redes` | `perimeter` | `firewall` | Habilitado |
| `10774` | **FTG_ar-368-acueducto_SNMP** | `FTG_ar-368-acueducto_SNMP` | FortiWorld | `redes` | `perimeter` | `firewall` | Habilitado |
| `10775` | **FTG_ar-372-posco_SNMP** | `FTG_ar-372-posco_SNMP` | FortiWorld, FortiGate | `redes` | `perimeter` | `firewall` | Habilitado |
| `10776` | **FTG_ar-374-sierra_grande_SNMP** | `FTG_ar-374-sierra_grande_SNMP` | FortiWorld, FortiGate | `redes` | `perimeter` | `firewall` | Habilitado |
| `10777` | **FTG_ar-375-las_flores_SNMP** | `FTG_ar-375-las_flores_SNMP` | FortiWorld, FortiGate | `redes` | `perimeter` | `firewall` | Habilitado |
| `10778` | **FTG_ar-376-veladero_SNMP** | `FTG_ar-376-veladero_SNMP` | FortiWorld, FortiGate | `redes` | `perimeter` | `firewall` | Habilitado |
| `10779` | **FTG_ar-377-YPF_3er-Loop_SNMP** | `FTG_ar-377-YPF_3er-Loop_SNMP` | FortiWorld, FortiGate | `redes` | `perimeter` | `firewall` | Habilitado |
| `10780` | **FTG_ar-ssj-predio_SNMP** | `FTG_ar-ssj-predio_SNMP` | FortiWorld, FortiGate | `redes` | `perimeter` | `firewall` | Habilitado |
| `10781` | **FTG_pe-S04-lima_SNMP** | `FTG_pe-S04-lima_SNMP` | FortiWorld, FortiGate | `redes` | `perimeter` | `firewall` | Habilitado |
| `10782` | **SRO-MDS01** | `SRO-MDS01` | Windows_Server | `plataforma` | `service` | `server` | Habilitado |
| `10783` | **SRO-APP04** | `SRO-APP04` | Applications, Windows_Server | `plataforma` | `application` | `app-server` | **Deshabilitado (Fase 4)** |
| `10784` | **SRO-SQL01** | `SRO-SQL01` | Applications, Windows_Server | `dba` | `core` | `database` | Habilitado |
| `10785` | **SRO-APP03** | `SRO-APP03` | Applications, Windows_Server | `plataforma` | `application` | `app-server` | Habilitado |
| `10786` | **SER-SAPR** | `SER-SAPR` | Virtual machines, Applications | `plataforma` | `application` | `app-server` | Habilitado |
| `10787` | **SLI-APP01** | `SLI-APP01` | Virtual machines, Applications | `plataforma` | `application` | `app-server` | Habilitado |
| `10788` | **SRO-APP01** | `SRO-APP01` | Applications, Windows_Server | `plataforma` | `application` | `app-server` | Habilitado |
| `10789` | **SRO-APP02** | `SRO-APP02` | Applications, Windows_Server | `plataforma` | `application` | `app-server` | Habilitado |
| `10790` | **SRO-SIP01** | `SRO-SIP01` | Virtual machines, Applications | `plataforma` | `application` | `app-server` | Habilitado |
| `10791` | **SRO-SIP02** | `SRO-SIP02` | Virtual machines, Applications | `plataforma` | `application` | `app-server` | Habilitado |
| `10792` | **UPS SRO CORE** | `UPS_Emerson` | Datacenter, Rosario, UPS | `infraestructura` | `facilities` | `ups` | Habilitado |
| `10796` | **SRO-E02-PB00-ACC01** | `SRO-E02-PB00-ACC01` | Rosario, switch | `redes` | `access` | `switch` | Habilitado |
| `10797` | **SW Ed Gris PB** | `SRO-E02-PB00-ACC02` | Rosario, switch, Network | `redes` | `access` | `switch` | Habilitado |
| `10798` | **SRO-G01-P100-ACC01** | `SRO-G01-P100-ACC01` | Rosario, switch | `redes` | `access` | `switch` | Habilitado |
| `10799` | **SRO-G01-P100-DIS01** | `SRO-G01-P100-DIS01` | Rosario, switch | `redes` | `distribution` | `switch` | Habilitado |
| `10800` | **SRO-G01-P000-ACC2** | `SRO-G01-P000-ACC2` | Rosario, switch, GALPON01 | `redes` | `access` | `switch` | Habilitado |
| `10801` | **UPS Edificio Gris PB** | `SRO-UPS-E02-P00` | Rosario, UPS | `plataforma` | `facilities` | `ups` | Habilitado |
| `10802` | **UPS E02 PA** | `UPS E02 PA` | Datacenter, Rosario, UPS | `infraestructura` | `facilities` | `ups` | Habilitado |
| `10803` | **SRO-P2P-G06** | `SRO-P2P-G06` | ANTENAS P2P, UBIQUITI | `redes` | `link` | `antenna` | Habilitado |
| `10804` | **AP Of. SAP** | `SRO-E02-P00-WAP-SAP01` | Rosario, ARUBA APs, Network | `redes` | `access` | `access-point` | Habilitado |
| `10805` | **AP Of. CAS** | `SRO-E02-P00-WAP-SYG01` | APs, Rosario, ARUBA APs, Network | `redes` | `access` | `access-point` | Habilitado |
| `10806` | **AP Ger. Compras** | `SRO-E02-P00-WAP-GCO01` | APs, Rosario, ARUBA APs, Network | `redes` | `access` | `access-point` | Habilitado |
| `10807` | **AP COMEDOR EG** | `SRO-E02-PB00-WAP-COC01` | APs, Rosario, ARUBA APs, Network | `redes` | `access` | `access-point` | Habilitado |
| `10808` | **AP AIMI** | `SRO-E02-P01-WAP-GER01` | APs, Rosario, ARUBA APs, Network | `redes` | `access` | `access-point` | Habilitado |
| `10809` | **AP Of. Licitaciones** | `SRO-E02-P01-WAP-OLI01` | APs, Rosario, ARUBA APs, Network | `redes` | `access` | `access-point` | Habilitado |
| `10810` | **AP Of Licitaciones Puerta**| `SRO-E02-P01-WAP-OLI02` | APs, Rosario, ARUBA APs, Network | `redes` | `access` | `access-point` | Habilitado |
| `10811` | **AP Administración** | `SRO-E01-P00-WAP-ADM01` | APs, Rosario, ARUBA APs, Network | `redes` | `access` | `access-point` | Habilitado |
| `10812` | **AP RECEPCION** | `SRO-E01-P00-WAP-REC` | APs, Rosario, ARUBA APs, Network | `redes` | `access` | `access-point` | Habilitado |
| `10813` | **AP DIRECTORIO** | `SRO-E01-P01-WAP-DIR` | APs, Rosario, ARUBA APs, Network | `redes` | `access` | `access-point` | Habilitado |
| `10814` | **AP GERENCIAS** | `SRO-E01-P01-WAP-GER01` | APs, Rosario, ARUBA APs, Network | `redes` | `access` | `access-point` | Habilitado |
| `10815` | **AP ABASTECIMIENTO** | `SRO-G01-P01-WAP-ABA` | APs, Rosario, ARUBA APs, Network | `redes` | `access` | `access-point` | Habilitado |
| `10816` | **AP PAÑOL** | `SRO-G01-P01-WAP-PAN` | APs, Rosario, ARUBA APs, Network | `redes` | `access` | `access-point` | Habilitado |
| `10817` | **AP RRHH** | `SRO-G01-P01-WAP-RHH01` | APs, Rosario, ARUBA APs, Network | `redes` | `access` | `access-point` | Habilitado |
| `10819` | **UPS GALPON 01** | `UPS-G01` | Rosario, UPS | `plataforma` | `facilities` | `ups` | Habilitado |
| `10820` | **SRO-POR-P2P01** | `SRO-POR-P2P01` | ANTENAS P2P, Network | `redes` | `link` | `antenna` | Habilitado |
| `10821` | **SSJ-SWADM** | `SSJ-SWADM` | switch, sanJuan | `redes` | `access` | `switch` | Habilitado |
| `10822` | **SSJ-NAS01** | `SSJ-NAS01` | Storage_Server, sanJuan | `plataforma` | `storage` | `storage` | Habilitado |

---

## 2. Detalle de User Groups Creados (RBAC)

Para evitar el Single Point of Failure (SPOF) del usuario individual `Admin`, se crearon 3 grupos funcionales con permisos de lectura explícitos (`permission: 2` - Read-only) sobre los host groups correspondientes:

### A. `Alertas-Guardia-P1` (`usrgrpid: 15`)
- **Propósito:** Recepción de incidentes críticos (High y Disaster) de toda la infraestructura.
- **Miembros Asignados:** `Admin` (`userid: 1`), `mlarenti.zabbix` (`userid: 8`), `fmartin.zabbix` (`userid: 4`).
- **Permisos Asignados (27 Host Groups):**
  - IDs: `2`, `4`, `6`, `7`, `19`, `20`, `22`, `23`, `24`, `25`, `26`, `27`, `28`, `29`, `30`, `31`, `32`, `33`, `34`, `35`, `40`, `41`, `42`, `43`, `44`, `45`, `46`.

### B. `Alertas-NOC-Redes` (`usrgrpid: 16`)
- **Propósito:** Atención de eventos de conectividad, switches, firewalls, enlaces y wireless.
- **Miembros Asignados:** `Admin` (`userid: 1`), `fmartin.zabbix` (`userid: 4`).
- **Permisos Asignados (9 Host Groups):**
  - `switch` (`34`), `FortiGate` (`44`), `FortiWorld` (`26`), `ANTENAS P2P` (`42`), `UBIQUITI` (`43`), `ARUBA APs` (`45`), `APs` (`24`), `Network` (`46`), `DNS` (`25`).

### C. `Alertas-SRE-Plataforma` (`usrgrpid: 17`)
- **Propósito:** Atención de servidores de sistemas operativos, virtualización, bases de datos y energía.
- **Miembros Asignados:** `Admin` (`userid: 1`), `fmartin.zabbix` (`userid: 4`).
- **Permisos Asignados (11 Host Groups):**
  - `Windows_Server` (`27`), `Hypervisors` (`7`), `(hypervisor)` (`23`), `AD` (`29`), `Applications` (`19`), `Databases` (`20`), `Datacenter` (`22`), `Storage_Server` (`33`), `Backup_Server` (`32`), `File_server` (`28`), `UPS` (`41`).

---

## 3. Configuración y Lógica de las Acciones Activas

Las 4 acciones principales de notificación operan con `status: 0` (Enabled) y cuentan con despacho sincronizado hacia los dos Media Types de Telegram:
- **`Telegram_Test` (`mediatypeid: 71`):** Canal `Alertas Infra` (`-1004383937012`).
- **`Telegram_Test_Milicic` (`mediatypeid: 72`):** Canal `Milicic - Monitoreo` (`-1003912373499`).

### 1. `TG-P1-Crítico` (`actionid: 8`)
- **Lógica de Evaluación:** `AND` (`evaltype: 0`)
- **Fórmula:** `A and B`
- **Condiciones:**
  - `A`: `Trigger severity >= High` (`conditiontype: 4`, `operator: 5`, `value: "4"`)
  - `B`: `Problem is not suppressed` (`conditiontype: 16`, `operator: 11`)
- **Operaciones:** Despacho inmediato en Paso 1 (`esc_step_from: 1`, `esc_step_to: 1`) al User Group `Alertas-Guardia-P1` (`usrgrpid: 15`) mediante `Telegram_Test` y `Telegram_Test_Milicic`.
- **Recuperación:** Notificación automática a ambos canales al normalizarse el trigger.

### 2. `TG-P2-Redes` (`actionid: 9`)
- **Lógica de Evaluación:** `Custom` (`evaltype: 3`)
- **Fórmula:** `(A or B or (C and D)) and E and F`
- **Condiciones:**
  - `A`: Host group equals `FortiGate` (`44`)
  - `B`: Host group equals `ANTENAS P2P` (`42`)
  - `C`: Tag value `team` equals `redes`
  - `D`: Tag value `tier` equals `core`
  - `E`: Trigger severity equals `Average` (`3`)
  - `F`: `Problem is not suppressed` (`conditiontype: 16`, `operator: 11`)
- **Operaciones:** Despacho en Paso 2 (10 min de persistencia) al User Group `Alertas-NOC-Redes` (`usrgrpid: 16`) mediante `Telegram_Test` y `Telegram_Test_Milicic`.
- **Recuperación:** Notificación automática a ambos canales.

### 3. `TG-P2-Plataforma` (`actionid: 10`)
- **Lógica de Evaluación:** `Custom` (`evaltype: 3`)
- **Fórmula:** `(A or B or C or D or E or ((F or G) and H) or I or J or K) and L and M`
- **Condiciones:**
  - `A..E`: Host groups `AD` (`29`), `Backup_Server` (`32`), `Storage_Server` (`33`), `Hypervisors` (`7`), `DNS` (`25`)
  - `F/G/H`: Host groups `Windows_Server` (`27`) o `(hypervisor)` (`23`) con tag `scope: capacity`
  - `I`: Tag value `team` equals `plataforma`
  - `J`: Tag value `team` equals `dba`
  - `K`: Tag value `component` equals `ups`
  - `L`: Trigger severity equals `Average` (`3`)
  - `M`: `Problem is not suppressed` (`conditiontype: 16`, `operator: 11`)
- **Operaciones:** Despacho en Paso 2 (10 min de persistencia) al User Group `Alertas-SRE-Plataforma` (`usrgrpid: 17`) mediante `Telegram_Test` y `Telegram_Test_Milicic`.
- **Recuperación:** Notificación automática a ambos canales.

### 4. `TG-P3-Preventivo` (`actionid: 11`)
- **Lógica de Evaluación:** `Custom` (`evaltype: 3`)
- **Fórmula:** `(A or B) and (C or D or E or F) and G and H`
- **Condiciones:**
  - `A`: Tag value `scope` equals `capacity`
  - `B`: Tag value `scope` equals `notice`
  - `C`: Tag value `team` equals `plataforma`
  - `D`: Tag value `team` equals `redes`
  - `E`: Host group equals `Windows_Server` (`27`)
  - `F`: Host group equals `switch` (`34`)
  - `G`: Trigger severity equals `Warning` (`2`)
  - `H`: `Problem is not suppressed` (`conditiontype: 16`, `operator: 11`)
- **Operaciones:** Despacho en Paso 2 (30 min de persistencia) a `Alertas-NOC-Redes` (`16`) y `Alertas-SRE-Plataforma` (`17`) mediante `Telegram_Test` y `Telegram_Test_Milicic`.
- **Recuperación:** Notificación automática a ambos canales.

---

## 4. Inventario de Medias de Notificación (Telegram)

| Media Type | ID Zabbix | Bot de Telegram | Chat ID Destino | Nombre Canal / Grupo | Usuarios Asociados | Estado |
| :--- | :---: | :--- | :---: | :--- | :--- | :---: |
| **`Telegram_Test`** | `71` | `@inframilicic_bot`<br>`8899338410:AAHP9R...` | `-1004383937012` | **Alertas Infra** | `Admin` (1), `mlarenti.zabbix` (8), `svc_zabbix_audit` (7) | Habilitado |
| **`Telegram_Test_Milicic`** | `72` | `@Milicic_bot`<br>`8666455955:AAHYjk...` | `-1003912373499` | **Milicic - Monitoreo** | `fmartin.zabbix` (4) | Habilitado |
| **`Telegram_1`** | `70` | `@Milicic_bot` | `-1003912373499` | Milicic - Monitoreo | `Admin` (1) | Deshabilitado (Legacy) |

---

## 5. Inventario de Mapas Topológicos (Sysmaps)

| Sysmap ID | Nombre del Mapa | Dimensiones | Elementos | Enlaces | Estado / Notas |
| :---: | :--- | :---: | :---: | :---: | :--- |
| `6` | **Network SRO** | 1200 x 800 | 12 | 11 | **Legacy / Parcial:** Host 10708 triplicado, falta switch E03 (10726), P2P sin host real, sin Wi-Fi. |
| `12` | **Network SRO v2** | 1550 x 960 | 18 | 17 | **Producción / Completo & Optimizado:** 5 macrozonas arquitectónicas (shapes en Slate), separación ortogonal anti-colisión, telemetría selectiva en troncales, linktriggers dinámicos y macros corregidas (CPU Dell, PoE Aruba). |
| `11` | **NOC Infraestructura** | - | - | - | Mapa maestro de infraestructura global. |
| `7` | **NOC Infraestructura \| San Juan** | - | - | - | Submapa sede San Juan. |
| `8` | **NOC Infraestructura \| Rosario** | - | - | - | Submapa sede Rosario. |
| `9` | **NOC Infraestructura \| Fortinet y sedes remotas** | - | - | - | Submapa perimetral y túneles SD-WAN / IPsec. |


