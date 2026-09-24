# Informe Técnico y Acta de Remediación: Mitigación de Falsos Positivos & Desactivación Controlada de Alertas Zabbix

**Referencia Interna:** `MIL-PND-002`  
**Fecha de Ejecución:** 23 de Septiembre de 2026  
**Área Emisora:** Infraestructura TI, Telecomunicaciones & Monitoreo SRE  
**Organización:** Milicic S.A.  
**Plataforma de Monitoreo:** Zabbix 7.0.22 LTS en Producción (`https://zabbix.mlccnet.local`)  
**Clasificación:** Confidencial / Uso Interno TI  

---

## 1. Resumen Ejecutivo

Durante las operaciones de monitoreo en tiempo real sobre la infraestructura de Milicic S.A., se identificaron dos alertas recurrentes que generaron notificaciones a través de los canales corporativos de Telegram (`Alertas-Guardia-P1` y alertas de redes):

1. **Incidencia P3 (Preventivo / Warning):** `FortiGate border1: Legacy static VPN OID data unavailable` en el firewall perimetral `FTG_milicic_border1_SNMP` (HostID `10697`).
2. **Incidencia P1 (Crítico / High):** `HPE MSA 2060 Storage: Service is down or unavailable` en la cabina de almacenamiento de producción `SRO-STO02` (HostID `10727`).

Tras un análisis pericial exhaustivo basado en telemetría de red, cruce de OIDs SNMP e inspección de tráfico en firewall, se determinó que **ambos eventos constituyen falsos positivos de indisponibilidad** que no afectan la operación ni los datos de la compañía. Conforme a las directivas del estándar de gobernanza `GEMINI.md`, se procedió al reconocimiento formal de los eventos en Zabbix, a la desactivación controlada de los triggers correspondientes para suprimir el ruido operativo, y a la documentación del procedimiento de reversión (*rollback*).

---

## 2. Matriz de Control de Cambios

| Parámetro | Incidencia 1: Firewall FortiGate | Incidencia 2: Storage HPE MSA |
| :--- | :--- | :--- |
| **Referencia** | Alerta P3 VPN OID | Alerta P1 Storage Service Down |
| **Host Afectado** | `FTG_milicic_border1_SNMP` (HostID `10697`) | `SRO-STO02` (HostID `10727`) |
| **Dirección IP** | `172.30.20.254` | `172.30.70.135` |
| **Trigger ID** | `38674` | `29355` |
| **Evento ID** | `174446793` | `174422629` |
| **Severidad Original** | Warning (P3) | High (P1 Crítico) |
| **Canal Telegram** | Alertas NOC / Redes | `Alertas-Guardia-P1` |
| **Diagnóstico** | Cruce inválido de OIDs en LLD legada | Bloqueo HTTPS por `Implicit Deny` en FortiGate |
| **Impacto Real** | **Nulo** (Túneles VPN 100% operativos) | **Nulo** (Storage y VMware 100% operativos) |
| **Acción en Trigger** | **Deshabilitado** (`status: 1`) | **Deshabilitado** (`status: 1` solo en host) |
| **Acción en LLD** | Regla `60782` **Deshabilitada** (`status: 1`) | No aplica |
| **Estado Evento** | **Reconocido con Comentario** (`action: 6`) | **Reconocido con Comentario** (`action: 6`) |
| **Notificación Telegram** | **Suprimida** | **Suprimida** |

---

## 3. Diagnóstico y Remediación en Detalle

### 3.1. Caso 1: FortiGate Border 1 - Legacy Static VPN OID
- **Síntoma:** Evento persistente por más de 30 minutos indicando datos no disponibles (`*UNKNOWN*`).
- **Causa Raíz:** Una regla de descubrimiento de bajo nivel (LLD) legada (`60782`, `ipsec.tunnel.discovery`) intentaba asociar los índices genéricos de interfaces de red (`1.3.6.1.2.1.31.1.1.1.1` de `IF-MIB`) con la tabla privada de Fortinet para túneles IPsec (`1.3.6.1.4.1.12356.101.12.2.1.1.3`). Al no coincidir los índices, el firewall respondía `No Such Instance`. Esto colocó a los 10 items descubiertos en estado *Not supported*, disparando la condición `nodata(30m) = 1` del trigger `38674`.
- **Evidencia de Operatividad:** Se constató que la regla oficial de Zabbix 7.0 `51382` (`vpn.tunnel.discovery`) se encuentra activa y recolecta métricas en tiempo real con 0 errores para la totalidad de túneles IPsec de la red corporativa (`sap-pri`, `sap-bkp`, `anielo1`, `anielo2`, `ros1sj1`, etc.).
- **Acciones Ejecutadas:**
  1. **Reconocimiento con Comentario de Auditoría:** `event_acknowledge` sobre `174446793`:
     > *"Falso positivo verificado. El monitoreo de túneles IPsec en este FortiGate opera correctamente a través de la regla LLD oficial 'vpn.tunnel.discovery' (OIDs privadas FortiOS). La regla legada 'ipsec.tunnel.discovery' y el trigger 38674 consultaban OIDs sin instancia activa. Se procede al cierre y desactivación del trigger."*
  2. **Desactivación del Trigger:** `trigger_update` sobre `38674` (`status: "1"`), adjuntando comentario técnico.
  3. **Desactivación de LLD Obsoleta:** `discoveryrule_update` sobre `60782` (`status: "1"`) para erradicar el sondeo SNMP inútil hacia el CPU del firewall.

### 3.2. Caso 2: Storage HPE MSA 2060 - Alerta Crítica P1 de Servicio Caído
- **Síntoma:** Alerta de máxima prioridad (P1 High) en Telegram indicando que el servicio HTTP/HTTPS del storage estaba fuera de línea.
- **Causa Raíz:** La sonda de monitoreo web de Zabbix intenta consultar la API REST del storage en el puerto TCP 443 (`https://172.30.70.135/api/show/system`). Dicho tráfico es descartado silenciosamente por la regla por defecto `Implicit Deny` del firewall perimetral FortiGate (interfaz `port1` hacia `port2`).
- **Evidencia de Operatividad:**
  - El hardware físico, controladoras redundantes A/B y discos del HPE MSA 2060 están en óptimas condiciones.
  - La conectividad ICMP desde el Zabbix Server (`172.30.20.61`) presenta 0% de pérdidas de paquetes con latencia promedio de 1.0 ms.
  - Los hipervisores VMware ESXi leen y escriben en los datastores VMFS montados sobre el storage sin degradación de I/O ni alarmas de vCenter.
- **Acciones Ejecutadas:**
  1. **Reconocimiento con Comentario de Auditoría:** `event_acknowledge` sobre `174422629`:
     > *"Falso positivo de hardware. Storage físico y datastores VMware ESXi 100% operativos (0% drop ICMP, latencia 1ms). La recolección de métricas HTTP/REST vía TCP 443 se encuentra bloqueada por regla de firewall FortiGate (Implicit Deny). Se inició solicitud de habilitación de firewall MIL-PND-001. Se deshabilita temporalmente el trigger en este host para evitar alertas P1 redundantes hasta la ejecución del cambio de red."*
  2. **Desactivación de Trigger en Host:** `trigger_update` sobre `29355` (`status: "1"`). Cumpliendo estrictamente con `GEMINI.md` Sección 2, la desactivación se aplicó de forma exclusiva sobre el host `SRO-STO02`, sin alterar la plantilla global `HPE MSA 2060 Storage by HTTP`.

---

## 4. Procedimiento de Reversión (*Rollback Runbook*)

Si fuera necesario reactivar los triggers por cambio en la arquitectura o tras la implementación de las reglas en el firewall:

### 4.1. Rollback para FortiGate Border 1
```json
// Reactivar Trigger 38674
{"method": "trigger.update", "params": {"triggerid": "38674", "status": "0"}}

// Reactivar Regla LLD 60782 (No recomendado salvo rediseño de OIDs)
{"method": "discoveryrule.update", "params": {"itemid": "60782", "status": "0"}}
```

### 4.2. Rollback para Storage HPE MSA 2060
Una vez aplicada la política de firewall en FortiOS según el ticket `MIL-PND-001` y validado el acceso con `curl -k https://172.30.70.135/api/show/system`:
```json
// Reactivar Trigger 29355 en SRO-STO02
{"method": "trigger.update", "params": {"triggerid": "29355", "status": "0"}}
```

---

## 5. Próximos Pasos y Recomendaciones

1. **Gestión de Cambio en Firewall (Fortinet):** Coordinar la ventana de mantenimiento para aplicar la regla de comunicación TCP 443 entre Zabbix Server (`172.30.20.61`) y las IPs de gestión de los storages (`172.30.70.135` y `172.30.70.136`), según lo descripto en el documento `MIL-PND-001`.
2. **Reactivación de Telemetría:** Tras la apertura del puerto, reactivar el trigger `29355` para recuperar la telemetría detallada de hardware (estado de discos, temperaturas, ventiladores y fuentes).
3. **Depuración de Plantillas Huérfanas:** Eliminar definitivamente la regla LLD obsoleta `60782` en el próximo ciclo de mantenimiento general de Zabbix.
