# Contexto Operativo e Histórico de Remediaciones (Auditoría ChatGPT)

- **Repositorio Fuente en OneDrive:** `C:\Users\matias.larenti\OneDrive - Milicic SA\Documentos\Zabbix`
- **Entorno:** Producción (`zabbix.mlccnet.local` - `172.30.20.61`)
- **Versión de Zabbix:** 7.0.22 LTS
- **Fecha de Corte y Consolidación:** 24 de Septiembre de 2026

---

## 1. Resumen de la Auditoría y Hallazgos Principales (AUD-001 a AUD-009)

Durante la fase de diagnóstico inicial y saneamiento se identificaron y catalogaron los siguientes problemas estructurales:

| ID | Prioridad | Dominio | Hallazgo Técnico | Evidencia y Causa Raíz | Estado / Solución Aplicada |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AUD-001** | Alta | Ítems | Cobertura degradada por ítems no soportados | 1.316 ítems en estado no soportado (1.191 habilitados). Consumo innecesario de ciclos de pollers. | En remediación gradual por causa raíz (sin borrado masivo a ciegas). |
| **AUD-001A**| Alta | VMware | Errores de endpoint VMware | 430 ítems reportando `Invalid URL: missing /sdk`. Causa: macro `{$VMWARE.URL}` sin el sufijo `/sdk`. | Ajuste de macro en template/hosts VMware. |
| **AUD-001B**| Alta | SNMP | Sesiones SNMP fallidas | 390 errores `zbx_snmp_open_session() failed`. | Verificación de ACLs, timeouts y credenciales UDP/161. |
| **AUD-001C**| Alta | FortiGate | Fallas masivas en `FTG_ar-368-acueducto_SNMP` | 260 ítems no soportados por falla de sesión SNMP. | Corrección de parámetros de conectividad SNMP. |
| **AUD-001D**| Media | Wireless | AP Gerencias y AP Administración sin respuesta SNMP | 65 y 64 ítems no soportados respectivamente por uso de template ProCurve. | **Resuelto:** Desvinculación de template 10250; implementación de templates nativos 10818 (Aruba Instant AP) y 10826 (Aruba Instant On 1930). |
| **AUD-001E**| Media | Calculados | División por cero en cálculo de filesystem | `Cannot evaluate expression: division by zero` con `vfs.fs.total[fgSysDiskCapacity.0]`. | Inclusión de guardas condicionales en el cálculo. |
| **AUD-002** | Media | Operación | Ausencia de ventanas de mantenimiento | Cero mantenimientos configurados en Zabbix. Generación de alertas evitables en cambios planificados. | Definición del procedimiento de ventanas de mantenimiento. |
| **AUD-003** | Alta | Alerting | Acción global sin condiciones (*Alert Storms*) | La acción por defecto `Report problems to Zabbix administrators` escalaba sin filtros ni persistencia. | **Resuelto:** Deshabilitada y reemplazada por las 4 acciones P1, P2 (Redes), P2 (Plataforma) y P3. |
| **AUD-004** | Alta | Ruido | Volumen crítico de alertas | 8.406 eventos en 30 días (promedio 280/día) concentrados en solo 5 disparadores recurrentes. | **Resuelto:** Ajuste de persistencia (10 min en P2, 30 min en P3) y filtros por severidad/tags. |
| **AUD-005** | Alta | Red | Microflapping en switches | Puerto `Gi1/0/4` de `SRO-G01-P100-ACC01` generó 176 problemas en 7 días (93.8% duraron < 5 min). | Clasificación con `Analyze-LinkDownFlapping.ps1` y diagnóstico físico. |
| **AUD-006** | Media | Plataforma | Sobrecarga de pollers Zabbix Server | Proceso housekeeper al 100% crónico. Causa raíz: `ZBX_ENABLE_TIMESCALEDB=true` sin hypertables — Zabbix realizaba DELETE fila por fila en tablas planas de hasta 33 GB. | **Resuelto 25/09/2026:** Migración de 7 tablas (~46 GB) a TimescaleDB Hypertables, 7 retention policies configuradas (31d history / 365d trends), HK interno de History/Trends deshabilitado en UI. Ver PND-003. |
| **AUD-007** | Alta | Energía | UPS GALPON 01 con batería baja recurrente | 168 eventos High en 30 días por autonomía reportada < 10 minutos. | Inspección física del banco de baterías y control de carga. |
| **AUD-008** | Media | Windows | Falsas alarmas por servicio VSS | 162 eventos en 30 días en hipervisores porque VSS inicia bajo demanda. | **Resuelto en SSJ-HPV01:** Trigger 34062 deshabilitado; reemplazado por 37635 (startup=disabled). |
| **AUD-009** | Media | Resiliencia | Monitoreo en San Juan (Proxy y HA) | Proxy `SSJ-ZAB01` y servidores de San Juan sin visibilidad de estado HA. | Documentación de topología e inspección de proxy. |

---

## 2. Cronología de Saneamiento y Decisiones Operativas (08/09 al 23/09/2026)

### 08/09/2026: Arquitectura Inicial y Manual Técnico
- Elaboración del primer manual técnico de infraestructura consolidando 76 hosts en Rosario y sucursales.
- Documentación del flujo de alertas de Telegram con dos bots (`@inframilicic_bot` y `@Milicic_bot`) y dos supergrupos (`Alertas Infra` y `Milicic - Monitoreo`).

### 09/09/2026: Diagnóstico de Red y Microflapping
- Creación del script `Analyze-LinkDownFlapping.ps1` para discriminar microflapping (<2 min) de caídas prolongadas (>8h).
- Piloto de recolección LLDP vía SNMP para mapeo automático de topología de switches.
- Propuesta inicial del dashboard y mapa de red `NOC Infraestructura`.

### 10/09/2026 al 15/09/2026: Energía, Dependencias y Ajuste de Acciones
- Diagnóstico de UPS Edificio Gris, Galpón 01 y UPS E02 PA.
- Detección de caída intencional de `SRO-SQL01` para mantenimiento.
- Corrección de la política de destinatarios en Telegram para evitar fallos de entrega silenciosos.

### 22/09/2026: Gran Jornada de Estabilización y Desduplicación
- **SSJ-HPV01 (VSS):** Silenciado el trigger histórico 34062 (VSS not running); creado ítem 98089 y trigger 37635 para detectar si el servicio queda deshabilitado (`startup=3`).
- **SSJ-BKP01 (Veeam):** Confirmado que el host no tiene ítems de jobs/sesiones Veeam en Zabbix. Diseñado el script `Get-VeeamVmBackupStatus.ps1` con cmdlets de Veeam PowerShell para extraer telemetría real.
- **Switch G01 (192.168.0.224):** Confirmada duplicidad física de monitoreo entre `SRO-G01-P01-D04` (10713) y `SRO-G01-P100-DIS01` (10799). Triggers de puerto 14 flapping.
- **Docker Zabbix Server:** Bind mounts compartidos reportaban 90.16% de uso en 5 puntos de montaje generando 10 alarmas redundantes. Creado trigger local único 37637 (Average, P2 Plataforma).
- **UPS E02 PA:** Creado ítem interno de disponibilidad SNMP 98122 y disparador preventivo Warning 37636 (P3).
- **Mapas NOC:** Creado el mapa principal 11 (`NOC Infraestructura`) y 4 submapas (7 al 10) con 77 hosts cubiertos exactamente una vez y enlaces LLDP bidireccionales confirmados.
- **Restauración de Destinatarios Telegram:** Acciones 8 a 11 configuradas para entregar a `Admin` y `mlarenti.zabbix` por `Telegram_Test` (71) y `fmartin.zabbix` por `Telegram_Test_Milicic` (72).

### 23/09/2026 (Estado Vivo Actual):
- **Saneamiento Infraestructura Aruba (Wi-Fi y Switches Instant On):**
  * **Causa Raíz Identificada:** Consultora externa había asociado el template de switches ProCurve `HP Enterprise Switch by SNMP` (10250) a los 14 APs Aruba Instant Enterprise (AOS-8) y a los 2 switches Instant On 1930. Esto causaba más de 42 ítems no soportados, 7 LLDs espurios (sensores térmicos, fuentes y ventiladores de chasis) y alertas Average recurrentes por link down del puerto auxiliar desconectado `eth1`.
  * **Remediación Ejecutada:**
    - Purga limpia y desvinculación de template 10250 en los 16 hosts.
    - Creación e implementación de `Aruba Instant AP by SNMP` (10818): incluye recolección de modelo y firmware vía items dependientes de `sysDescr`, uptime, ICMP ping, estado SNMP y LLD de interfaces físicas (`eth0`, `eth1`), bridge (`BR0`) y radios Wi-Fi (`radio0_ssid_id*` en 5 GHz, `radio1_ssid_id*` en 2.4 GHz).
    - Desactivación de prototype trigger `Interface {#IFNAME}: Link down` (36393) erradicando alertas de `eth1`.
    - Creación de `Aruba Instant On 1930 Switch by SNMP` (10826) con telemetría de CPU (`1.3.6.1.4.1.11.2.1.8.0`) y consumo PoE (`1.3.6.1.2.1.105.1.3.1.1.2.1`).
    - Resultado: Mapa `Wi-Fi - 14` 100% OK/Verde y eliminación masiva de ítems no soportados.
- **Limpieza de Ítems Temporales:** Eliminado de la API el ítem de diagnóstico 98124 (`noc.sdwan.schema`) en el firewall Fortinet.
- **Auditoría de Acciones y Entregas:** Revalidada la ventana de entrega de 12 a 24 horas: 30 operaciones procesadas (22 exitosas, 8 fallidas).
  * Las 8 fallas corresponden a `mlarenti.zabbix` mediante `Telegram_Test` con `Bad Request: chat not found`.
  * `Admin` y `fmartin.zabbix` tienen 100% de éxito en sus entregas.
- **Clasificación P1 Fortinet:** 4 incidentes ICMP independientes con sus respectivas recuperaciones en Posco, San Luis, Santa Fe y Río Tinto. Sin evidencia de reincidencia o flapping anómalo.
- **UPS E02 PA:** Deshabilitado el disparador 35455 que reportaba falsamente que la salida del UPS no era normal (basado en un ítem sin muestras). Conservada la telemetría SNMP real.
- **Switch G01:** Deshabilitados triggers 26297 y 26298 en `D04` (puertos 11 y 12) para eliminar duplicación visible con `DIS01`. Identificados 9 widgets en el Dashboard NOC 408 que referencian a D04.
- **Mapa Topológico Integral `Network SRO v2` (`sysmapid: 12`):**
  * **Análisis de Inconsistencias en Mapa Original 6 (`Network SRO`):**
    - Host `10708` (`SRO-E02-PB00-CORE01`) figuraba triplicado y erróneamente etiquetado como `SRO-E01-PB01-SW01`.
    - Omisión del switch de acceso de Edificio E03 (`10726` - `SRO-E03-P00-D03`).
    - Enlaces P2P modelados como imágenes decorativas sin entidad host ni telemetría real.
    - Cero integración con el parque Wi-Fi corporativo (14 APs Aruba AOS-8).
    - Elementos residuales o huérfanos sin host asignado (selements 77 y 78).
  * **Construcción y Despliegue de `Network SRO v2` (`sysmapid: 12`):**
    - 18 elementos distribuidos y jerarquizados en 5 macrozonas arquitectónicas con delimitación visual (`shapes`):
      1. Datacenter Core & Perímetro WAN (`E02 PB`)
      2. Edificio E03 (Anexo Switching & Taller)
      3. Galpón 01 (`G01` - Taller, Logística & Radioenlaces)
      4. Edificio Blanco (`E01` - Administración & Directorio)
      5. Infraestructura Wi-Fi Corporativa (Aruba AOS-8 & Clúster 45)
    - **Refactorización de Layout y Buenas Prácticas (Eliminación de Solapamiento):**
      * Separación visual ampliada (canvas 1550 x 960) evitando colisiones en puntos medios.
      * Telemetría selectiva: etiquetas con ancho de banda `{?last(...)}` reservadas exclusivamente para los troncales de fibra y enlaces perimetrales (WAN, Te1/0/6, Te1/0/20, Te1/0/8, Te1/0/5). Enlaces terminales de acceso, radioenlaces y APs limpios sin cajas verdes invasivas.
      * Disparadores dinámicos en enlaces (`linktriggers`): troncales asociados a triggers de caída de interfaz que colorean el enlace en rojo (`#DD0000`) en caso de falla.
      * Corrección de macros: CPU en Dell N4032 ajustada a `system.cpu.usage.avg1m[system]` (eliminando `*UNKNOWN*%`) y PoE en Aruba 1930 corregido (eliminando duplicidad `WW`).
      * Bordes sutiles en Slate (`#94A3B8`) y tipografía técnica (`#1E293B`).
    - Acceso directo: `https://zabbix.mlccnet.local/zabbix.php?action=map.view&sysmapid=12`.

---

## 3. Matriz de Infraestructura, Red y VLANs Confirmadas

### Topología Física y Core
- **Perímetro WAN:** FortiGate Border1 (`172.30.20.1`, FortiOS 7.4.12) y sucursal San Juan (`172.29.70.1`).
- **Core de Conmutación:** Switch Core principal `CORE01 Dell N4032` (10708) en Rosario.
- **Troncales Confirmados por LLDP:**
  * `CORE01` (puerto 20) <--> `CORE02 Dell N4032` (10722, puerto 20)
  * `CORE01` (puerto 6) <--> `CORE03 Aruba 1930` (10724, puerto 48)
  * `CORE01` (puerto 5) <--> `D01 Edificio Blanco` (10711, puerto 22)
  * `CORE01` (puerto 8) <--> `DIS01 Galpón 01` (10799, puerto 1)
  * `CORE01` <--> `ACC01 Edificio Gris PB` (10797)
  * `CORE01` <--> `ACC01 E02 PB` (10796)
  * `CORE03` <--> `D03 E03` (10726)

### Segmentación de Red (VLANs)
| VLAN ID | Denominación | Rango / Finalidad |
| :--- | :--- | :--- |
| **VLAN 10** | Infraestructura | Transporte y networking interno |
| **VLAN 15** | DMZ | Servidores y servicios perimetrales |
| **VLAN 20** | Monitoreo | Zabbix Server (`172.30.20.61`), sondas y colectores |
| **VLAN 70** | Management Servidores | Hypervisores ESXi (`172.30.70.131`, `172.30.70.132`), vCenter, iDRAC |
| **VLAN 71** | Management Redes | IPs de gestión de switches y routers |
| **VLAN 80** | Backup | Tráfico de almacenamiento de respaldo y Veeam |
| **VLAN 100 - 104** | Usuarios | Redes cableadas de puestos de trabajo |
| **VLAN 215 - 216** | Wireless | Redes inalámbricas corporativas (Aruba APs) |

---

### 23/09/2026 — Parte 2: Plataforma de Observabilidad Grafana (Sesión Antigravity)

#### Infraestructura Grafana desplegada
- **Grafana v11.5.2** instalado en Dokploy (`http://172.27.210.154:3005`) con datasource `alexanderzobnin-zabbix-datasource` (UID: `efz4nzx8r30g0c`) conectado a Zabbix 7.0.22.
- **11 plugins** instalados vía `GF_INSTALL_PLUGINS` en `docker-compose.yml` (Infinity datasource, Business Text, Business Table, Polystat, Treemap, Hourly Heatmap, Plotly.js, Weathermap, Pareto Chart, Sankey).

#### Dashboards construidos y desplegados (scripts .mjs)
Se crearon 11 dashboards en la carpeta `Milicic Observabilidad`:

| Dashboard | UID | Descripción |
| :--- | :--- | :--- |
| Networking: Switches | `milicic-switches-core` | Polystat estado + heatmap tráfico |
| VMware & Datastores | `milicic-vmware-datastores` | VMs, ESXi, storage |
| SOC/NOC Ejecutivo | `milicic-soc-overview` | Visión global, problemas activos |
| San Juan (SSJ) | `milicic-sanjuan-infra` | Infra SSJ completa |
| Active Directory | `milicic-activedirectory-soc` | DC health, Cyber SOC, servicios AD |
| Servidores | `milicic-servers-plataforma` | Windows/Linux compute |
| Backup/Veeam | `milicic-backup-continuidad` | Jobs, sesiones, restauración |
| Energía/UPS | `milicic-facilities-ups` | Baterías, carga, autonomía |
| FortiGate/WAN | `milicic-fortigate-wan` | WAN, VPN, firewalling |
| Aruba Wi-Fi | `milicic-aruba-wifi` | 14 APs + 2 switches Instant On |
| Galería Plugins | `milicic-nuevos-plugins` | Showcase de los 11 nuevos plugins |

#### Resolución de timeouts en Dashboard Active Directory
- **Problema:** Panel "Matriz de Servicios Vitales" (ID 10) usaba regex multi-alternativa `/State of service .*(\"NTDS\"|\"DNS\"|\"Kdc\"|\"Netlogon\"|\"DFSR\"|\"W32Time\"|\"ADWS\").*/` causando timeout de 60s (`context canceled`) en Zabbix API.
- **Causa raíz:** El datasource escanea todos los items de todos los hosts con regex full-scan. Con múltiples DC y regex compuesta = desborde del deadline.
- **Solución aplicada:** 1 target con regex → **6 targets independientes con nombre exacto** de item:
  - `State of service "NTDS" (Active Directory Domain Services)` (refId: NTDS)
  - `State of service "DNS" (DNS Server)` (refId: DNS)
  - `State of service "Kdc" (Kerberos Key Distribution Center)` (refId: KDC)
  - `State of service "Netlogon" (Netlogon)` (refId: NETLOGON)
  - `State of service "DFSR" (DFS Replication)` (refId: DFSR)
  - `State of service "W32Time" (Windows Time)` (refId: W32TIME)
- **Mismo fix** aplicado a paneles de Eventlog (IDs 1-4): reemplazados por nombres exactos verificados en Zabbix MCP.
- **Optimizaciones adicionales:** `time: now-3h` (antes `now-6h`), `refresh: 1m` (antes `30s`), datasource `timeout: 90`, `cacheTTL: 1m`, `oauthPassThru: false`.

#### Fixes visuales finales en Dashboard AD
- **Panel Treemap** (ID 41): reemplazado por `stat` panel horizontal con `colorMode: background` — el Treemap requiere formato tabla String+Number que el datasource Zabbix no produce nativamente.
- **Panel Hourly Heatmap** (ID 38): 3 targets separados por DC + `timeFrom: now-7d` para mostrar densidad horaria con suficientes días de historia.
### 24/09/2026 (Refactorización y Estandarización de Observabilidad Grafana):
- **Evolución Mayor del Dashboard Active Directory & Cyber SOC (`milicic-activedirectory-soc`):**
  * **Erradicación del Error "Too many points to visualize properly":** El panel 10 "Matriz de Servicios Vitales" fue migrado del plugin `status-history` al panel nativo `state-timeline` configurado con `mergeValues: true` y `rowHeight: 0.85`. Esto resolvió de forma definitiva el colapso visual ante altas densidades de muestras temporales.
  * **Conteo Real en KPI Stat Cards (Fila 0):** Se corrigió la consulta de los ítems de eventos de seguridad (bloqueos de cuenta 4740, fallos Kerberos 4771, logons fallidos NTLM 4625 y cambios de grupos privilegiados) configurando `queryType: "2"` (Text) y `reduceOptions: { calcs: ["count"], values: false }` con `noValue: "0"`, reflejando métricas exactas.
  * **Sección de Auditoría Forense de Seguridad Interactiva (Fila 5):** Se crearon 3 tablas dedicadas para auditoría forense profunda con `queryType: "2"`, columnas técnicas ocultadas (`Item`, `Key`), visualización optimizada (`Host`, `Time`, `Last value`), inspección de celda ampliada (`custom.inspect: true`), ordenamiento dinámico y enlaces directos a Zabbix History.
  * **Variables Globales de Búsqueda y Tiempo:**
    - `$forensic_window`: Permite ajustar el horizonte de auditoría (`24h`, `7d`, `15d`, `30d`, `60d`) de manera totalmente independiente del timepicker general del tablero.
    - `$search`: Barra de búsqueda de texto libre que filtra dinámicamente registros forenses en tiempo real mediante transformación `filterByValue` con expresión regular compatible con JavaScript (`.*${search:raw}.*`).
- **Estandarización del Pipeline de Tablas de Incidentes (`queryType: "5"`) en Toda la Suite:**
  * Se auditó el parque completo de dashboards y se detectó que los paneles nativos de tabla mostraban el objeto de problemas como una cadena JSON cruda.
  * Se aplicó la transformación estandarizada `extractFields` (JSON sobre `Problems`) + `organize` + mapeo de severidad por colores corporativos + Data Link directo a Zabbix Web (`https://zabbix.mlccnet.local/zabbix.php?action=problem.view`) en los siguientes tableros:
    1. `milicic-activedirectory-soc` (Panel 50)
    2. `milicic-backup-veeam` (Panel 40)
    3. `milicic-facilities-ups` (Panel 40)
    4. `milicic-fortigate-sdwan` (Panel 50)
  * Los dashboards `milicic-soc-overview`, `milicic-sanjuan-infra`, `milicic-servers-overview`, `milicic-switches-core` y `milicic-vmware-datastores` fueron auditados y validados limpios.
- **Despliegue, Rediseño Visual y Telemetría Extendida del Mapa `Network SRO v2` (`sysmapid: 12`):**
  * **Canvas Profesional y Arquitectura Espacial:** Canvas ampliado a `2100 x 1300 px` con distribución ortogonal estricta de 37 elementos, eliminando 100% de solapamientos entre iconos, enlaces y etiquetas de texto.
  * **Zonificación Cromática por Oficina y Macrozonas (8 Shapes Temáticas):**
    1. 🏢 **Datacenter Core & Perímetro WAN (Edificio Gris PB):** Fondo `#F8FAFC`, borde `#64748B`.
    2. 🖥️ **Datacenter Cómputo, Virtualización, Storage & Monitoreo:** Fondo `#F1F5F9`, borde `#64748B`.
    3. ⚡ **Energía Crítica & Facilities (UPS):** Fondo `#FFFBEB`, borde `#F59E0B`.
    4. 🏭 **Edificio E03 (Anexo Switching & Taller):** Fondo `#F0FDF4`, borde `#10B981`.
    5. 📦 **Galpón 01 (G01 - Taller, Logística & Radioenlaces P2P):** Fondo `#F5F3FF`, borde `#8B5CF6`.
    6. 🏛️ **Edificio Blanco (E01 - Administración & Directorio):** Fondo `#F0F9FF`, borde `#0EA5E9`.
    7. 📡 **Parque Wi-Fi Corporativo ARUBA (14 APs AOS-8):** Fondo `#ECFEFF`, borde `#06B6D4`.
    8. 📋 **Panel de Referencias & Leyenda Técnica NOC:** Fondo `#FFFFFF`, borde `#94A3B8`, con guía de colores de enlaces y telemetría.
  * **Telemetría en Tiempo Real de Ancho de Banda (RX / TX) y Salud de Enlaces:**
    - Perímetro WAN (FortiGate ↔ CORE03): Tráfico UP/DOWN en tiempo real `{?last(/FTG_milicic_border1_SNMP/...)}`.
    - Troncal Te1/0/6 (CORE03 ↔ CORE01): Tráfico RX/TX con trigger de link-down `26798`.
    - LAG Inter-Core Te1/0/20 (CORE01 ↔ CORE02): Tráfico RX/TX con trigger de link-down `26812`.
    - Troncal Galpón 01 Te1/0/8 (CORE01 ↔ DIS01): Tráfico RX/TX con trigger de link-down `26800`.
    - Troncal Edificio Blanco Te1/0/5 (CORE01 ↔ D01): Tráfico RX/TX con trigger de link-down `26797`.
  * **Despliegue de Dashboard de Topología de Red e Infraestructura en Grafana (`milicic-network-topology`):**
    - Panel Central ECharts (`volkovlabs-echarts-panel`) con 37 nodos, 36 enlaces con curvatura y etiquetas, 6 categorías cromáticas y navegación interactiva (zoom, pan, arrastre de nodos, resaltado por adyacencia y tooltips enriquecidos).
    - Fila de 6 KPI Stat Cards de enlace y CPU (Tráfico WAN UP/DOWN, LAG Inter-Core, CPU CORE01/02, Carga UPS Emerson).
    - Paneles Timeseries y Gauges para monitoreo de ancho de banda en troncales de fibra (Te1/0/6, Te1/0/8, Te1/0/5, Te1/0/20).
    - Panel de Incidentes de Red Activos en vivo con pipeline JSON `extractFields`, `calculateField` (ms) y severidades corporativas.
    - URL Directa: `http://172.27.210.154:3005/d/milicic-network-topology/topologia-de-red-e-infraestructura-global-sro`.
  * **Despliegue de Dashboard de Mapa Geográfico Satelital WAN & SD-WAN (`milicic-geomap-wan-sdwan`):**
    - Panel Central `Geomap` de Grafana Core con geolocalización satelital precisa de 12 sedes, frentes de obra y proyectos mineros (Rosario, San Juan, Veladero, Posco, Río Tinto, YPF 3er Loop, Sierra Grande, Acueducto, Las Flores, Santa Fe, San Luis y Lima Perú).
    - Marcadores con código de estado (verde operativo / rojo alerta) y tamaño proporcional a la latencia RTT ICMP.
    - Inventario y tabla detallada de conectividad por región y capacidad de enlace.
    - URL Directa: `http://172.27.210.154:3005/d/milicic-geomap-wan-sdwan/ad60123`.
  * **Despliegue y Optimización de Plano Arquitectónico y Weathermap Campus SRO (`milicic-canvas-campus-sro`):**
    - Construcción de Weathermap Arquitectónico Interactivo de Alta Fidelidad mediante `volkovlabs-echarts-panel` con 4 zonas de edificios (Edificio Gris PB Datacenter, Edificio Blanco Administración, Galpón 01 Pañol/Talleres, Edificio E03 Oficinas Técnicas) y Sala de Baterías UPS Liebert.
    - Telemetría en tiempo real inyectada directamente en los enlaces troncales de fibra óptica (`Te1/0/8` Galpones, `Te1/0/5` Edificio Blanco, `TRK1` Edificio E03, `Te1/0/20` LAG 20G Inter-Core, Uplink 1930) con etiquetas dinámicas de RX/TX bps y animación de flujo de partículas.
    - Corrección integral del item `TRK1` de Edificio E03: apuntado al host real `SRO-E03-P00-D03` (10726) con item `Interface TRK1(Core03 (dowlink)): Bits received` resolviendo el síntoma "No data" (tráfico activo ~47.1 Mbps).
    - Fila de 6 KPI Stat Cards de salud troncal y telemetría de energía (Potencia 2.05 kW, Autonomía 116 min).
    - Paneles Timeseries para monitoreo histórico de fibra óptica y perfil de consumo del Datacenter Core.
    - URL Directa: `http://172.27.210.154:3005/d/milicic-canvas-campus-sro/668105c`.
  * **Despliegue de Dashboard NOC Command Wallboard 24/7 (`milicic-noc-wallboard`):**
    - Diseñado con estándares de alta visibilidad para pantallas gigantes de TV / videowall de sala de operaciones (Modo Kiosk).
    - Métricas glanceables de WAN Border (TASA + Claro), Inter-Core LAG 20G, Troncal Galpón 01, Potencia Datacenter y Autonomía UPS.
    - Fila de salud global de flota (Disponibilidad Core 10G, CPU Core01, Carga UPS Liebert, Estado FortiGate).
    - Gráfico comparativo de tráfico WAN e histórico de utilización de CPU en nodos vitales.
    - Ticker en vivo de incidentes de red activos (Zabbix Problems) con badges corporativos por severidad y timestamps humanos.
    - URL Directa: `http://172.27.210.154:3005/d/milicic-noc-wallboard/5ff170b`.
  * **Despliegue de Matriz de Calidad WAN & Latencia SD-WAN (`milicic-noc-latency-matrix`):**
    - Arquitectura inspirada en Smokeping / RTT Quality Grid para monitoreo de 12 frentes mineros, viales y sedes.
    - Grilla de 12 tiles individuales de latencia con semáforo por umbrales y sparkline histórico.
    - Gráfico superpuesto continuo de latencia RTT de todas las sedes para detección inmediata de caídas de proveedores de fibra andina/nacional.
    - Bar Gauge de pérdida de paquetes ICMP (%) en tiempo real.
    - Curva de balance de tráfico SD-WAN (TASA vs Claro).
    - URL Directa: `http://172.27.210.154:3005/d/milicic-noc-latency-matrix/bf38207`.
  * **Despliegue de SRE Golden Signals & Infrastructure Service Cockpit (`milicic-noc-sre-cockpit`):**
    - Implementación de los 4 Golden Signals de Google (Latencia, Tráfico, Errores, Saturación) y metodología USE de Brendan Gregg.
    - 6 Service Tiers jerárquicos (Perímetro WAN, Core 10G Dell Stack, Clúster ESXi, Storage SAN MSA, Active Directory FSMO, Respaldo UPS).
    - Indicadores de saturación de recursos (CPU Core switches, Zabbix poller, servidores Windows y consumo de energía).
    - Consola de navegación centralizada hacia todos los mapas y tableros NOC de la compañía.
    - URL Directa: `http://172.27.210.154:3005/d/milicic-noc-sre-cockpit/ebe78a1`.
  * **Playlist Automática Rotativa NOC 24/7 (`Milicic NOC 24/7 Rotativo`):**
    - Configurada en Grafana (UID: `ffz89pyzauccge`) para rotación automática continua cada 45 segundos entre los 6 tableros principales.
    - URL Kiosk Directa: `http://172.27.210.154:3005/playlists/play/ffz89pyzauccge?kiosk`.
  * **Despliegue de Dashboard Superador Sede San Juan (`milicic-sanjuan-infra`):**
    - Rediseño y evolución completa del tablero original de San Juan integrando estándares corporativos Milicic, metodologías USE y los plugins más avanzados (`volkovlabs-echarts-panel`, `marcusolsson-dynamictext-panel`).
    - **Header Bar NOC:** Banner de estado regional con badge interactivo de salud en vivo, subnet `172.26.10.0/24` y enlaces cruzados a Zabbix Web y Datacenter Central.
    - **6 Stat KPI Cards:** Latencia RTT WAN a Rosario Hub vía túnel IPsec SD-WAN (~0.3 ms), disponibilidad del Core Switch `SSJ-CORE01` (100%), Switch Adm `SSJ-SWADM` (100%), CPU del hipervisor físico `SSJ-HPV01` (~0.55%), ocupación del volumen de datos de `SSJ-FIL01` (~65.5%) y estado del NAS QNAP `SSJ-NAS01`.
    - **Topología Nodal Interactiva ECharts:** Grafo interactivo de 6 categorías (WAN FortiGate, Switches Aruba, Hipervisor Hyper-V, Máquinas Virtuales, Storage NAS y Hub Central SRO) con badges de RTT y CPU en vivo, curvas Bezier y resaltado por adyacencia.
    - **Panel de Métricas USE Multi-Host:** Series de tiempo simultáneas de latencia ICMP y utilización de CPU de todos los hosts, junto a bar gauges de pérdida de paquetes y ocupación porcentual de particiones de disco (`C:`, `D:`, `E:`, `F:`).
    - **Mesa de Incidentes Activos Zabbix (Problems):** Tabla filtrada exclusivamente para los 9 nodos de San Juan con severidades semafóricas, timestamps humanizados, nombres de host limpios y enlaces directos a Zabbix.
    - URL Directa: `http://172.27.210.154:3005/d/milicic-sanjuan-infra/ea24b36`.
  * **Acceso Directo al Mapa de Zabbix:** `https://zabbix.mlccnet.local/zabbix.php?action=map.view&sysmapid=12&severity_min=1`.

### 25/09/2026: Migración TimescaleDB — Resolución AUD-006 (PND-003)
- **Diagnóstico:** Alerta recurrente `Utilization of housekeeper processes over 75%` (triggerid: 13473). Housekeeper al 100% constante durante semanas.
- **Causa Raíz Identificada:** `ZBX_ENABLE_TIMESCALEDB=true` estaba configurado en el contenedor `zabbix-server` y la extensión TimescaleDB 2.24.0 estaba instalada en `zabbix-postgresql`, pero las 7 tablas de series temporales (`history*`, `trends*`) nunca fueron convertidas a **hypertables**. Zabbix realizaba `DELETE` fila por fila sobre tablas PostgreSQL planas de hasta 33 GB (`history_uint`).
- **Descartado:** Agregar vCPUs a la VM (el housekeeper es single-thread e I/O-bound, no CPU-bound).
- **Solución Aplicada — PND-003:**
  - Detención del contenedor `zabbix-server` para migración sin bloqueos de escritura.
  - Migración de 7 tablas (~46 GB totales) a hypertables con `create_hypertable()` y `by_range('clock', segundos)` (intervalo entero, no INTERVAL, porque `clock` es tipo `integer`).
  - La migración de `history_uint` (33 GB) tomó ~2.5 horas. Sobrevivió un corte de VPN porque el proceso `psql` corre dentro del contenedor Docker, independiente de la sesión SSH.
  - Creación de función `unix_now() RETURNS integer` y registro con `set_integer_now_func()` en las 7 hypertables.
  - 7 retention policies configuradas: 2.678.400 seg (31 días) para history*, 31.536.000 seg (365 días) para trends*.
  - HK interno de History y Trends deshabilitado en **Administration → General → Housekeeping**.
  - `ZBX_MAXHOUSEKEEPERDELETE`: pendiente de actualización de 2000 → 5000 vía Portainer (stack `zabbix`).
    - Acceso a Portainer desde VPN/remoto: `ssh -L 9443:127.0.0.1:9443 root@172.30.20.61` → `https://127.0.0.1:9443`
- **Estado Post-Cambio:** 7 hypertables operativas (90 chunks en history*, 10 en trends*). Utilización del housekeeper esperada: <5%.
- **Entregable:** [PND-003 PDF](../pendientes/PND-003-TIMESCALEDB-HOUSEKEEPER-MIGRATION/MILICIC-PND-003-TIMESCALEDB-MIGRATION.pdf) | [Runbook](../pendientes/PND-003-TIMESCALEDB-HOUSEKEEPER-MIGRATION/runbook-tecnico.md)

---

## 4. Tareas Pendientes Priorizadas (Actualizadas 25/09/2026)

1. **Resolver Destino de Telegram para `mlarenti.zabbix`:**
   - Validar en el perfil de Zabbix el Chat ID configurado en el medio 71 (`Telegram_Test`).
   - Confirmar si el bot `@inframilicic_bot` tiene permisos en el grupo/supergrupo de destino o si falta el prefijo `-100`.

2. **Implementar Telemetría de Veeam en `SSJ-BKP01`:**
   - Ejecutar en PowerShell el script `scripts/Get-VeeamVmBackupStatus.ps1 -VmName SSJ-HPV01`.
   - Configurar UserParameter/Zabbix Sender para alimentar el dashboard `milicic-backup-continuidad`.

3. **Consolidar Endpoint Duplicado G01 (192.168.0.224):**
   - Actualizar 9 widgets en Dashboard NOC 408 para apuntar a `DIS01` (10799) en lugar de `D04` (10713).
   - Deshabilitar `D04` una vez migradas todas las referencias.

4. **Almacenamiento VMware y Datastores:**
   - Validar capacidad y estado de `Datastore_R5_HDD` y `Datastore_R5_SSD`.
   - Investigar estado del storage HPE MSA 2060 (`SRO-STO01`).

5. **Weathermap de Red en Grafana:**
   - Configurar el plugin `knightss27-weathermap-plugin` con la topología de red de Milicic para visualizar utilización de enlaces en tiempo real.

6. **Despliegue de Plantilla de Auditoría de Seguridad en SSJ-DCO01:**
   - El host SSJ-DCO01 (10715) **no tiene** los items `Eventlog by Zabbix agent: Failed Login` ni `User locked` — solo SRO-DCO01 y SRO-DCO02 los tienen. Evaluar el despliegue del template de eventos de seguridad en el DC de San Juan para homologar la cobertura de Cyber SOC al 100%.

