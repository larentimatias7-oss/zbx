---
name: grafana-milicic-standards
description: >-
  Estándar de observabilidad, arquitectura de paneles y diseño de dashboards en Grafana para Milicic S.A.
  Define el uso de métodos USE y RED, la configuración del datasource Zabbix (alexanderzobnin-zabbix-datasource),
  convenciones de variables de templating y paleta de severidades corporativas.
version: 1.0.0
type: visualization-architect
---

# Grafana Milicic Standards: Métodos de Observabilidad y Dashboards

Esta skill establece las directivas para diseñar tableros de control en Grafana (`http://172.27.210.154:3005`) consumiendo la telemetría de Zabbix mediante el plugin oficial `alexanderzobnin-zabbix-datasource`.

---

## 1. Identidad de Datos y Datasource Configurado

- **Datasource Principal:** `alexanderzobnin-zabbix-datasource`
- **Datasource UID:** `efz4nzx8r30g0c` (por defecto)
- **Modo de Consulta:** JSON-RPC API proxy contra `https://zabbix.mlccnet.local/api_jsonrpc.php`.
- **Estructura de Target en Paneles:**
  ```json
  {
    "datasource": {
      "type": "alexanderzobnin-zabbix-datasource",
      "uid": "efz4nzx8r30g0c"
    },
    "schema": 12,
    "group": { "filter": "<Grupo_o_Variable>" },
    "host": { "filter": "<Host_o_Variable>" },
    "item": { "filter": "/<Regex_de_Metricas>/" },
    "options": {
      "showDisabledItems": false
    }
  }
  ```

---

## 2. Metodología de Observabilidad: USE vs RED

Para evitar dashboards improvisados, estructurar las métricas según el tipo de componente:

### A. Método USE (Infraestructura, Redes, Cómputo, Energía y Almacenamiento)
Aplica a Switches, Routers, Servidores físicos/VMs, VMware ESXi, Datastores y UPS:
1. **Utilization (Utilización):** Porcentaje de tiempo o capacidad en uso productivo.
   - Switches: Tráfico `net.if.in` y `net.if.out` (bps) en relación al ancho de banda del puerto.
   - Servidores: `system.cpu.util`, `vm.memory.util`, espacio en disco % ocupado (`vfs.fs.dependent.size`).
   - UPS: Porcentaje de carga del inversor (`upsOutputPercentLoad`).
   - Datastores: Espacio ocupado en `Datastore_R5_HDD` y `Datastore_R5_SSD`.
2. **Saturation (Saturación):** Trabajo acumulado o en espera que degrada el rendimiento.
   - Switches: Paquetes descartados (`net.if.in.discards`, `net.if.out.discards`).
   - Servidores: CPU run queue, swapping de memoria, pollers saturados.
   - Firewalls: Límite de sesiones concurrentes activas.
3. **Errors (Errores):** Contador de fallos o estados anómalos.
   - Switches: Estado operativo `net.if.status` (down=2), paquetes con error de CRC (`net.if.in.errors`).
   - UPS: Disparador de falla de salida o batería baja (<10 min).
   - Servidores: Servicios críticos detenidos o fallas de ping ICMP.

### B. Método RED (Servicios, Redes WAN, Túneles y Bases de Datos)
Aplica a Enlaces WAN, Túneles IPsec FortiGate, Active Directory, DNS y SQL Server:
1. **Rate (Tasa / Rendimiento):** Volumen de operaciones por segundo.
   - Consultas DNS/AD por segundo, transacciones SQL/seg, paquetes ICMP respondidos.
2. **Errors (Errores):** Tasa de solicitudes fallidas.
   - Intentos de conexión rechazados, fallas de autenticación en controladores de dominio, caídas de túneles VPN.
3. **Duration (Duración / Latencia):** Tiempo que toma procesar una solicitud.
   - Latencia de ping ICMP (`icmppingsec`), jitter y packet loss en SD-WAN, tiempo de respuesta de query SQL.

---

## 3. Convención de Variables de Templating ($group, $host)

Al diseñar tableros dinámicos en Grafana:
* **`$group`:** Query al plugin Zabbix con `queryType: 0` para listar Host Groups.
* **`$host`:** Query dependiente que lista hosts donde `group = $group`.
* **`$interface`:** Query de ítems o etiquetas para seleccionar interfaces de red específicas.

---

## 4. Paleta de Severidad y Colores Corporativos

| Estado / Severidad | Color Hex | Uso en Paneles |
| :--- | :---: | :--- |
| **Normal / OK** | `#73BF69` | Métricas en rango esperado, enlaces activos. |
| **Notice / Info** | `#5794F2` | Estados informativos, cambios de ventana. |
| **Warning (P3)** | `#FFC859` | Advertencias de umbral (>80% disco, carga elevada). |
| **Average (P2)** | `#FFA059` | Degradación, enlaces redundantes caídos. |
| **High (P1)** | `#E97659` | Caída de interfaz troncal, ESXi con alarma. |
| **Disaster (P1)** | `#E45959` | Indisponibilidad total de equipo o corte de energía. |

---

## 5. Arquitectura Estándar de Layout para Dashboards en Grafana (Grid 24 col)

1. **Fila 0 (Header / KPIs Globales):** Paneles tipo *Stat* con números grandes, chispas de tendencia (*sparklines*) y color condicional de fondo.
2. **Fila 1 (Estado Operacional / Mapa / Problemas):** Paneles de tipo *Table* o *Status Grid* listando incidentes activos o estados de enlace.
3. **Fila 2 (Telemetría de Tendencia USE/RED):** Paneles de tipo *Time series* con unidades configuradas explícitamente (`bits/sec`, `percent`, `bytes`, `seconds`).
