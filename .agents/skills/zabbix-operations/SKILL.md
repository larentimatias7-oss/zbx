---
name: zabbix-operations
description: >-
  Estándares operativos, diagnóstico y automatización para Zabbix Monitoring y Zabbix MCP Server en Milicic.
  Úsalo cuando interactúes con la API de Zabbix, configures hosts, plantillas SNMP, acciones de escalamiento,
  medios de notificación (Telegram, Email, Webhooks), o resuelvas incidentes de monitoreo de infraestructura.
---

# Skill: Operaciones y Estándares Zabbix - Milicic

Esta skill define las directivas, flujos y comandos estándar para administrar, consultar y diagnosticar el ecosistema de monitoreo Zabbix corporativo (`https://zabbix.mlccnet.local`) mediante la API oficial y herramientas MCP.

---

## 1. Arquitectura de Monitoreo y Acceso MCP

```
                                  ┌───────────────────────────────┐
                                  │   Zabbix Server / Frontend    │
                                  │   zabbix.mlccnet.local        │
                                  │   IP: 172.30.20.61            │
                                  └──────────────▲────────────────┘
                                                 │ HTTPS / JSON-RPC
                                                 │
                                  ┌──────────────┴────────────────┐
                                  │   Zabbix MCP Server (WSL)     │
                                  │   127.0.0.1:8080 (/mcp)       │
                                  │   127.0.0.1:9090 (Admin UI)   │
                                  └──────────────▲────────────────┘
                                                 │ Bearer Token
                                                 │
                                  ┌──────────────┴────────────────┐
                                  │       Antigravity Agent       │
                                  │       (zabbix MCP tools)      │
                                  └───────────────────────────────┘
```

- **Servidor Zabbix:** `https://zabbix.mlccnet.local` (IP: `172.30.20.61`, SNI obligatorio).
- **Zabbix MCP Server:** Servicio local en WSL (`/opt/zabbix-mcp/venv/bin/zabbix-mcp-server`), escuchando en el puerto local `8080` para MCP y `9090` para portal de administración.
- **Resolución de Nombres en WSL:** El entorno WSL debe contar con la entrada `172.30.20.61 zabbix.mlccnet.local` en `/etc/hosts` para alcanzar la API a través del túnel VPN.

---

## 2. Herramientas MCP y Comprobación de Salud

Antes de ejecutar consultas o modificaciones masivas:
1. **Verificar Salud del Conector:**
   - Ejecutar `health_check` en el servidor `zabbix`.
   - Si `server_1` o `production` retorna error, verificar que la entrada de DNS `/etc/hosts` en WSL esté presente y que la VPN esté activa.
2. **Consultas Seguras (`get`):**
   - Utilizar herramientas dedicadas (`host_get`, `problem_get`, `alert_get`, `mediatype_get`, `user_get`, `action_get`).
   - Para parámetros avanzados (`selectOperations`, `selectMedias`, `selectInterfaces`), emplear el diccionario `extra_params`.
3. **Principio de Solo Lectura:**
   - Toda investigación debe ser de lectura hasta contar con autorización para cambios.
   - Todo cambio debe documentar previamente: objetos afectados, estado previo, plan de rollback y verificación posterior.

---

## 3. Matriz de Severidades y Modelo de Alertas (P1, P2, P3)

El sistema de alertas de Milicic utiliza supresión de flapping y escalamiento progresivo por persistencia:

| Nivel | Severidad Zabbix | Demora de Escalamiento | Destinatarios (Grupos de Usuarios) | Canales | Objetivo Operativo |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P1 - Crítico** | `Disaster`, `High` | **Inmediato (0 min)** | `Alertas-Guardia-P1` (ID: 15) | Telegram (`Telegram_Test`, `Telegram_Test_Milicic`) | Caída total de sedes, fallas de core switches, hipervisores caídos. |
| **P2 - Redes** | `High`, `Average` | **10 minutos** | `Alertas-NOC-Redes` (ID: 16) | Telegram | Caída de enlaces redundantes, SD-WAN Health check dead, switches de acceso. |
| **P2 - Plataforma** | `High`, `Average` | **10 minutos** | `Alertas-SRE-Plataforma` (ID: 17) | Telegram | Servicios críticos de SO detenidos, degradación de VMs o bases de datos. |
| **P3 - Preventivo** | `Average`, `Warning` | **30 minutos** | `Alertas-NOC-Redes` y `Alertas-SRE-Plataforma` | Telegram | Espacio en disco > 85%, temperatura elevada, desincronización horaria NTP. |

> [!IMPORTANT]
> Los eventos transitorios que se resuelven antes de la ventana de persistencia (10 min en P2, 30 min en P3) **no generan ruido en los canales de Telegram**. Si un incidente se resuelve luego de notificado, Zabbix envía un mensaje de recuperación (*EVENTO RECUPERADO*).

---

## 4. Estándar Corporativo para Creación de Hosts

Al dar de alta nuevos activos en Zabbix:

### A. Nomenclatura del Host
- **Formato:** `<SEDE>-<TIPO_DISPOSITIVO>-<IDENTIFICADOR>`
  - Sedes: `SRO` (Rosario), `SSJ` (San Juan), `SER` (Sede Entre Ríos / Central), `AR-###` (Campamentos/Obras).
  - Ejemplos válidos: `SRO-E02-PB00-CORE02`, `SSJ-SWADM`, `SRO-SQL01`, `FTG_milicic_border1_HTTP`.

### B. Asignación de Interfaces y Protocolos
- **Switches y Routers:** Interfaz tipo **SNMP** (puerto 161, versión SNMPv2c).
- **Firewalls FortiGate:** Plantilla dual o SNMP (puerto 161).
- **Servidores Linux / Windows:** Interfaz tipo **Agent** (puerto 10050) utilizando Zabbix Agent 2.
- **Equipos sin agente:** Interfaz tipo **Agent** o **SNMP** asociada a la plantilla `ICMP Ping`.

### C. Plantillas Oficiales Aprobadas
- Switches Dell Networking: `Dell N-Series by SNMP` (ID: 10721).
- Switches HP / Aruba: `HP Comware HH3C by SNMP` o `HP Enterprise Switch by SNMP`.
- Firewalls Fortinet: `FortiGate by SNMP` (ID: 10604) o `FortiGate by HTTP` (ID: 10603).
- Servidores Windows: `Windows by Zabbix agent 2`.
- Servidores Linux: `Linux by Zabbix agent`.
- UPS y Energía: `Template Network Generic Device by SNMP` o plantilla del fabricante.

### D. Macros Requeridas
- Comunidad SNMP Global: `{$SNMP_COMMUNITY} = public` (o sobreescribir a nivel de host si el equipo utiliza una comunidad protegida).
- Umbral de disco crítico: `{$VFS.FS.PUSED.MAX.CRIT} = 90`.
- Umbral de disco advertencia: `{$VFS.FS.PUSED.MAX.WARN} = 80`.

---

## 5. Procedimiento para Canales de Telegram

### Requisitos Mandatorios de Telegram:
1. **Membresía del Bot:** Un bot de Telegram **no puede enviar mensajes** a un grupo ni canal a menos que haya sido añadido previamente como miembro o administrador con permisos de publicación.
2. **Formato de Chat ID:**
   - Grupos estándar: número negativo simple (ej. `-5468713329`).
   - Supergrupos y Canales: número negativo **con prefijo `-100`** (ej. `-1004383937012`).
   - Si se omite el prefijo en un supergrupo o si el bot no está agregado, Telegram responde con el error fatal `Sending failed: Bad Request: chat not found`.

### Lista de Bots Corporativos:
- **`Telegram_Test` (ID: 71):** `@inframilicic_bot` (Token: `8899338410:...`)
- **`Telegram_Test_Milicic` (ID: 72):** `@Milicic_bot` (Token: `8666455955:...`)

### Vinculación de Alertas a Usuarios:
1. El usuario debe tener configurado en su perfil de Zabbix (`Users -> Media`) el medio correspondiente (`Telegram_Test` o `Telegram_Test_Milicic`) con el `Send to` configurado con el Chat ID validado.
2. El usuario debe ser miembro de los grupos de destinatarios:
   - `Alertas-Guardia-P1` (ID: 15)
   - `Alertas-NOC-Redes` (ID: 16)
   - `Alertas-SRE-Plataforma` (ID: 17)

---

## 6. Diagnóstico y Mitigación de Link-Down / Microflapping

Para caídas de interfaz y alertas de flapping en switches:

1. **Protocolo Estricto de Recopilación de Evidencia:**
   - Nunca silenciar o deshabilitar un trigger de *Link Down* sin antes contrastar:
     * **LLDP:** Consultar las tablas de vecinos remotos (`lldpRemSysName`, `lldpRemPortDesc`, `lldpRemPortId`).
     * **Alias:** Verificar la descripción del puerto (`ifAlias`).
     * **LAG / LACP:** Comprobar si el puerto forma parte de un Port-Channel o agregado troncal.
   - **Regla Mandatoria:** Jamás modificar ni silenciar una plantilla global por un problema en un puerto individual. Usar macros de contexto, overrides o ajustes a nivel de prototipo de trigger.
2. **Script de Análisis de Flapping:**
   - Utilizar el script PowerShell `scripts/Analyze-LinkDownFlapping.ps1`:
     ```powershell
     powershell -File scripts/Analyze-LinkDownFlapping.ps1 -Days 7 -TopN 20
     ```
   - Este script clasifica automáticamente los eventos en:
     * **Microflapping:** Duración < 2 minutos en más del 80% de los casos (candidato a revisión de capa física, cableado o PoE).
     * **Long outages:** Cortes de más de 8 horas (candidato a ventana de horario o interfaz administrativa).
     * **Low frequency:** Eventos aislados sin recurrencia.

---

## 7. Troubleshooting de Entregas en Telegram (`chat not found`)

Si en el log de acciones (`alert_get`) se detectan errores `Bad Request: chat not found`:
1. Identificar el usuario y medio afectado (`mediatypeid 71` o `72`).
2. Verificar en Zabbix (`user_get` con `selectMedias: "extend"`) el valor configurado en `sendto`.
3. Validar:
   - ¿Lleva el prefijo `-100` si es un supergrupo o canal?
   - ¿Fue expulsado el bot del grupo o se recreó el grupo cambiando de ID?
   - ¿Tiene el usuario permisos de lectura sobre el host que generó el evento?
4. **Seguridad:** No cambiar destinatarios a ciegas ni exponer Chat IDs en la bitácora pública.

---

## 8. Estándar para Monitoreo de Respaldos (Veeam Backup)

1. **Diferenciación Conceptual:**
   - El estado de los servicios Windows de Veeam (`Veeam Backup Service`, `Veeam Broker Service`, etc.) **no demuestra que los backups se estén ejecutando con éxito**.
   - El servicio `VSS` (Volume Shadow Copy) en servidores hipervisores (como `SSJ-HPV01`) inicia **bajo demanda** durante la ejecución de los backups. Configurar un disparador de ejecución permanente genera decenas de falsos positivos. Usar únicamente el disparador de tipo de inicio deshabilitado (`service.info["VSS",startup]=3`).
2. **Extracción de Telemetría Real de Tareas:**
   - En el servidor de backup (`SSJ-BKP01`, hostid 10718), ejecutar el script de solo lectura:
     ```powershell
     pwsh -File scripts/Get-VeeamVmBackupStatus.ps1 -VmName <NombreVM>
     ```
   - Este script utiliza los cmdlets oficiales `Get-VBRBackupSession`, `Get-VBRTaskSession` y `Get-VBRRestorePoint` y emite un JSON compacto con:
     * Nombre del job (`matchedJobNames`).
     * Último resultado de tarea (`taskResult: Success | Warning | Failed`).
     * Antigüedad del último punto de restauración (`latestRestorePointUtc`).

---

## 9. Procedimiento de Consolidación de Hosts Duplicados

Cuando dos registros en Zabbix compartan la misma dirección IP (como ocurre en G01 `192.168.0.224` con `D04` ID 10713 y `DIS01` ID 10799):
1. **Determinar el Registro Canónico:**
   - Evaluar qué plantilla es la más adecuada (ej. Comware vs genérica).
   - Comparar cantidad de ítems habilitados y no soportados.
   - Verificar si el nombre SNMP coincide con la nomenclatura de inventario.
2. **Auditoría de Referencias Cruzadas ANTES de Deshabilitar:**
   - **Dashboards:** Revisar si existen widgets que referencien al hostid que se desea retirar (ej. Dashboard 408 `NOC Infraestructura` contiene 9 widgets que referencian a `D04`).
   - **Mapas:** Verificar si el host es un elemento en mapas activos (ej. Mapa Rosario 8, elemento 94).
   - **Triggers de Dependencia:** Comprobar si otros hosts dependen de disparadores del host a retirar.
3. **Mitigación Temporal:**
   - Si no se puede retirar el host de inmediato debido a dependencias en dashboards, deshabilitar exclusivamente los disparadores duplicados que generan problemas abiertos simultáneos en ambos hosts.

---

## 10. Catálogo de Scripts Operativos Locales (`scripts/`)

| Script | Lenguaje | Propósito |
| :--- | :--- | :--- |
| `scripts/Get-VeeamVmBackupStatus.ps1` | PowerShell | Extrae sesiones, tareas y puntos de restauración de Veeam en JSON para una VM. |
| `scripts/Analyze-LinkDownFlapping.ps1` | PowerShell | Analiza eventos de Link-Down vía API de Zabbix y categoriza microflapping vs caídas reales. |
| `scripts/Analyze-ZabbixNoise.ps1` | PowerShell | Mide distribución de severidades y triggers más ruidosos en los últimos 30 días. |
| `scripts/Analyze-ZabbixItems.ps1` | PowerShell | Audita ítems no soportados agrupados por mensaje de error y host. |
