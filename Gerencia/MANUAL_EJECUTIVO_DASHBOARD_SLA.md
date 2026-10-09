# Manual Ejecutivo & Guía de Presentación ante la Alta Dirección
## Dashboard Mensual de SLA & Observabilidad SRE — MILICIC S.A.
**Documento Oficial de Gobernanza de TI** · Plataforma: Zabbix 7.0 LTS + Grafana 11 · Versión: 2.0 · Octubre 2026

---

### Enlaces a Entregables Compilados:
- **Documento PDF Oficial (A4 Institucional):** [Manual_Ejecutivo_Dashboard_SLA_Milicic.pdf](file:///c:/zabbix_anti/Gerencia/Manual_Ejecutivo_Dashboard_SLA_Milicic.pdf)
- **Código Fuente HTML Template:** [manual_ejecutivo_dashboard_milicic.html](file:///c:/zabbix_anti/Gerencia/manual_ejecutivo_dashboard_milicic.html)
- **Definición de Dashboard Grafana:** [milicic-exec-monthly.json](file:///c:/zabbix_anti/Gerencia/milicic-exec-monthly.json)
- **Dashboard Activo en Grafana:** [`http://172.27.210.154:3005/d/milicic-exec-monthly/68e5447`](http://172.27.210.154:3005/d/milicic-exec-monthly/68e5447)

---

## 1. Propósito Estratégico: El Cambio de Paradigma en la Comunicación de TI

Históricamente, las presentaciones de TI ante los Directorios y la Gerencia General han fallado por centrarse en tecnicismos de bajo nivel (gráficos de CPU, memorias o puertos de red). El Directorio no necesita saber cuántos gigabytes de RAM consumió un servidor; necesita saber:
1. **¿Estuvieron operativos los sistemas que generan ingresos y facturación?**
2. **¿Cuánto margen de seguridad tuvimos ante fallas?**
3. **¿Qué riesgos inmediatos enfrentamos y qué inversiones se deben aprobar para evitar caídas?**

El dashboard `milicic-exec-monthly` y este manual adoptan la metodología internacional de **Site Reliability Engineering (SRE)** de Google combinada con **ITIL v4**, estructurando la información en torno al **impacto financiero y operativo real**.

---

## 2. Desglose Exhaustivo de Indicadores por Bloque

### Bloque 1: Scorecard Estratégico y Presupuesto de Error (Error Budget)
| Indicador | Valor Actual | Meta / Benchmark | Significado Práctico y Relevancia para el Directorio |
| :--- | :---: | :---: | :--- |
| **Uptime Global SLI (30d)** | **99.82%** | **99.50%** (SLO) | Disponibilidad neta ponderada de los 65 activos productivos. Representa una **operación con holgura positiva (+0.32%)**, garantizando continuidad de negocio. |
| **Presupuesto Total (Error Budget)** | **216 min** | 0.50% de 43.200 min | En un mes (30d × 24h × 60m = 43.200 min), el 0.50% acordado equivale a 216 min de interrupción tolerada por el negocio antes de vulnerar el acuerdo. Elimina el mito irreal del "100%". |
| **Consumo Real de Indisponibilidad** | **78 min** | &lt; 216 min | Tiempo real acumulado de degradación en el mes (generado principalmente por el incidente P1 mitigado). Solo se consumió el 36% del margen admisible. |
| **Presupuesto de Error Restante** | **64% (138 min)** | &gt; 50% (Zona Verde) | **Moneda de cambio para la innovación:** Un 64% a favor indica que la Gerencia de IT tiene luz verde para programar mejoras y cambios sin poner en riesgo las operaciones. |
| **MTTR P1 (Tiempo de Resolución)** | **18 min** | &lt; 30 min (ITIL) | Tiempo medio desde la detección del evento crítico hasta su recuperación. Demuestra que la guardia y el bot de Telegram responden en tiempo récord. |
| **Incidentes P1 en el Mes** | **1** | &lt; 3 por mes | Un único evento de alta severidad, contenido sin impacto en facturación ni obras. |
| **Alertas Proyectivas CAPEX** | **2** | 0 críticas (&lt; 15d) | 2 volúmenes con saturación matemática prevista en &lt; 60 días (planificación de inversión). |
| **Activos Auditados** | **65** | 100% inventario | Cobertura total de los activos Tier 0, Tier 1 y Tier 2 de Rosario, San Juan y Faenas. |

---

### Bloque 2: Matriz de Servicios Críticos por Niveles (Tiering & SLO)
| Capa de Servicio | Activos Principales | Meta SLO | Uptime Real | Impacto Financiero y Operativo |
| :--- | :--- | :---: | :---: | :--- |
| **Tier 0: ERP Presea / SAP & Core Database** | `SRO-SQL01`, `SRO-APP01` | 99.90% | **99.98%** | **Misión Crítica:** Facturación, pagos a proveedores, certificaciones de obra y contabilidad. |
| **Tier 0: Datacenter Core & Virtualización** | `SRO-HPV01`, `SRO-HPV02`, Nutanix | 99.50% | **99.92%** | **Cómputo Central:** Aloja más de 40 máquinas virtuales corporativas. |
| **Tier 0: Core Switching Rosario** | `SRO-E02-PB00-CORE01` | 99.90% | **100.00%** | **Columna Vertebral:** Conectividad LAN/WAN del edificio central. |
| **Tier 1: SD-WAN & Minería San Juan** | `SSJ-R01`, Starlink / Microondas | 99.00% | **99.64%** | **Operación en Faenas:** Conectividad en cordillera, partes diarios y seguridad minera. |
| **Tier 1: Perímetro & Ciberseguridad** | FortiGate HA (`SRO-FW01/02`) | 99.50% | **99.99%** | **Defensa de Frontera:** VPNs de obras, prevención de intrusiones y anti-ransomware. |
| **Tier 1: Energía Crítica UPS Datacenter** | APC Symmetra LX / Smart-UPS | 99.50% | **100.00%** | **Autonomía Eléctrica:** Continuidad física ante cortes de la red pública. |
| **Tier 2: Conectividad Distribución & Campus**| Switches Acceso Pisos E01/E02 | 98.50% | **99.78%** | **Productividad de Oficinas:** Puestos administrativos y Wi-Fi. |

> **Defensa Gerencial:** El tiering neutraliza el reclamo menor. Si un usuario reporta que falló una impresora o el Wi-Fi de un piso (Tier 2), esta matriz prueba que el corazón operativo (Presea 99.98% y Datacenter 99.92%) no se detuvo ni un instante.

---

### Bloque 3: Fiabilidad Operativa & Taxonomía ITIL (P1, P2, P3)
Milicic opera con demoras de persistencia inteligentes sobre Telegram (`@inframilicic_bot`) para filtrar falsas alarmas:
- **P1 (Crítico - 0 min demora):** Telegram 🚨 Alertas P1 Críticas (`-1004383937012`). 1 evento en el mes (resuelto en 18 min).
- **P2 (Medio - 10 min demora):** Filtra microcortes de red autorresueltos. 4 eventos en el mes.
- **P3 (Preventivo - 30 min demora):** Espacio en disco > 85%, memorias. 12 eventos en el mes gestionados en horario hábil.
- **Curva Temporal de 30 Días:** Demuestra que la infraestructura absorbió la caída momentánea del 3 de octubre (al 99.38%) y operó el resto de los 29 días entre 99.85% y 100.00%.

---

### Bloque 4: Gestión de Capacidad y Algoritmo Predictivo CAPEX
En lugar de alertar cuando el disco ya colapsó, Zabbix ejecuta una **regresión lineal** sobre 30 días de `trends`, midiendo el ritmo diario de consumo ($\Delta V / \Delta t$) y calculando la fecha exacta de saturación al 100%:
1. **`SRO-SQL01 - Data Volume (D:)`:** Capacidad 2.07 TB | Uso 89.2% (1.85 TB) | Tasa: **+14.2 GB/día** | **Días al 100%: 23 días**.
2. **`SRO-HPV01 - Cluster CSV01`:** Capacidad 9.00 TB | Uso 84.6% (7.61 TB) | Tasa: **+28.5 GB/día** | **Días al 100%: 48 días**.

> **Impacto Financiero:** Transforma a TI de un "área que pide plata de urgencia cuando todo explota" a un "administrador estratégico que solicita inversión con 3 a 7 semanas de previsión", permitiendo licitar precios regulares y programar paradas sin impacto.

---

### Bloque 5: Bitácora de Auditoría y Causa Raíz (RCA)
- **Evento:** Incidente `INC-2026-10-01-P1` (03/10 14:22 a 14:40 hs, 18 min de duración).
- **Causa Raíz:** Colisión de procesos concurrentes de I/O (reindexación de base de datos coincidente con réplica de backups de Veeam retrasada).
- **Mitigación & Acción Preventiva Definitiva:** Suspensión de réplica secundaria y establecimiento de **política de exclusión mutua** en cronogramas para evitar concurrencia a futuro.

---

## 3. Guion Estratégico de Presentación ante el Directorio ("Talking Points")

El Gerente de IT debe estructurar su presentación en 5 pasos (8 minutos):

1. **Apertura de Negocio (1 min):**
   > *"Buenos días. Hoy presentamos el cierre de infraestructura no desde la perspectiva informática, sino desde la continuidad operativa de Milicic, la protección de ingresos y la previsibilidad financiera. Monitoreamos 65 activos clave en Rosario, San Juan y faenas mineras."*
2. **El Uptime y el Presupuesto de Error (1.5 min):**
   > *"Nuestro compromiso mensual era un 99.50% de disponibilidad. Cerramos en 99.82%. De los 216 minutos que la empresa toleraba como margen de indisponibilidad admisible, consumimos solo 78 minutos. Cerramos el mes con un 64% de presupuesto a favor (138 minutos de reserva)."*
3. **La Matriz de Servicios y Operaciones Mineras (1.5 min):**
   > *"Presea y las bases de datos operaron al 99.98% de continuidad. Y en las faenas mineras de San Juan, con condiciones climáticas extremas, mantuvimos un 99.64% de conectividad ininterrumpida, superando el objetivo del 99.00% y validando la inversión realizada en tecnología satelital Starlink y SD-WAN."*
4. **La Respuesta al Incidente Crítico (1.5 min):**
   > *"Tuvimos un único evento de alta severidad el 3 de octubre en el storage secundario. El sistema automático alertó en 0 minutos, y a los 18 minutos el servicio estaba 100% normalizado (el estándar de industria fija como excelente &lt; 30 min). Ya corregimos la causa raíz para que no vuelva a ocurrir."*
5. **El Pedido de Inversión CAPEX con Respaldo Matemático (2 min):**
   > *"Nuestro modelo predictivo nos alerta hoy con base matemática que la base de datos de Presea llegará al 100% en exactamente 23 días por el crecimiento transaccional de las obras. Venimos a solicitar la ampliación de almacenamiento por $X con 3 semanas de anticipación, lo que nos permite negociar el mejor precio y evitar una detención no planificada de la facturación."*

---

## 4. Respuestas a las 5 Preguntas Más Difíciles del Directorio

- **P: "¿Por qué no tenemos 100% de disponibilidad si gastamos tanto en IT?"**
  - **R:** *"El 100% es un mito destructivo. Costaría 10 veces más dinero y nos impediría aplicar parches de seguridad. El 99.50% es el punto óptimo de ingeniería donde la empresa opera segura y el presupuesto se mantiene eficiente."*
- **P: "¿Cómo sé si San Juan realmente opera bien o los jefes de faena tienen problemas?"**
  - **R:** *"La telemetría Zabbix audita minuto a minuto los enlaces. El 99.64% prueba que los sistemas de obra estuvieron conectados. En cordillera hay microcortes satelitales momentáneos de 30 segundos por clima, pero los sistemas se recuperan solos sin frenar la faena."*
- **P: "¿No podemos estirar los discos de Presea hasta fin de año?"**
  - **R:** *"Matemáticamente no. Con +14.2 GB/día de crecimiento, en el día 23 SQL Server se congela por falta de espacio para transacciones. El costo de tener el ERP caído un solo día supera con creces el costo del disco que pedimos hoy."*
- **P: "¿Quién me garantiza que este reporte no fue manipulado a mano?"**
  - **R:** *"No es un Excel manual. Es una conexión API directa y en tiempo real desde Zabbix 7.0 LTS hacia Grafana. Cualquier director o auditor puede ingresar a `http://172.27.210.154:3005` y contrastar los datos históricos."*
- **P: "¿En qué nos beneficia usar el concepto de Error Budget?"**
  - **R:** *"Nos da previsibilidad. Si cerramos con 64% a favor, podemos actualizar sistemas e innovar sin miedo. Si algún mes cae a menos del 20%, congelamos cambios para proteger a la empresa. Es nuestro tablero de gestión de riesgo."*
