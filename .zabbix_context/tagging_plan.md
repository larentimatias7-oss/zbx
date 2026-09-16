# Plan de Tagging y Taxonomía Operacional: Zabbix 7.0 LTS

- **Fecha:** 16 de Septiembre de 2026
- **Alcance:** 76 hosts en producción
- **Objetivo:** Eliminar el hardcoding de hosts y triggers en Actions reemplazándolos por filtrado dinámico de eventos mediante Tags a nivel de Host y Trigger.

---

## 1. Definición de la Taxonomía Estándar

Para lograr un enrutamiento limpio, escalable y desacoplado, se adopta el siguiente estándar de 4 dimensiones:

### A. Dimensión `team` (Equipo Responsable de Resolución)
Define qué grupo humano / guardia operativa atiende la alerta:
- `redes`: Switches Core/Distribución/Acceso, Firewalls FortiGate, Enlaces P2P, APs Aruba, DNS.
- `plataforma`: Sistemas Operativos Windows/Linux, Hypervisores (VMware/ESXi), Directorio Activo, Servidores de Aplicación/Storage/Backup.
- `dba`: Motores de bases de datos (SQL Server).
- `infraestructura`: Sistemas de energía (UPS Emerson/Eaton), facilities y datacenter físico.
- `observabilidad`: Servidores y proxies Zabbix.

### B. Dimensión `tier` (Nivel Arquitectónico / Criticidad Operativa)
Permite diferenciar la severidad y tiempo de respuesta según el rol del dispositivo en la topología:
- `core`: Equipos centrales de red con impacto transversal masivo.
- `distribution`: Capa intermedia de distribución.
- `access`: Equipos de acceso final o periféricos (switches de borde, APs).
- `perimeter`: Seguridad perimetral y bordes WAN (Firewalls FortiGate).
- `link`: Enlaces punto a punto (Antenas P2P).
- `virtualization`: Nodos hipervisores y vCenter.
- `identity`: Controladores de dominio (AD/DNS).
- `data`: Servidores de bases de datos críticas.
- `storage` / `backup`: Almacenamiento y resguardo.
- `application` / `service`: Servidores de aplicaciones y servicios generales.
- `facilities`: Soporte eléctrico y ambiental.

### C. Dimensión `component` (Naturaleza Tecnológica del Recurso)
- `switch`, `firewall`, `antenna`, `access-point`, `ups`, `hypervisor`, `domain-controller`, `database`, `storage`, `backup`, `app-server`, `file-server`, `print-server`, `dns`, `zabbix-server`.

### D. Dimensión `env` (Entorno Operacional)
- `produccion`, `sucursal`, `remoto`.

---

## 2. Correspondencia Detallada para los 76 Hosts

A continuación se detalla la asignación de tags propuesta para cada uno de los 76 hosts inventariados:

| ID | Nombre en Zabbix | Host Técnico | Grupos Actuales | team | tier | component |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: |
| `10683` | **172.30.70.132** | `4c4c4544-0034-5810-8042-cac04f5a3234` | Applications, Datacenter, (hypervisor) | `plataforma` | `virtualization` | `hypervisor` |
| `10684` | **172.30.70.131** | `4c4c4544-0034-5810-8042-c8c04f5a3234` | Applications, Datacenter, (hypervisor) | `plataforma` | `virtualization` | `hypervisor` |
| `10727` | **SRO-STO02** | `SRO-STO02` | Rosario, Storage_Server | `plataforma` | `storage` | `storage` |
| `10714` | **SSJ-HPV01** | `SSJ-HPV01` | Hypervisors, sanJuan | `plataforma` | `virtualization` | `hypervisor` |
| `10821` | **SSJ-SWADM** | `SSJ-SWADM` | switch, sanJuan | `redes` | `access` | `switch` |
| `10722` | **SRO-E02-PB00-CORE02** | `SRO-E02-PB00-CORE02` | Rosario, switch | `redes` | `core` | `switch` |
| `10724` | **SRO-E02-PB00-CORE03** | `SRO-E02-PB00-CORE03` | Rosario, switch | `redes` | `core` | `switch` |
| `10819` | **UPS GALPON 01** | `UPS-G01` | Rosario, UPS | `infraestructura` | `facilities` | `ups` |
| `10725` | **FTG_milicic_border1_HTTP** | `FTG_milicic_border1_HTTP` | FortiWorld | `redes` | `perimeter` | `firewall` |
| `10820` | **SRO-POR-P2P01** | `SRO-POR-P2P01` | ANTENAS P2P, Network | `redes` | `link` | `antenna` |
| `10822` | **SSJ-NAS01** | `SSJ-NAS01` | Storage_Server, sanJuan | `plataforma` | `storage` | `storage` |
| `10784` | **SRO-SQL01** | `SRO-SQL01` | Applications, Windows_Server | `dba` | `data` | `database` |
| `10786` | **SER-SAPR** | `SER-SAPR` | Virtual machines, Applications | `plataforma` | `application` | `app-server` |
| `10783` | **SRO-APP04** | `SRO-APP04` | Applications, Windows_Server | `plataforma` | `application` | `app-server` |
| `10788` | **SRO-APP01** | `SRO-APP01` | Applications, Windows_Server | `plataforma` | `application` | `app-server` |
| `10726` | **SRO-E03-P00-D03** | `SRO-E03-P00-D03` | Rosario, switch | `redes` | `access` | `switch` |
| `10698` | **SRO-FIL01** | `SRO-FIL01` | Windows_Server, File_server | `plataforma` | `service` | `file-server` |
| `10782` | **SRO-MDS01** | `SRO-MDS01` | Windows_Server | `plataforma` | `service` | `server` |
| `10790` | **SRO-SIP01** | `SRO-SIP01` | Virtual machines, Applications | `plataforma` | `application` | `app-server` |
| `10777` | **FTG_ar-375-las_flores_SNMP** | `FTG_ar-375-las_flores_SNMP` | FortiWorld, FortiGate | `redes` | `perimeter` | `firewall` |
| `10781` | **FTG_pe-S04-lima_SNMP** | `FTG_pe-S04-lima_SNMP` | FortiWorld, FortiGate | `redes` | `perimeter` | `firewall` |
| `10771` | **FTG_ar-223-rio_tinto_SNMP** | `FTG_ar-223-rio_tinto_SNMP` | FortiWorld, FortiGate | `redes` | `perimeter` | `firewall` |
| `10773` | **FTG_ar-341-santa_fe_SNMP** | `FTG_ar-341-santa_fe_SNMP` | FortiWorld, FortiGate | `redes` | `perimeter` | `firewall` |
| `10774` | **FTG_ar-368-acueducto_SNMP** | `FTG_ar-368-acueducto_SNMP` | FortiWorld | `redes` | `perimeter` | `firewall` |
| `10787` | **SLI-APP01** | `SLI-APP01` | Virtual machines, Applications | `plataforma` | `application` | `app-server` |
| `10792` | **UPS SRO CORE** | `UPS_Emerson` | Datacenter, Rosario, UPS | `redes` | `core` | `switch` |
| `10772` | **FTG_ar-341-san_luis_SNMP** | `FTG_ar-341-san_luis_SNMP` | FortiWorld, FortiGate | `redes` | `perimeter` | `firewall` |
| `10715` | **SSJ-DCO01** | `SSJ-DCO01` | AD, sanJuan | `plataforma` | `identity` | `domain-controller` |
| `10680` | **vCenter** | `vCenter` | Hypervisors | `plataforma` | `virtualization` | `hypervisor` |
| `10789` | **SRO-APP02** | `SRO-APP02` | Applications, Windows_Server | `plataforma` | `application` | `app-server` |
| `10785` | **SRO-APP03** | `SRO-APP03` | Applications, Windows_Server | `plataforma` | `application` | `app-server` |
| `10699` | **SRO-DCO01** | `SRO-DCO01` | Windows_Server, AD | `plataforma` | `identity` | `domain-controller` |
| `10775` | **FTG_ar-372-posco_SNMP** | `FTG_ar-372-posco_SNMP` | FortiWorld, FortiGate | `redes` | `perimeter` | `firewall` |
| `10791` | **SRO-SIP02** | `SRO-SIP02` | Virtual machines, Applications | `plataforma` | `application` | `app-server` |
| `10778` | **FTG_ar-376-veladero_SNMP** | `FTG_ar-376-veladero_SNMP` | FortiWorld, FortiGate | `redes` | `perimeter` | `firewall` |
| `10716` | **SSJ-FIL01** | `SSJ-FIL01` | Storage_Server, sanJuan | `plataforma` | `storage` | `storage` |
| `10798` | **SRO-G01-P100-ACC01** | `SRO-G01-P100-ACC01` | Rosario, switch | `redes` | `access` | `switch` |
| `10803` | **SRO-P2P-G06** | `SRO-P2P-G06` | ANTENAS P2P, UBIQUITI | `redes` | `link` | `antenna` |
| `10799` | **SRO-G01-P100-DIS01** | `SRO-G01-P100-DIS01` | Rosario, switch | `redes` | `distribution` | `switch` |
| `10800` | **SRO-G01-P000-ACC2** | `SRO-G01-P000-ACC2` | Rosario, switch, GALPON01 | `redes` | `access` | `switch` |
| `10797` | **SW Ed Gris PB** | `SRO-E02-PB00-ACC02` | Rosario, switch, Network | `redes` | `access` | `switch` |
| `10801` | **UPS Edificio Gris PB** | `SRO-UPS-E02-P00` | Rosario, UPS | `infraestructura` | `facilities` | `ups` |
| `10802` | **UPS E02 PA** | `UPS E02 PA` | Datacenter, Rosario, UPS | `infraestructura` | `facilities` | `ups` |
| `10776` | **FTG_ar-374-sierra_grande_SNMP** | `FTG_ar-374-sierra_grande_SNMP` | FortiWorld, FortiGate | `redes` | `perimeter` | `firewall` |
| `10779` | **FTG_ar-377-YPF_3er-Loop_SNMP** | `FTG_ar-377-YPF_3er-Loop_SNMP` | FortiWorld, FortiGate | `redes` | `perimeter` | `firewall` |
| `10808` | **AP AIMI** | `SRO-E02-P01-WAP-GER01` | APs, Rosario, ARUBA APs, Network | `redes` | `access` | `access-point` |
| `10809` | **AP Of. Licitaciones** | `SRO-E02-P01-WAP-OLI01` | APs, Rosario, ARUBA APs, Network | `redes` | `access` | `access-point` |
| `10810` | **AP Of Licitaciones Puerta** | `SRO-E02-P01-WAP-OLI02` | APs, Rosario, ARUBA APs, Network | `redes` | `access` | `access-point` |
| `10806` | **AP Ger. Compras** | `SRO-E02-P00-WAP-GCO01` | APs, Rosario, ARUBA APs, Network | `redes` | `access` | `access-point` |
| `10805` | **AP Of. CAS** | `SRO-E02-P00-WAP-SYG01` | APs, Rosario, ARUBA APs, Network | `redes` | `access` | `access-point` |
| `10807` | **AP COMEDOR EG** | `SRO-E02-PB00-WAP-COC01` | APs, Rosario, ARUBA APs, Network | `redes` | `access` | `access-point` |
| `10811` | **AP Administración** | `SRO-E01-P00-WAP-ADM01` | APs, Rosario, ARUBA APs, Network | `redes` | `access` | `access-point` |
| `10812` | **AP RECEPCION** | `SRO-E01-P00-WAP-REC` | APs, Rosario, ARUBA APs, Network | `redes` | `access` | `access-point` |
| `10813` | **AP DIRECTORIO** | `SRO-E01-P01-WAP-DIR` | APs, Rosario, ARUBA APs, Network | `redes` | `access` | `access-point` |
| `10814` | **AP GERENCIAS** | `SRO-E01-P01-WAP-GER01` | APs, Rosario, ARUBA APs, Network | `redes` | `access` | `access-point` |
| `10815` | **AP ABASTECIMIENTO** | `SRO-G01-P01-WAP-ABA` | APs, Rosario, ARUBA APs, Network | `redes` | `access` | `access-point` |
| `10816` | **AP PAÑOL** | `SRO-G01-P01-WAP-PAN` | APs, Rosario, ARUBA APs, Network | `redes` | `access` | `access-point` |
| `10817` | **AP RRHH** | `SRO-G01-P01-WAP-RHH01` | APs, Rosario, ARUBA APs, Network | `redes` | `access` | `access-point` |
| `10701` | **SRO-DCO02** | `SRO-DCO02` | Windows_Server, AD | `plataforma` | `identity` | `domain-controller` |
| `10780` | **FTG_ar-ssj-predio_SNMP** | `FTG_ar-ssj-predio_SNMP` | FortiWorld, FortiGate | `redes` | `perimeter` | `firewall` |
| `10717` | **SSJ-SVC01** | `SSJ-SVC01` | Windows_Server, sanJuan | `plataforma` | `service` | `print-server` |
| `10796` | **SRO-E02-PB00-ACC01** | `SRO-E02-PB00-ACC01` | Rosario, switch | `redes` | `access` | `switch` |
| `10804` | **AP Of. SAP** | `SRO-E02-P00-WAP-SAP01` | Rosario, ARUBA APs, Network | `redes` | `access` | `access-point` |
| `10702` | **SRO-SVC01** | `SRO-SVC01` | Rosario, print | `plataforma` | `service` | `print-server` |
| `10718` | **SSJ-BKP01** | `SSJ-BKP01` | Backup_Server, sanJuan | `plataforma` | `backup` | `backup` |
| `10719` | **SSJ-CORE01** | `SSJ-CORE01` | switch, sanJuan | `redes` | `core` | `switch` |
| `10703` | **SRO-BKP01** | `SRO-BKP01` | Windows_Server, Backup_Server | `plataforma` | `backup` | `backup` |
| `10704` | **SRO-ESX01** | `SRO-ESX01` | Hypervisors, Rosario | `plataforma` | `virtualization` | `hypervisor` |
| `10705` | **SRO-ESX02** | `SRO-ESX02` | Hypervisors, Rosario | `plataforma` | `virtualization` | `hypervisor` |
| `10706` | **SRO-STO01** | `SRO-STO01` | Rosario, Storage_Server | `plataforma` | `storage` | `storage` |
| `10695` | **DNS Google 8.8.8.8** | `DNS Google 8.8.8.8` | DNS | `redes` | `core-service` | `dns` |
| `10708` | **SRO-E02-PB00-CORE01** | `SRO-E02-PB00-CORE01` | Rosario, switch | `redes` | `core` | `switch` |
| `10697` | **FTG_milicic_border1_SNMP** | `FTG_milicic_border1_SNMP` | FortiWorld, FortiGate | `redes` | `perimeter` | `firewall` |
| `10711` | **SRO-E01-P00-D01** | `SRO-E01-P00-D01` | Rosario, switch | `redes` | `access` | `switch` |
| `10713` | **SRO-G01-P01-D04** | `SRO-G01-P01-D04` | Rosario, switch | `redes` | `access` | `switch` |
| `10084` | **Zabbix server** | `Zabbix server` | Zabbix servers | `observabilidad` | `monitoring` | `zabbix-server` |

---

## 3. Resumen de Distribución por Equipo

| Equipo Responsable (`team`) | Cantidad de Hosts | Porcentaje |
| :--- | :---: | :---: |
| **redes** | 44 | 57.9% |
| **plataforma** | 27 | 35.5% |
| **infraestructura** | 3 | 3.9% |
| **dba** | 1 | 1.3% |
| **observabilidad** | 1 | 1.3% |
| **Total** | **76** | **100%** |

---

## 4. Estrategia de Aplicación en Zabbix

1. **Inyección de Tags a nivel Host:**
   - Aplicar mediante llamadas batch `host.massupdate` incorporando los tags `team`, `tier`, `component` y `env` según la matriz anterior.
2. **Refactorización de Actions:**
   - Una vez aplicados los tags, las condiciones de las acciones se simplificarán drásticamente:
     - **TG-P2-Redes:** Tag `team` = `redes` AND Tag `tier` = `core` (Reemplaza los 4 hosts hardcodeados).
     - **TG-P2-Plataforma:** Tag `team` = `plataforma` OR Tag `component` = `ups` (Reemplaza los 4 triggers de UPS y el host SQL).
     - **TG-P3-Preventivo:** Tag `scope` = `notice` OR `capacity` (Reemplaza los 6 triggers hardcodeados).
