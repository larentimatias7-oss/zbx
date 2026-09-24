# Contexto Operativo e Histórico de Remediaciones (Auditoría ChatGPT)

- **Repositorio Fuente en OneDrive:** `C:\Users\matias.larenti\OneDrive - Milicic SA\Documentos\Zabbix`
- **Entorno:** Producción (`zabbix.mlccnet.local` - `172.30.20.61`)
- **Versión de Zabbix:** 7.0.22 LTS
- **Fecha de Corte y Consolidación:** 23 de Septiembre de 2026

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
| **AUD-006** | Media | Plataforma | Sobrecarga de pollers Zabbix Server | Procesos housekeeper y unreachable poller saturados > 75% por reintentos de equipos offline. | Ajuste de lógicas de timeout y revisión de equipos inalcanzables. |
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

## 4. Tareas Pendientes Priorizadas (Próximos Pasos)

1. **Resolver Destino de Telegram para `mlarenti.zabbix`:**
   - Validar en el perfil de Zabbix el Chat ID configurado en el medio 71 (`Telegram_Test`).
   - Confirmar si el bot `@inframilicic_bot` tiene permisos en el grupo/supergrupo de destino o si falta el prefijo `-100`.
2. **Implementar Telemetría de Veeam en `SSJ-BKP01`:**
   - Ejecutar en una sesión autorizada de PowerShell en el servidor Veeam el script `scripts/Get-VeeamVmBackupStatus.ps1 -VmName SSJ-HPV01`.
   - Analizar el JSON resultante (`matchedJobNames`, `recentAttempts`, `latestRestorePointUtc`) y configurar un UserParameter / Zabbix Sender en Zabbix para alertar sobre fallas de respaldo reales.
3. **Consolidar Endpoint Duplicado G01 (192.168.0.224):**
   - Actualizar los 9 widgets en el Dashboard NOC 408 para que apunten a `DIS01` (10799) en lugar de `D04` (10713).
   - Reemplazar la referencia en el dashboard TEST01 (407) y en el elemento 94 del Mapa Rosario 8.
   - Una vez migradas todas las vistas, deshabilitar `D04` con seguridad.
4. **Almacenamiento VMware y Datastores:**
   - Validar capacidad y estado de `Datastore_R5_HDD` y `Datastore_R5_SSD` en vCenter/ESXi.
   - Investigar estado del storage HPE MSA 2060 (`SRO-STO01`).
