# 📋 Documentación Operativa: NOC Zabbix Command Center
> **Herramienta:** Grafana 11.x / Dokploy  
> **Datasource:** Zabbix 7.0 LTS (`alexanderzobnin-zabbix-datasource`)  
> **UID Dashboard:** `noc-zabbix-command-center`  
> **URL:** [http://172.27.210.154:3005/d/noc-zabbix-command-center](http://172.27.210.154:3005/d/noc-zabbix-command-center?from=now-1h&to=now&timezone=browser&var-datasource=efz4nzx8r30g0c&var-sede=.%2A&var-min_severity=2&var-ack_status=2&refresh=30s)  
> **Compatibilidad:** Optimizado para Microsoft Loop / Microsoft Teams Wiki.

---

## 📌 Variables y Filtros Globales (Templating)

| Variable | Tipo | Opciones / Formato | Propósito Operativo |
| :--- | :--- | :--- | :--- |
| **`$datasource`** | Datasource | Zabbix (`efz4nzx8r30g0c`) | Fuente de telemetría de monitoreo Zabbix 7.0. |
| **`$sede`** | Regex / Dropdown | `.*` (Todas), `SRO`, `SSJ`, `OBRAS`, etc. | Filtra los paneles por ubicación geográfica o proyecto. |
| **`$min_severity`** | Severidad | `Warning`, `Average`, `High`, `Disaster` | Umbral mínimo para mostrar problemas en la lista activa. |
| **`$ack_status`** | Estado Ack | Todos, No reconocidos, Reconocidos | Muestra incidentes pendientes de atención o gestionados. |

---

## 1. 🎛️ Cabecera & KPIs Ejecutivos de Salud

### 1.1 Último dato recibido
- **ID:** `16` | **Tipo:** `Stat` (`dateTimeFromNow`)
- **Propósito:** Latido (*Heartbeat*) del motor de monitoreo. Verifica que el servidor Zabbix esté recolectando datos en tiempo real.
- **Métrica Zabbix:** `Zabbix agent ping` en host `Zabbix server`.
- **Interpretación:**
  * 🟢 **Hace segundos:** Motor en línea y recolectando telemetría normalmente.
  * 🔴 **> 2 minutos:** Detención potencial del proceso `zabbix_server` o saturación de cola de polling.

### 1.2 Nodos Monitoreados
- **ID:** `3` | **Tipo:** `Stat`
- **Propósito:** Censo total de hosts físicos, virtuales y de red activos con respuesta a polling ICMP o agente.
- **Métrica Zabbix:** Items `ICMP ping` y `agent.ping` filtrados por `$sede`.
- **Interpretación:** Inventario consolidado de equipos bajo supervisión continua en la sede seleccionada.

### 1.3 Salud Global (Disponibilidad)
- **ID:** `7` | **Tipo:** `Gauge` (%)
- **Propósito:** Nivel general de servicio (SLA/SLI) instantáneo de conectividad en toda la infraestructura.
- **Métrica Zabbix:** Ratio de hosts respondiendo exitosamente al ping (`ICMP ping` / `agent.ping`).
- **Umbrales:**
  * 🟢 **≥ 96%:** Operación óptima y red sin degradación relevante.
  * 🟡 **92% - 95.9%:** Degradación leve o sedes remotas puntuales en mantenimiento.
  * 🟠 **85% - 91.9%:** Incidente moderado en múltiples puntos de la red.
  * 🔴 **< 85%:** Incidente mayor (caída de enlace troncal, corte masivo de energía).

### 1.4 Incidentes Críticos (Disaster / High)
- **ID:** `4` | **Tipo:** `Stat`
- **Propósito:** Contador de problemas activos clasificados como P1 (Disaster / High) que requieren respuesta inmediata 24/7.
- **Métrica Zabbix:** Disparadores activos en Zabbix (`queryType: Problems`) con severidad `High` y `Disaster`.
- **Umbrales:** 🟢 `0` incidentes | 🔴 `≥ 1` incidente crítico abierto (Impacta directamente en operaciones).

### 1.5 Alertas Preventivas (Warning / Average)
- **ID:** `5` | **Tipo:** `Stat`
- **Propósito:** Contador de desvíos operativos P2/P3 que no implican corte de servicio inmediato (ej. disco > 85%, enlace redundante caído).
- **Métrica Zabbix:** Disparadores activos con severidad `Warning` y `Average`.
- **Umbrales:** 🟢 `0` alertas | 🟡 `≥ 1` alerta preventiva abierta (Requiere seguimiento diurno o programado).

### 1.6 Zabbix Server
- **ID:** `2` | **Tipo:** `Stat`
- **Propósito:** Estado de salud del sistema central de monitoreo.
- **Métrica Zabbix:** `Zabbix agent ping` en host `Zabbix server`.
- **Estados:** 🟢 **ONLINE** (`1`) | 🔴 **CAÍDO** (`0`) | ⚪ **SIN DATOS**.

### 1.7 Perímetro SD-WAN (FortiGates)
- **ID:** `8` | **Tipo:** `Stat` (Malla de mosaicos)
- **Propósito:** Disponibilidad instantánea individual de cada firewall de borde y sedes remotas.
- **Métrica Zabbix:** `ICMP ping` en grupo `FortiGate`.
- **Estados:** 🟢 **UP** | 🔴 **DOWN** (Firewall inaccesible / enlace caído) | ⚪ **SIN DATOS**.

### 1.8 Infraestructura Core & Servidores (Cómputo & Storage)
- **ID:** `9` | **Tipo:** `Stat` (Malla de mosaicos)
- **Propósito:** Supervisión individual de 26 hosts clave (hipervisores VMware/Proxmox, DC, bases de datos SQL, storage y backup).
- **Métrica Zabbix:** `ICMP ping` y `agent.ping` en grupos de cómputo, storage y servidores de aplicaciones.
- **Estados:** 🟢 **UP** | 🔴 **DOWN** | ⚪ **SIN DATOS**.

### 1.9 Redes (Switches) y APs (Aruba)
- **ID:** `10` | **Tipo:** `Stat` (Malla de mosaicos)
- **Propósito:** Estado de conmutación LAN y cobertura inalámbrica corporativa.
- **Métrica Zabbix:** `ICMP ping` en grupos `switch`, `ARUBA APs` y `ANTENAS P2P`.
- **Estados:** 🟢 **UP** | 🔴 **DOWN** | ⚪ **SIN DATOS**.

### 1.10 Facilities & Energía (UPS)
- **ID:** `11` | **Tipo:** `Stat` (Malla de mosaicos)
- **Propósito:** Operatividad de unidades de energía ininterrumpida en datacenters y salas de comunicaciones.
- **Métrica Zabbix:** Tensión de entrada de red (`Ups Input Voltage` / `Input phase 1 voltage`).
- **Estados:** 🟢 **ONLINE** (Tensión entre 180V y 260V) | 🔴 **DOWN / CORTE** (<180V o sin red) | ⚪ **SIN DATOS**.

### 1.11 Feed de Incidentes Activos en Tiempo Real
- **ID:** `12` | **Tipo:** `Zabbix Triggers Panel`
- **Propósito:** Consola central de problemas en vivo con filtrado dinámico por sede, severidad y estado de reconocimiento.
- **Métrica Zabbix:** Problemas activos (`queryType: 5`) ordenados cronológicamente por criticidad.
- **Uso:** El operador puede identificar causa raíz, duración del problema y confirmar si el evento fue notificado por Telegram.

---

## 2. ⚡ Facilities & Energía (Datacenters y Salas Técnicas)

### 2.1 Tensión de Entrada UPS (V)
- **ID:** `17` | **Tipo:** `Stat` (Voltios)
- **Propósito:** Detección de sobretensión, baja tensión o corte de suministro eléctrico comercial (red 220V).
- **Métrica Zabbix:** `Input Voltage` / `Input phase 1 voltage` en grupo `UPS`.
- **Umbrales:**
  * 🔴 **< 190 V:** Tensión crítica baja o corte con UPS operando en batería.
  * 🟡 **190 - 205 V:** Subtensión moderada.
  * 🟢 **205 - 245 V:** Rango nominal de red eléctrica comercial.
  * 🟡 **245 - 255 V:** Sobretensión preventiva.
  * 🔴 **> 255 V:** Sobretensión severa (riesgo para equipamiento).

### 2.2 Autonomía de Baterías UPS (Min)
- **ID:** `28` | **Tipo:** `Stat` (Minutos)
- **Propósito:** Tiempo estimado restante de respaldo en baterías en caso de corte de energía.
- **Métrica Zabbix:** `Battery Time Remaining` en grupo `UPS`.
- **Umbrales:**
  * 🟢 **> 60 min:** Autonomía segura.
  * 🟡 **30 - 60 min:** Ventana de advertencia (requiere verificar grupo electrógeno).
  * 🔴 **< 30 min:** Nivel crítico; inicio de apagado controlado de servidores no esenciales.

### 2.3 Top 5 Datacenters (Carga Eléctrica UPS %)
- **ID:** `14` | **Tipo:** `Bar Gauge` (%)
- **Propósito:** Porcentaje de carga aparente/activa conectada a cada UPS para evitar sobrecargas del inversor.
- **Métrica Zabbix:** `UPS Load (%)` / `Output Load Estimated`.
- **Umbrales:** 🟢 `< 60%` Normal | 🟡 `60% - 80%` Carga media-alta | 🔴 `> 80%` Sobrecarga (Riesgo en conmutación).

---

## 3. 🖥️ Servidores, Cómputo & Almacenamiento

### 3.1 Top 5 Servidores (Consumo CPU %)
- **ID:** `13` | **Tipo:** `Bar Gauge` (%)
- **Propósito:** Identifica los 5 servidores con mayor estrés de procesamiento (excluye switches y routers).
- **Métrica Zabbix:** `CPU utilization` en servidores Windows, Linux, VMs y DCs.
- **Umbrales:** 🟢 `< 75%` Saludable | 🟡 `75% - 90%` Elevado | 🔴 `> 90%` Saturación sostenida de CPU.

### 3.2 Top 5 Servidores (Consumo RAM %)
- **ID:** `18` | **Tipo:** `Bar Gauge` (%)
- **Propósito:** Detecta los servidores con mayor presión sobre la memoria física.
- **Métrica Zabbix:** `Memory utilization`.
- **Umbrales:** 🟢 `< 75%` Normal | 🟡 `75% - 90%` Alerta preventiva | 🔴 `> 90%` Riesgo de *Out of Memory* / Thrashing.

### 3.3 Top 5 Servidores (Uso de Disco %)
- **ID:** `19` | **Tipo:** `Bar Gauge` (%)
- **Propósito:** Identifica volúmenes y particiones de sistema operativo o datos con mayor ocupación porcentual.
- **Métrica Zabbix:** Expresión regular sobre filesystems (`C:`, `/`, etc.).
- **Umbrales:** 🟢 `< 80%` Capacidad adecuada | 🟡 `80% - 90%` Advertencia | 🔴 `> 90%` Capacidad crítica (Peligro de bloqueo de servicios/bases de datos).

### 3.4 Top 5 Storage SAN HPE MSA (Carga IOPS)
- **ID:** `23` | **Tipo:** `Bar Gauge` (IOPS)
- **Propósito:** Mide la demanda de entrada/salida por segundo en los disk pools y grupos de la SAN corporativa HPE MSA.
- **Métrica Zabbix:** `Disk group .*: IOPS, total rate`.
- **Umbrales:** 🟢 `< 100 IOPS` Normal | 🟡 `100 - 300 IOPS` Demanda media | 🔴 `> 300 IOPS` Cuello de botella en storage.

### 3.5 Matriz de Servidores & Roles Críticos
- **ID:** `26` | **Tipo:** `Table`
- **Propósito:** Vista tabular detallada de cada servidor evaluando en una sola fila: Conectividad Ping, CPU (%), RAM (%) y Espacio en Disco C: (%).
- **Uso:** Diagnóstico rápido de capacidades sin necesidad de abrir múltiples gráficos.

---

## 4. 🌐 Conectividad WAN, SD-WAN & Perímetro

### 4.1 Tráfico de Sesiones Activas (FortiGates SD-WAN)
- **ID:** `15` | **Tipo:** `Time Series` (Sesiones concurrentes)
- **Propósito:** Evolución en el tiempo del volumen de sesiones de red cursadas por los firewalls corporativos.
- **Métrica Zabbix:** `IPv4 Active sessions` en grupo `FortiGate`.
- **Uso:** Detección de picos inusuales de tráfico, escaneos de red o saturación de tabla NAT.

### 4.2 Teletrabajo (VPN SSL Activas)
- **ID:** `24` | **Tipo:** `Stat` (Conexiones)
- **Propósito:** Cantidad de colaboradores conectados concurrentemente mediante túneles FortiClient VPN SSL hacia la sede central.
- **Métrica Zabbix:** `Active SSL VPN users` en `milicic_border1`.
- **Umbrales:** 🔵 `0 - 10` Base | 🟢 `10 - 60` Horario laboral estándar | 🟡 `> 60` Alta concurrencia.

### 4.3 Borde Central: Balanceo ISP (Telecom TASA vs Claro)
- **ID:** `29` | **Tipo:** `Time Series` (bps / Mbps)
- **Propósito:** Supervisa el consumo en tiempo real de ancho de banda entrante (In) y saliente (Out) de los dos enlaces primarios de Internet en el Borde Rosario (`port14` Claro y `port15` Telecom).
- **Uso:** Comprobar la simetría de carga y balanceo SD-WAN y detectar congestión de salida a la nube.

### 4.4 Malla de Túneles IPsec Core (Rosario ➔ San Juan & SAP Cloud)
- **ID:** `30` | **Tipo:** `Stat`
- **Propósito:** Estado de salud de los túneles IPsec de alta disponibilidad entre Sedes Centrales (Rosario - San Juan) y conectividad con SAP Cloud.
- **Métrica Zabbix:** `VPN (sap-pri|ros1sj1|ros1sj2|ros2sj1|ros2sj2|sap-bkp).*: Tunnel Status`.
- **Estados:** 🟢 **UP (Activo)** (`2`) | 🔵 **STANDBY** (`1`) | 🔴 **DOWN** (`0`).

### 4.5 Top 5 Sedes WAN (Mayor Latencia Ping ms)
- **ID:** `20` | **Tipo:** `Bar Gauge` (Segundos / Milisegundos)
- **Propósito:** Identifica las sedes u obras con mayor demora de ida y vuelta en su enlace.
- **Métrica Zabbix:** `ICMP response time`.
- **Umbrales:** 🟢 `< 50 ms` Óptimo | 🟡 `50 - 100 ms` Aceptable (Enlaces remotos 4G/Satelital) | 🔴 `> 100 ms` Enlace degradado.

### 4.6 Top Sedes WAN (Pérdida de Paquetes ICMP %)
- **ID:** `22` | **Tipo:** `Bar Gauge` (%)
- **Propósito:** Alerta sobre pérdida de paquetes (*packet drop*) en sedes remotas y minería.
- **Métrica Zabbix:** `ICMP loss`.
- **Umbrales:** 🟢 `0%` Enlace limpio | 🟡 `1% - 5%` Degradación leve/jitter | 🔴 `> 5%` Enlace inestable (Cortes en VoIP/VPN).

### 4.7 Top 5 Enlaces WAN / Internet (Ancho de Banda)
- **ID:** `21` | **Tipo:** `Bar Gauge` (bps / Mbps)
- **Propósito:** Ranking de interfaces WAN con mayor consumo de ancho de banda entrante en tiempo real.
- **Métrica Zabbix:** Bits recibidos en interfaces `wan`, `internet`, `claro`, `tasa`, etc.
- **Umbrales:** 🟢 `< 50 Mbps` | 🟡 `50 - 100 Mbps` | 🔴 `> 100 Mbps` (Saturación de boca).

### 4.8 Tendencia Comparativa de Tráfico WAN por Sede / Proyecto
- **ID:** `27` | **Tipo:** `Time Series` (bps / Mbps)
- **Propósito:** Curvas históricas comparadas de consumo de datos por sede a lo largo de la ventana de tiempo seleccionada.

### 4.9 Matriz WAN de Sedes & Enlaces Remotos
- **ID:** `25` | **Tipo:** `Table`
- **Propósito:** Resumen consolidado para todas las sedes: Estado Ping (UP/DOWN), Latencia (ms), Pérdida (%) y Sesiones Activas.

### 4.10 Matriz de Calidad SD-WAN: Pérdida en Overlays (Sedes & Minería)
- **ID:** `162` | **Tipo:** `Table`
- **Propósito:** Monitoreo específico de calidad de servicio (SLA) en túneles SD-WAN IPsec hacia campamentos mineros (Posco, Río Tinto, YPF, Las Flores).
- **Métricas:** Pérdida de paquetes (%) y latencia (ms) de los miembros del grupo SD-WAN.

### 4.11 Detección de Link Flapping: Puertos Inestables (Últimos 7 Días)
- **ID:** `161` | **Tipo:** `Table`
- **Propósito:** Detección de interfaces de acceso con intermitencia continua (>4 caídas/hora en los últimos 7 días).
- **Interpretación:** Si la tabla está vacía, la red está 100% estable. Cualquier puerto listado indica cableado dañado o falla de SFP/puerto.

---

## 5. 🛡️ Cyber SOC & Seguridad de Identidades (Active Directory)

### 5.1 Bloqueos AD (24h)
- **ID:** `151` | **Tipo:** `Stat`
- **Propósito:** Total acumulado de cuentas de usuario bloqueadas en el bosque MLCCNET.LOCAL en las últimas 24 horas (Multi-DC).
- **Métrica Zabbix:** `Total Bloqueos de Cuenta (24h - Multi-DC)` en `SRO-DCO01`.
- **Umbrales:** 🟢 `0` Bloqueos | 🟠 `1 - 4` Bloqueos aislados | 🔴 `≥ 5` Bloqueos simultáneos (Posible ataque o cambio de clave no actualizado).

### 5.2 Fallos Logon (24h)
- **ID:** `152` | **Tipo:** `Stat`
- **Propósito:** Total de intentos fallidos de autenticación (Event ID 4625) registrados en todos los controladores de dominio.
- **Métrica Zabbix:** `Total Intentos Fallidos (24h - Multi-DC)`.
- **Umbrales:**
  * 🟢 **< 400:** Tráfico normal de fondo en la red corporativa.
  * 🟡 **400 - 1,000:** Incremento leve de intentos fallidos.
  * 🟠 **1,000 - 2,500:** Alerta de reintentos anómalos.
  * 🔴 **> 2,500:** Alerta crítica: Detección de fuerza bruta o bucle masivo.

### 5.3 Detección de Bucle Kerberos (24h)
- **ID:** `153` | **Tipo:** `Stat`
- **Propósito:** Detección de pre-autenticaciones fallidas repetitivas (Event ID 4771 con código `0x18` = credencial expirada en caché).
- **Métrica Zabbix:** `Fallos Preautenticación Kerberos (24h - Multi-DC)`.
- **Umbrales:** 🟢 `< 500` Normal | 🟡 `500 - 2,000` Bucle detectado en estación | 🔴 `> 2,000` Bucle severo saturando el DC.

### 5.4 Ratio NTLM / Kerberos
- **ID:** `154` | **Tipo:** `Stat` (%)
- **Propósito:** Postura de ciberseguridad sobre protocolos de autenticación. Evalúa qué porcentaje del tráfico utiliza NTLM (legado e inseguro) frente a Kerberos moderno.
- **Métrica Zabbix:** `Ratio Autenticación NTLM / Kerberos (24h)`.
- **Umbrales:** 🟢 `< 15%` Óptimo | 🟡 `15% - 35%` Alerta preventiva | 🟠 `> 35%` Exceso de autenticaciones legadas.

### 5.5 Tasa Horaria de Fallos de Autenticación (Event 4625 · Multi-DC)
- **ID:** `158` | **Tipo:** `Time Series` (Fallos/Hora)
- **Propósito:** Permite visualizar en qué franjas horarias se concentran los fallos de autenticación para diferenciar errores de usuario de ataques automatizados fuera de horario laboral.
- **Métrica Zabbix:** `Tasa de Fallos de Autenticación (1h)` en `SRO-DCO01` y `SRO-DCO02`.

### 5.6 Telemetría de Protocolos: Kerberos vs NTLM Legado
- **ID:** `159` | **Tipo:** `Time Series`
- **Propósito:** Evolución cronológica de la proporción de protocolos y preautenticaciones fallidas para verificar mejoras tras deshabilitar NTLMv1.

### 5.7 Detección Forense Dinámica: Intentos Fallidos & Fuerza Bruta
- **ID:** `160` | **Tipo:** `Table`
- **Propósito:** Telemetría forense en tiempo real que identifica: Nombre de usuario, IP de estación de origen, código Sub-Status de Windows y Controlador de Dominio que atendió el intento.

### 5.8 Detección Forense Dinámica: Bucles Kerberos (Event 4771)
- **ID:** `155` | **Tipo:** `Table`
- **Propósito:** Aísla la estación de trabajo y el usuario exacto que genera bucles continuos de Kerberos por credenciales desactualizadas en navegadores, unidades de red mapeadas o tareas programadas.

### 5.9 Historial Forense de Bloqueos de Cuenta (Event 4740)
- **ID:** `156` | **Tipo:** `Table`
- **Propósito:** Registro forense de los últimos 7 días con la correlación exacta entre usuario bloqueado, equipo de origen (`Caller Computer Name`) y fecha/hora.

### 5.10 Auditoría Forense de Grupos Privilegiados
- **ID:** `157` | **Tipo:** `Table`
- **Propósito:** Trazabilidad de cambios de seguridad (Event IDs 4728, 4732, 4756): Registra quién añadió o removió usuarios de grupos críticos como *Domain Admins*, *Administrators* o *Enterprise Admins*.
